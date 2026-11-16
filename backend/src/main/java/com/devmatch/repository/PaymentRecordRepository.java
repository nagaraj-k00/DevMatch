package com.devmatch.repository;

import com.devmatch.model.PaymentRecord;
import com.devmatch.model.PaymentStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRecordRepository extends MongoRepository<PaymentRecord, String> {
    List<PaymentRecord> findByProjectId(String projectId);
    List<PaymentRecord> findByPayerId(String payerId);
    List<PaymentRecord> findByPayeeId(String payeeId);
    Optional<PaymentRecord> findByRazorpayOrderId(String razorpayOrderId);
    Optional<PaymentRecord> findByRazorpayPaymentId(String razorpayPaymentId);
    Optional<PaymentRecord> findByStripeSessionId(String stripeSessionId);
    Optional<PaymentRecord> findByStripePaymentIntentId(String stripePaymentIntentId);
    Optional<PaymentRecord> findByMilestoneId(String milestoneId);
    Optional<PaymentRecord> findByMilestoneIdAndStatus(String milestoneId, PaymentStatus status);
}
