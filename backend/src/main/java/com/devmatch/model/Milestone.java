package com.devmatch.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "milestones")
public class Milestone {
    @Id
    private String id;

    @Indexed
    private String projectId;

    private String title;
    private String description;
    private double amount;
    private String dueDate;
    private MilestoneStatus status = MilestoneStatus.PENDING_FUNDING;

    // Revision rounds
    private int freeRevisionRounds = 2;
    private int revisionRoundsUsed = 0;
    private String revisionFeedback;

    // Agreement & Lock
    private boolean founderAccepted = false;
    private boolean developerAccepted = false;
    private boolean locked = false;

    // Submission & Review Window
    private String submittedDeliverables;
    private String submissionNote;
    private Instant submittedAt;
    private Instant reviewDeadline;
    private boolean autoApproved = false;

    // Disputes
    private String disputeRaisedBy;
    private String disputeReason;
    private String adminDecision; // FULL_RELEASE, FULL_REFUND, SPLIT
    private String adminDecisionReason;
    private Double adminSplitDeveloperPercent;

    // Payment & Fee details
    private double platformFee = 0.0;
    private double developerReceivedAmount = 0.0;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String stripeSessionId;
    private String stripePaymentIntentId;

    // Audit Log
    private List<MilestoneAuditEntry> auditLog = new ArrayList<>();

    private String rejectionReason;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public Milestone() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public MilestoneStatus getStatus() { return status; }
    public void setStatus(MilestoneStatus status) { this.status = status; }

    public int getFreeRevisionRounds() { return freeRevisionRounds; }
    public void setFreeRevisionRounds(int freeRevisionRounds) { this.freeRevisionRounds = freeRevisionRounds; }

    public int getRevisionRoundsUsed() { return revisionRoundsUsed; }
    public void setRevisionRoundsUsed(int revisionRoundsUsed) { this.revisionRoundsUsed = revisionRoundsUsed; }

    public String getRevisionFeedback() { return revisionFeedback; }
    public void setRevisionFeedback(String revisionFeedback) { this.revisionFeedback = revisionFeedback; }

    public boolean isFounderAccepted() { return founderAccepted; }
    public void setFounderAccepted(boolean founderAccepted) { this.founderAccepted = founderAccepted; }

    public boolean isDeveloperAccepted() { return developerAccepted; }
    public void setDeveloperAccepted(boolean developerAccepted) { this.developerAccepted = developerAccepted; }

    public boolean isLocked() { return locked; }
    public void setLocked(boolean locked) { this.locked = locked; }

    public String getSubmittedDeliverables() { return submittedDeliverables; }
    public void setSubmittedDeliverables(String submittedDeliverables) { this.submittedDeliverables = submittedDeliverables; }

    public String getSubmissionNote() { return submissionNote; }
    public void setSubmissionNote(String submissionNote) { this.submissionNote = submissionNote; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public Instant getReviewDeadline() { return reviewDeadline; }
    public void setReviewDeadline(Instant reviewDeadline) { this.reviewDeadline = reviewDeadline; }

    public boolean isAutoApproved() { return autoApproved; }
    public void setAutoApproved(boolean autoApproved) { this.autoApproved = autoApproved; }

    public String getDisputeRaisedBy() { return disputeRaisedBy; }
    public void setDisputeRaisedBy(String disputeRaisedBy) { this.disputeRaisedBy = disputeRaisedBy; }

    public String getDisputeReason() { return disputeReason; }
    public void setDisputeReason(String disputeReason) { this.disputeReason = disputeReason; }

    public String getAdminDecision() { return adminDecision; }
    public void setAdminDecision(String adminDecision) { this.adminDecision = adminDecision; }

    public String getAdminDecisionReason() { return adminDecisionReason; }
    public void setAdminDecisionReason(String adminDecisionReason) { this.adminDecisionReason = adminDecisionReason; }

    public Double getAdminSplitDeveloperPercent() { return adminSplitDeveloperPercent; }
    public void setAdminSplitDeveloperPercent(Double adminSplitDeveloperPercent) { this.adminSplitDeveloperPercent = adminSplitDeveloperPercent; }

    public double getPlatformFee() { return platformFee; }
    public void setPlatformFee(double platformFee) { this.platformFee = platformFee; }

    public double getDeveloperReceivedAmount() { return developerReceivedAmount; }
    public void setDeveloperReceivedAmount(double developerReceivedAmount) { this.developerReceivedAmount = developerReceivedAmount; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

    public List<MilestoneAuditEntry> getAuditLog() { return auditLog; }
    public void setAuditLog(List<MilestoneAuditEntry> auditLog) { this.auditLog = auditLog; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public String getStripeSessionId() { return stripeSessionId; }
    public void setStripeSessionId(String stripeSessionId) { this.stripeSessionId = stripeSessionId; }

    public String getStripePaymentIntentId() { return stripePaymentIntentId; }
    public void setStripePaymentIntentId(String stripePaymentIntentId) { this.stripePaymentIntentId = stripePaymentIntentId; }

    public void addAuditEntry(String userId, String userName, String userRole, String fromStatus, String toStatus, double amount, String note) {
        if (this.auditLog == null) {
            this.auditLog = new ArrayList<>();
        }
        this.auditLog.add(new MilestoneAuditEntry(userId, userName, userRole, fromStatus, toStatus, amount, note));
    }
}
