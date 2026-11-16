package com.devmatch.controller;

import com.devmatch.dto.ApiResponse;
import com.devmatch.dto.ProjectBriefDto;
import com.devmatch.dto.ProjectCreateRequest;
import com.devmatch.model.Project;
import com.devmatch.model.ProjectBrief;
import com.devmatch.model.ProjectStatus;
import com.devmatch.model.User;
import com.devmatch.service.AiBriefService;
import com.devmatch.service.AuthService;
import com.devmatch.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private AiBriefService aiBriefService;

    @Autowired
    private AuthService authService;

    @PostMapping("/analyse-idea")
    public ResponseEntity<ApiResponse<ProjectBrief>> quickAnalyseIdea(@RequestBody java.util.Map<String, String> body) {
        String idea = body.getOrDefault("idea", "");
        if (idea.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Idea text cannot be empty"));
        }
        ProjectBrief brief = aiBriefService.quickAnalyseIdea(idea);
        return ResponseEntity.ok(ApiResponse.ok("Gemini 2.5 Flash brief generated successfully", brief));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Project>> createProject(@Valid @RequestBody ProjectCreateRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        Project project = projectService.createProject(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Project created successfully", project));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Project>>> getMyProjects() {
        User user = authService.getCurrentAuthenticatedUser();
        List<Project> projects = projectService.getFounderProjects(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(projects));
    }

    @GetMapping("/browse")
    public ResponseEntity<ApiResponse<List<Project>>> getOpenProjectsForBrowse() {
        // Feature 1: Only return status = OPEN projects to developers
        List<Project> projects = projectService.getOpenProjectsForDevelopers();
        return ResponseEntity.ok(ApiResponse.ok(projects));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Project>> getProjectById(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        try {
            // Feature 1: Enforce on server - only founder, hired developer, and admin can access IN_PROGRESS project
            Project project = projectService.getProjectByIdWithAccessControl(id, user);
            return ResponseEntity.ok(ApiResponse.ok(project));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteProject(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        projectService.deleteDraftProject(id, user.getId());
        return ResponseEntity.ok(ApiResponse.ok("Project deleted successfully", null));
    }

    @PostMapping("/{id}/analyse")
    public ResponseEntity<ApiResponse<ProjectBrief>> analyseProject(@PathVariable String id) {
        Project project = projectService.getProjectById(id);
        ProjectBrief brief = aiBriefService.generateBrief(project);
        brief.setProjectId(id);
        // Persist the generated brief
        ProjectBrief saved = aiBriefService.updateAndConfirmBrief(id, new ProjectBriefDto());
        saved.setSummary(brief.getSummary());
        saved.setCoreFeatures(brief.getCoreFeatures());
        saved.setOptionalFeatures(brief.getOptionalFeatures());
        saved.setRequiredSkills(brief.getRequiredSkills());
        saved.setSuggestedStack(brief.getSuggestedStack());
        saved.setComplexity(brief.getComplexity());
        saved.setSuggestedMilestones(brief.getSuggestedMilestones());
        saved.setConfirmedByFounder(false);
        ProjectBrief finalBrief = aiBriefService.generateOrGetBrief(id);
        return ResponseEntity.ok(ApiResponse.ok("AI Brief generated successfully", brief));
    }

    @GetMapping("/{id}/brief")
    public ResponseEntity<ApiResponse<ProjectBrief>> getProjectBrief(@PathVariable String id) {
        ProjectBrief brief = aiBriefService.generateOrGetBrief(id);
        return ResponseEntity.ok(ApiResponse.ok(brief));
    }

    @PutMapping("/{id}/brief")
    public ResponseEntity<ApiResponse<ProjectBrief>> updateBrief(
            @PathVariable String id,
            @RequestBody ProjectBriefDto dto) {
        ProjectBrief brief = aiBriefService.updateAndConfirmBrief(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Brief updated and confirmed", brief));
    }

    @PostMapping("/{id}/hire/{developerId}")
    public ResponseEntity<ApiResponse<Project>> hireDeveloper(
            @PathVariable String id,
            @PathVariable String developerId) {
        User user = authService.getCurrentAuthenticatedUser();
        Project project = projectService.hireDeveloper(id, developerId, user);
        return ResponseEntity.ok(ApiResponse.ok("Developer hired successfully. Project closed to other developers and collaboration chat initialized.", project));
    }

    @PostMapping("/{id}/assign/{developerId}")
    public ResponseEntity<ApiResponse<Project>> assignDeveloper(
            @PathVariable String id,
            @PathVariable String developerId) {
        User user = authService.getCurrentAuthenticatedUser();
        Project project = projectService.hireDeveloper(id, developerId, user);
        return ResponseEntity.ok(ApiResponse.ok("Developer hired and assigned to project", project));
    }

    @PostMapping("/{id}/cancel-hire")
    public ResponseEntity<ApiResponse<Project>> cancelHire(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        Project project = projectService.cancelHire(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Hire cancelled. Project is now OPEN and visible to all developers again.", project));
    }

    @PostMapping("/{id}/retry-analysis")
    public ResponseEntity<ApiResponse<Project>> retryAiAnalysis(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        Project project = projectService.retryAiAnalysis(id, user);
        return ResponseEntity.ok(ApiResponse.ok("AI Analysis regenerated successfully", project));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<Project>> completeProject(@PathVariable String id) {
        Project project = projectService.updateProjectStatus(id, ProjectStatus.COMPLETED);
        return ResponseEntity.ok(ApiResponse.ok("Project marked as Completed", project));
    }
}

