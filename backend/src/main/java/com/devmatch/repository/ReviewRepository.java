package com.devmatch.repository;

import com.devmatch.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByProjectId(String projectId);
    List<Review> findByRevieweeId(String revieweeId);
    Optional<Review> findByProjectIdAndReviewerId(String projectId, String reviewerId);
}

