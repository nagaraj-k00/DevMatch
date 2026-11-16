package com.devmatch.repository;

import com.devmatch.model.Milestone;
import com.devmatch.model.MilestoneStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface MilestoneRepository extends MongoRepository<Milestone, String> {
    List<Milestone> findByProjectId(String projectId);
    Optional<Milestone> findByRazorpayOrderId(String razorpayOrderId);
    Optional<Milestone> findByRazorpayPaymentId(String razorpayPaymentId);
    Optional<Milestone> findByStripeSessionId(String stripeSessionId);
    Optional<Milestone> findByStripePaymentIntentId(String stripePaymentIntentId);
    List<Milestone> findByProjectIdAndStatus(String projectId, MilestoneStatus status);
    List<Milestone> findByStatus(MilestoneStatus status);
    List<Milestone> findByStatusAndReviewDeadlineBefore(MilestoneStatus status, Instant deadline);
}
