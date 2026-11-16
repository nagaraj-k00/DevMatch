package com.devmatch.service;

import com.devmatch.dto.ReviewDto;
import com.devmatch.model.*;
import com.devmatch.repository.DeveloperProfileRepository;
import com.devmatch.repository.ProjectRepository;
import com.devmatch.repository.ReviewRepository;
import com.devmatch.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DeveloperProfileRepository developerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MatchingService matchingService;

    public Review createReview(String projectId, User reviewer, ReviewDto dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        if (project.getStatus() != ProjectStatus.COMPLETED) {
            throw new IllegalStateException("Reviews can only be submitted for COMPLETED projects");
        }

        // Check if reviewer already reviewed
        Optional<Review> existing = reviewRepository.findByProjectIdAndReviewerId(projectId, reviewer.getId());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("You have already submitted a review for this project");
        }

        String revieweeId = dto.getRevieweeId();
        if (revieweeId == null || revieweeId.isBlank()) {
            // Auto determine reviewee
            if (reviewer.getId().equals(project.getFounderId())) {
                revieweeId = project.getSelectedDeveloperId();
            } else {
                revieweeId = project.getFounderId();
            }
        }

        final String targetRevieweeId = revieweeId;
        Review review = new Review(
                projectId,
                reviewer.getId(),
                targetRevieweeId,
                reviewer.getName(),
                reviewer.getRole(),
                dto.getRating(),
                dto.getComment()
        );

        Review saved = reviewRepository.save(review);

        // If reviewing a developer, recalculate their average rating and update completedProjects
        User reviewee = userRepository.findById(targetRevieweeId).orElse(null);
        if (reviewee != null && reviewee.getRole() == Role.DEVELOPER) {
            developerProfileRepository.findByUserId(targetRevieweeId).ifPresent(profile -> {
                List<Review> developerReviews = reviewRepository.findByRevieweeId(targetRevieweeId);
                double totalRating = developerReviews.stream().mapToInt(Review::getRating).sum();
                double newAvg = Math.round((totalRating / developerReviews.size()) * 10.0) / 10.0;
                profile.setAverageRating(newAvg);
                profile.setRatingCount(developerReviews.size());
                profile.setCompletedProjects(profile.getCompletedProjects() + 1);
                developerProfileRepository.save(profile);

                // Trigger re-matching update for this developer
                matchingService.refreshMatchesForDeveloper(targetRevieweeId);
            });
        }

        return saved;
    }

    public List<Review> getProjectReviews(String projectId) {
        return reviewRepository.findByProjectId(projectId);
    }

    public List<Review> getUserReviews(String userId) {
        return reviewRepository.findByRevieweeId(userId);
    }
}
