package com.devmatch.service;

import com.devmatch.dto.ProjectCreateRequest;
import com.devmatch.model.*;
import com.devmatch.repository.ProjectRepository;
import com.devmatch.repository.ProposalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProposalRepository proposalRepository;

    @Autowired
    private AiBriefService aiBriefService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    @Lazy
    private MatchingService matchingService;

    @Autowired
    @Lazy
    private ChatService chatService;

    public Project createProject(User founder, ProjectCreateRequest req) {
        if (founder.getRole() != Role.FOUNDER && founder.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Only founders can create projects");
        }

        // Validate Category
        if (!ProjectCreateRequest.PREDEFINED_CATEGORIES.contains(req.getCategory())) {
            throw new IllegalArgumentException("Category '" + req.getCategory() + "' is not supported. Please choose from the predefined category list");
        }

        // Validate Budget
        if (req.getBudgetMin() == null || req.getBudgetMin() < 500) {
            throw new IllegalArgumentException("Minimum budget must be at least ₹500");
        }
        if (req.getBudgetMax() == null || req.getBudgetMax() <= req.getBudgetMin()) {
            throw new IllegalArgumentException("Maximum budget must be greater than minimum budget");
        }

        // Validate Timeline (1-52 weeks)
        int weeks = 4;
        if (req.getTimelineWeeks() != null) {
            weeks = req.getTimelineWeeks();
        } else if (req.getTimeline() != null) {
            String digits = req.getTimeline().replaceAll("[^0-9]", " ").trim();
            if (!digits.isEmpty()) {
                String[] parts = digits.split("\\s+");
                try {
                    weeks = Integer.parseInt(parts[parts.length - 1]);
                } catch (NumberFormatException ignored) {}
            }
        }
        if (weeks < 1 || weeks > 52) {
            throw new IllegalArgumentException("Project timeline must be between 1 and 52 weeks");
        }

        Project project = new Project();
        project.setFounderId(founder.getId());
        project.setTitle(req.getTitle().trim());
        project.setDescription(req.getDescription().trim());
        project.setCategory(req.getCategory());
        project.setBudgetMin(req.getBudgetMin());
        project.setBudgetMax(req.getBudgetMax());
        project.setTimeline(weeks + (weeks == 1 ? " week" : " weeks"));
        project.setStatus(ProjectStatus.DRAFT);
        project.setCreatedAt(Instant.now());
        project.setUpdatedAt(Instant.now());

        Project saved = projectRepository.save(project);

        // Feature 3: Automatically analyze the founder's input without any manual extra step
        try {
            ProjectBrief brief = aiBriefService.generateBrief(saved);
            brief.setProjectId(saved.getId());
            brief.setConfirmedByFounder(false);
            aiBriefService.generateOrGetBrief(saved.getId()); // persist or update
            saved.setAiAnalysisFailed(false);
            
            // Automatically score and rank matches based on AI brief's required skills
            try {
                matchingService.findMatchesForProject(saved.getId());
            } catch (Exception ignored) {}
        } catch (Exception e) {
            // Keep the founder's raw project saved as DRAFT; never lose data
            saved.setAiAnalysisFailed(true);
        }

        return projectRepository.save(saved);
    }

    public Project retryAiAnalysis(String projectId, User founder) {
        Project project = getProjectById(projectId);
        if (!project.getFounderId().equals(founder.getId()) && founder.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Unauthorized to modify this project");
        }

        try {
            ProjectBrief brief = aiBriefService.generateBrief(project);
            brief.setProjectId(projectId);
            aiBriefService.generateOrGetBrief(projectId);
            project.setAiAnalysisFailed(false);
            matchingService.findMatchesForProject(projectId);
        } catch (Exception e) {
            project.setAiAnalysisFailed(true);
            throw new RuntimeException("AI analysis failed: " + e.getMessage());
        }

        return projectRepository.save(project);
    }

    public List<Project> getFounderProjects(String founderId) {
        return projectRepository.findByFounderIdOrderByCreatedAtDesc(founderId);
    }

    public List<Project> getOpenProjectsForDevelopers() {
        // Feature 1: Only return status = OPEN projects to developers in browse/search that do NOT have a hired developer
        return projectRepository.findByStatusOrderByCreatedAtDesc(ProjectStatus.OPEN).stream()
                .filter(p -> p.getHiredDeveloperId() == null && p.getSelectedDeveloperId() == null)
                .toList();
    }

    public Project getProjectById(String projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
    }

    public Project getProjectByIdWithAccessControl(String projectId, User currentUser) {
        Project project = getProjectById(projectId);

        // Feature 1: Enforce on the server: only the founder, the hired developer, and admin can call GET /api/projects/{id} for an IN_PROGRESS project. Any other developer gets 403.
        if (project.getStatus() == ProjectStatus.IN_PROGRESS || project.getStatus() == ProjectStatus.COMPLETED) {
            if (currentUser != null && currentUser.getRole() == Role.DEVELOPER) {
                String hiredDevId = project.getHiredDeveloperId();
                if (hiredDevId == null || !hiredDevId.equals(currentUser.getId())) {
                    throw new AccessDeniedException("Forbidden: This project is in progress with another developer and closed to other developers.");
                }
            }
        }

        return project;
    }

    public Project updateProjectStatus(String projectId, ProjectStatus status) {
        Project project = getProjectById(projectId);
        project.setStatus(status);
        project.setUpdatedAt(Instant.now());
        return projectRepository.save(project);
    }

    public void deleteDraftProject(String projectId, String founderId) {
        Project project = getProjectById(projectId);
        if (!project.getFounderId().equals(founderId)) {
            throw new IllegalArgumentException("Unauthorized: you do not own this project");
        }
        if (project.getStatus() != ProjectStatus.DRAFT) {
            throw new IllegalArgumentException("Only DRAFT projects can be deleted");
        }
        projectRepository.delete(project);
    }

    // Feature 1: Founder accepts proposal and hires a developer
    public Project hireDeveloper(String projectId, String developerId, User founder) {
        Project project = getProjectById(projectId);
        if (!project.getFounderId().equals(founder.getId()) && founder.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only the project founder can hire a developer");
        }

        // Set status to IN_PROGRESS and store hiredDeveloperId
        project.setStatus(ProjectStatus.IN_PROGRESS);
        project.setHiredDeveloperId(developerId);
        project.setSelectedDeveloperId(developerId);
        project.setUpdatedAt(Instant.now());
        Project saved = projectRepository.save(project);

        // Any other developer who already sent a proposal gets status = CLOSED_NOT_SELECTED and in-app notification
        List<Proposal> proposals = proposalRepository.findByProjectId(projectId);
        for (Proposal prop : proposals) {
            if (prop.getDeveloperId().equals(developerId)) {
                prop.setStatus(ProposalStatus.ACCEPTED);
                prop.setUpdatedAt(Instant.now());
                proposalRepository.save(prop);
            } else {
                prop.setStatus(ProposalStatus.CLOSED_NOT_SELECTED);
                prop.setUpdatedAt(Instant.now());
                proposalRepository.save(prop);

                notificationService.createNotification(
                        prop.getDeveloperId(),
                        "PROJECT",
                        "This project is no longer accepting developers.",
                        "/developer"
                );
            }
        }

        // Notify the hired developer
        notificationService.createNotification(
                developerId,
                "PROJECT",
                "Congratulations! You have been hired for project: " + project.getTitle() + ". You can now collaborate and manage milestones.",
                "/project/" + projectId
        );

        // Feature 2: Automatically create one conversation containing exactly founder and hired developer
        try {
            chatService.getOrCreateConversation(projectId, project.getFounderId(), developerId);
        } catch (Exception ignored) {}

        // Remove this project from other developers' match list
        try {
            matchingService.removeMatchesForHiredProject(projectId, developerId);
        } catch (Exception ignored) {}

        return saved;
    }

    // Feature 1: Cancel hire and set project back to OPEN
    public Project cancelHire(String projectId, User founder) {
        Project project = getProjectById(projectId);
        if (!project.getFounderId().equals(founder.getId()) && founder.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only the project founder can cancel a hire");
        }

        String previousDevId = project.getHiredDeveloperId();

        project.setStatus(ProjectStatus.OPEN);
        project.setHiredDeveloperId(null);
        project.setSelectedDeveloperId(null);
        project.setUpdatedAt(Instant.now());
        Project saved = projectRepository.save(project);

        // Re-open project: recalculate matches so it becomes visible to all developers again
        try {
            matchingService.findMatchesForProject(projectId);
        } catch (Exception ignored) {}

        if (previousDevId != null) {
            notificationService.createNotification(
                    previousDevId,
                    "PROJECT",
                    "The hire on project '" + project.getTitle() + "' has been cancelled by the founder.",
                    "/developer"
            );
        }

        return saved;
    }
}

