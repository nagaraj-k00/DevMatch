package com.devmatch.controller;

import com.devmatch.dto.ApiResponse;
import com.devmatch.dto.ReviewDto;
import com.devmatch.model.Review;
import com.devmatch.model.User;
import com.devmatch.service.AuthService;
import com.devmatch.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private AuthService authService;

    @PostMapping("/projects/{id}/reviews")
    public ResponseEntity<ApiResponse<Review>> createReview(
            @PathVariable String id,
            @Valid @RequestBody ReviewDto dto) {
        User user = authService.getCurrentAuthenticatedUser();
        Review review = reviewService.createReview(id, user, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Review submitted successfully", review));
    }

    @GetMapping("/projects/{id}/reviews")
    public ResponseEntity<ApiResponse<List<Review>>> getProjectReviews(@PathVariable String id) {
        List<Review> reviews = reviewService.getProjectReviews(id);
        return ResponseEntity.ok(ApiResponse.ok(reviews));
    }

    @GetMapping("/users/{id}/reviews")
    public ResponseEntity<ApiResponse<List<Review>>> getUserReviews(@PathVariable String id) {
        List<Review> reviews = reviewService.getUserReviews(id);
        return ResponseEntity.ok(ApiResponse.ok(reviews));
    }
}

