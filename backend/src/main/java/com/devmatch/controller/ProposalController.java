package com.devmatch.controller;

import com.devmatch.dto.ApiResponse;
import com.devmatch.model.*;
import com.devmatch.repository.DeveloperProfileRepository;
import com.devmatch.repository.ProjectRepository;
import com.devmatch.repository.ProposalRepository;
import com.devmatch.service.AuthService;
import com.devmatch.service.NotificationService;
import com.devmatch.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class ProposalController {

    @Autowired
    private ProposalRepository proposalRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DeveloperProfileRepository developerProfileRepository;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private AuthService authService;

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/projects/{id}/proposals")
    public ResponseEntity<ApiResponse<Proposal>> submitProposal(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        User user = authService.getCurrentAuthenticatedUser();
        if (user.getRole() != Role.DEVELOPER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Only developers can submit proposals"));
        }

        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));

        if (project.getStatus() != ProjectStatus.OPEN) {
            return ResponseEntity.badRequest().body(ApiResponse.error("This project is not accepting proposals (Current status: " + project.getStatus() + ")"));
        }

        // Validate Bid Amount > 0
        Object bid = body.get("bidAmount");
        double bidAmount = 0.0;
        if (bid instanceof Number) {
            bidAmount = ((Number) bid).doubleValue();
        } else if (bid != null && !bid.toString().isBlank()) {
            try {
                bidAmount = Double.parseDouble(bid.toString());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Quoted bid amount must be a valid number");
            }
        }
        if (bidAmount <= 0) {
            throw new IllegalArgumentException("Quoted bid amount must be greater than 0");
        }

        // Validate Estimated Time (1-52 weeks)
        int weeks = 2;
        if (body.get("estimatedWeeks") instanceof Number) {
            weeks = ((Number) body.get("estimatedWeeks")).intValue();
        } else if (body.get("estimatedDays") instanceof Number) {
            int days = ((Number) body.get("estimatedDays")).intValue();
            weeks = Math.max(1, (int) Math.ceil(days / 7.0));
        } else if (body.get("estimatedDays") != null) {
            try {
                int days = Integer.parseInt(body.get("estimatedDays").toString());
                weeks = Math.max(1, (int) Math.ceil(days / 7.0));
            } catch (NumberFormatException ignored) {}
        }
        if (weeks < 1 || weeks > 52) {
            throw new IllegalArgumentException("Estimated timeline must be between 1 and 52 weeks");
        }

        // Validate Proposal Message (50-1,000 characters)
        String coverLetter = (String) body.getOrDefault("coverLetter", "");
        if (coverLetter == null || coverLetter.trim().length() < 50) {
            int currentLen = coverLetter == null ? 0 : coverLetter.trim().length();
            throw new IllegalArgumentException("Proposal message must be at least 50 characters (current length: " + currentLen + ")");
        }
        if (coverLetter.trim().length() > 1000) {
            throw new IllegalArgumentException("Proposal message cannot exceed 1,000 characters (current length: " + coverLetter.trim().length() + ")");
        }

        Optional<Proposal> existing = proposalRepository.findByProjectIdAndDeveloperId(id, user.getId());
        Proposal proposal = existing.orElse(new Proposal());

        proposal.setProjectId(id);
        proposal.setDeveloperId(user.getId());
        proposal.setDeveloperName(user.getName());
        proposal.setDeveloperEmail(user.getEmail());
        proposal.setDeveloperImage(user.getProfileImage());

        developerProfileRepository.findByUserId(user.getId()).ifPresent(p -> {
            proposal.setDeveloperSkills(p.getSkills());
            proposal.setDeveloperRate(p.getExpectedRate());
            proposal.setDeveloperRating(p.getAverageRating());
        });

        proposal.setCoverLetter(coverLetter.trim());
        proposal.setBidAmount(bidAmount);
        proposal.setEstimatedDays(weeks * 7);

        proposal.setStatus(ProposalStatus.PENDING);
        proposal.setUpdatedAt(Instant.now());
        Proposal saved = proposalRepository.save(proposal);

        notificationService.createNotification(
                project.getFounderId(),
                "PROPOSAL",
                user.getName() + " submitted a proposal for " + project.getTitle(),
                "/project/" + id
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Proposal submitted successfully", saved));
    }

    @GetMapping("/projects/{id}/proposals")
    public ResponseEntity<ApiResponse<List<Proposal>>> getProjectProposals(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));

        if (user.getId().equals(project.getFounderId()) || user.getRole() == Role.ADMIN) {
            List<Proposal> proposals = proposalRepository.findByProjectId(id);
            return ResponseEntity.ok(ApiResponse.ok(proposals));
        } else {
            // Developers only see their own proposal
            Optional<Proposal> myProp = proposalRepository.findByProjectIdAndDeveloperId(id, user.getId());
            return ResponseEntity.ok(ApiResponse.ok(myProp.map(List::of).orElse(List.of())));
        }
    }

    @PostMapping("/proposals/{id}/accept")
    public ResponseEntity<ApiResponse<Project>> acceptProposalAndHire(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + id));

        Project project = projectService.hireDeveloper(proposal.getProjectId(), proposal.getDeveloperId(), user);
        return ResponseEntity.ok(ApiResponse.ok("Proposal accepted and developer hired!", project));
    }

    @GetMapping("/proposals/my")
    public ResponseEntity<ApiResponse<List<Proposal>>> getMyProposals() {
        User user = authService.getCurrentAuthenticatedUser();
        List<Proposal> list = proposalRepository.findByDeveloperId(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }
}

