package com.devmatch.service;

import com.devmatch.model.*;
import com.devmatch.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class MatchingService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectBriefRepository projectBriefRepository;

    @Autowired
    private DeveloperProfileRepository developerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeveloperMatchRepository developerMatchRepository;

    public List<DeveloperMatch> findMatchesForProject(String projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        String hiredDevId = project.getHiredDeveloperId() != null 
                ? project.getHiredDeveloperId() 
                : project.getSelectedDeveloperId();

        // If a developer is already hired for this project, HIDE all other developers.
        // Return ONLY the hired developer's match details!
        if (hiredDevId != null || project.getStatus() != ProjectStatus.OPEN) {
            if (hiredDevId != null) {
                Optional<DeveloperMatch> hiredMatch = developerMatchRepository.findByProjectIdAndDeveloperId(projectId, hiredDevId);
                if (hiredMatch.isPresent()) {
                    return List.of(hiredMatch.get());
                }
                Optional<User> devUser = userRepository.findById(hiredDevId);
                ProjectBrief brief = projectBriefRepository.findByProjectId(projectId).orElse(null);
                if (devUser.isPresent() && brief != null) {
                    DeveloperProfile profile = developerProfileRepository.findByUserId(hiredDevId)
                            .orElse(new DeveloperProfile(hiredDevId));
                    DeveloperMatch match = computeMatchScore(project, brief, profile, devUser.get());
                    return List.of(developerMatchRepository.save(match));
                }
            }
            return Collections.emptyList();
        }

        ProjectBrief brief = projectBriefRepository.findByProjectId(projectId)
                .orElse(null);

        if (brief == null) {
            return Collections.emptyList();
        }

        List<User> developers = userRepository.findByRoleAndActive(Role.DEVELOPER, true);
        List<DeveloperMatch> results = new ArrayList<>();

        for (User devUser : developers) {
            DeveloperProfile profile = developerProfileRepository.findByUserId(devUser.getId())
                    .orElse(new DeveloperProfile(devUser.getId()));

            DeveloperMatch match = computeMatchScore(project, brief, profile, devUser);
            if (match.getTotalScore() >= 40.0) {
                // Save or update match record
                Optional<DeveloperMatch> existing = developerMatchRepository.findByProjectIdAndDeveloperId(projectId, devUser.getId());
                if (existing.isPresent()) {
                    match.setId(existing.get().getId());
                }
                match = developerMatchRepository.save(match);
                results.add(match);
            }
        }

        results.sort((a, b) -> Double.compare(b.getTotalScore(), a.getTotalScore()));
        return results;
    }

    public List<DeveloperMatch> findProjectsForDeveloper(String developerId) {
        List<DeveloperMatch> allMatches = developerMatchRepository.findByDeveloperIdOrderByTotalScoreDesc(developerId);
        List<DeveloperMatch> filtered = new ArrayList<>();
        for (DeveloperMatch m : allMatches) {
            Optional<Project> pOpt = projectRepository.findById(m.getProjectId());
            if (pOpt.isPresent()) {
                Project p = pOpt.get();
                boolean isHiredThis = developerId.equals(p.getHiredDeveloperId()) || developerId.equals(p.getSelectedDeveloperId());
                if (isHiredThis) {
                    // Include project where this developer is the hired one
                    filtered.add(m);
                } else if (p.getStatus() == ProjectStatus.OPEN && p.getHiredDeveloperId() == null && p.getSelectedDeveloperId() == null) {
                    // Only return OPEN projects where NO developer has been hired yet
                    filtered.add(m);
                }
            }
        }
        return filtered;
    }

    public void removeMatchesForHiredProject(String projectId, String hiredDeveloperId) {
        List<DeveloperMatch> projectMatches = developerMatchRepository.findByProjectIdOrderByTotalScoreDesc(projectId);
        for (DeveloperMatch m : projectMatches) {
            if (!m.getDeveloperId().equals(hiredDeveloperId)) {
                developerMatchRepository.delete(m);
            }
        }
    }

    public void refreshMatchesForDeveloper(String developerId) {
        User devUser = userRepository.findById(developerId).orElse(null);
        if (devUser == null || devUser.getRole() != Role.DEVELOPER) return;

        DeveloperProfile profile = developerProfileRepository.findByUserId(developerId)
                .orElse(new DeveloperProfile(developerId));

        List<Project> openProjects = projectRepository.findByStatus(ProjectStatus.OPEN);
        for (Project project : openProjects) {
            projectBriefRepository.findByProjectId(project.getId()).ifPresent(brief -> {
                DeveloperMatch match = computeMatchScore(project, brief, profile, devUser);
                if (match.getTotalScore() >= 40.0) {
                    Optional<DeveloperMatch> existing = developerMatchRepository.findByProjectIdAndDeveloperId(project.getId(), developerId);
                    existing.ifPresent(developerMatch -> match.setId(developerMatch.getId()));
                    developerMatchRepository.save(match);
                } else {
                    developerMatchRepository.findByProjectIdAndDeveloperId(project.getId(), developerId)
                            .ifPresent(m -> developerMatchRepository.delete(m));
                }
            });
        }
    }

    public DeveloperMatch computeMatchScore(Project project, ProjectBrief brief, DeveloperProfile profile, User user) {
        DeveloperMatch match = new DeveloperMatch();
        match.setProjectId(project.getId());
        match.setDeveloperId(user.getId());
        match.setGeneratedAt(Instant.now());

        // 1. Skills match (40 points max)
        List<String> required = brief.getRequiredSkills() != null ? brief.getRequiredSkills() : new ArrayList<>();
        List<String> devSkills = profile.getSkills() != null ? profile.getSkills() : new ArrayList<>();

        double skillScore = 0.0;
        int matchedSkillsCount = 0;
        if (!required.isEmpty()) {
            for (String req : required) {
                for (String ds : devSkills) {
                    if (ds.equalsIgnoreCase(req) || ds.toLowerCase().contains(req.toLowerCase()) || req.toLowerCase().contains(ds.toLowerCase())) {
                        matchedSkillsCount++;
                        break;
                    }
                }
            }
            double ratio = (double) matchedSkillsCount / required.size();
            skillScore = Math.min(40.0, ratio * 40.0);
        } else {
            skillScore = 30.0; // default if no specific skills listed
        }
        match.setSkillScore(Math.round(skillScore * 10.0) / 10.0);

        // 2. Experience (20 points max): min(20, years * 5 + completed * 2)
        int expYears = profile.getYearsOfExperience();
        int completed = profile.getCompletedProjects();
        double expScore = Math.min(20.0, (expYears * 5.0) + (completed * 2.0));
        match.setExperienceScore(Math.round(expScore * 10.0) / 10.0);

        // 3. Budget fit (15 points max)
        double devRate = profile.getExpectedRate();
        double budgetMax = project.getBudgetMax() > 0 ? project.getBudgetMax() : 2000.0;
        double budgetScore = 15.0;

        if (devRate > 0) {
            // Assume project estimated hours = 40 (or compare rate directly with budget)
            double estimatedCost = devRate * 40.0;
            if (estimatedCost <= budgetMax) {
                budgetScore = 15.0;
            } else {
                double diff = estimatedCost - budgetMax;
                double penalty = (diff / budgetMax) * 15.0;
                budgetScore = Math.max(2.0, 15.0 - penalty);
            }
        }
        match.setBudgetScore(Math.round(budgetScore * 10.0) / 10.0);

        // 4. Timeline / availability (15 points max)
        double timelineScore = 15.0;
        String avail = profile.getAvailability() != null ? profile.getAvailability().toUpperCase() : "AVAILABLE";
        if (avail.contains("AVAILABLE") || avail.contains("FULL")) {
            timelineScore = 15.0;
        } else if (avail.contains("PART")) {
            timelineScore = 10.0;
        } else {
            timelineScore = 5.0;
        }
        match.setTimelineScore(timelineScore);

        // 5. Rating and reviews (10 points max)
        double ratingScore;
        if (profile.getRatingCount() > 0) {
            ratingScore = (profile.getAverageRating() / 5.0) * 10.0;
        } else {
            ratingScore = 5.0; // Neutral 5 points for new developers as per PRD Section 7
        }
        match.setRatingScore(Math.round(ratingScore * 10.0) / 10.0);

        double total = match.getSkillScore() + match.getExperienceScore() + match.getBudgetScore() + match.getTimelineScore() + match.getRatingScore();
        match.setTotalScore(Math.min(100.0, Math.round(total * 10.0) / 10.0));

        match.setBreakdownReason(String.format("Skills: %s/%s (%s pts) | Experience: %s yrs (%s pts) | Budget: %s pts | Availability: %s pts | Rating: %s pts",
                matchedSkillsCount, required.size(), match.getSkillScore(), expYears, match.getExperienceScore(), match.getBudgetScore(), match.getTimelineScore(), match.getRatingScore()));

        return match;
    }
}

