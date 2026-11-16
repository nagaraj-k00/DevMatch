package com.devmatch.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "payments")
public class PaymentRecord {
    @Id
    private String id;

    @Indexed
    private String milestoneId;

    @Indexed
    private String projectId;

    @Indexed
    private String payerId;

    @Indexed
    private String payeeId;

    private double amount; // gross amount paid by founder
    private double founderPaidAmount;
    private double platformFee;
    private double developerReceivedAmount;
    private String currency = "USD";
    private String paymentGateway = "STRIPE";

    @Indexed
    private String stripeSessionId;

    @Indexed
    private String stripePaymentIntentId;

    @Indexed
    private String stripeChargeId;

    private String receiptUrl;
    private String refundId;
    private double refundAmount;

    private String cardBrand;
    private String cardLast4;
    private String cardCountry;

    @Indexed
    private String razorpayOrderId;

    @Indexed
    private String razorpayPaymentId;

    private String razorpaySignature;
    private PaymentStatus status = PaymentStatus.CREATED;
    private String failureReason;
    private String receiptId;
    private String disputeResolution;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public PaymentRecord() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMilestoneId() { return milestoneId; }
    public void setMilestoneId(String milestoneId) { this.milestoneId = milestoneId; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getPayerId() { return payerId; }
    public void setPayerId(String payerId) { this.payerId = payerId; }

    public String getPayeeId() { return payeeId; }
    public void setPayeeId(String payeeId) { this.payeeId = payeeId; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) {
        this.amount = amount;
        this.founderPaidAmount = amount;
    }

    public double getFounderPaidAmount() { return founderPaidAmount; }
    public void setFounderPaidAmount(double founderPaidAmount) { this.founderPaidAmount = founderPaidAmount; }

    public double getPlatformFee() { return platformFee; }
    public void setPlatformFee(double platformFee) { this.platformFee = platformFee; }

    public double getDeveloperReceivedAmount() { return developerReceivedAmount; }
    public void setDeveloperReceivedAmount(double developerReceivedAmount) { this.developerReceivedAmount = developerReceivedAmount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPaymentGateway() { return paymentGateway; }
    public void setPaymentGateway(String paymentGateway) { this.paymentGateway = paymentGateway; }

    public String getStripeSessionId() { return stripeSessionId; }
    public void setStripeSessionId(String stripeSessionId) { this.stripeSessionId = stripeSessionId; }

    public String getStripePaymentIntentId() { return stripePaymentIntentId; }
    public void setStripePaymentIntentId(String stripePaymentIntentId) { this.stripePaymentIntentId = stripePaymentIntentId; }

    public String getStripeChargeId() { return stripeChargeId; }
    public void setStripeChargeId(String stripeChargeId) { this.stripeChargeId = stripeChargeId; }

    public String getReceiptUrl() { return receiptUrl; }
    public void setReceiptUrl(String receiptUrl) { this.receiptUrl = receiptUrl; }

    public String getRefundId() { return refundId; }
    public void setRefundId(String refundId) { this.refundId = refundId; }

    public double getRefundAmount() { return refundAmount; }
    public void setRefundAmount(double refundAmount) { this.refundAmount = refundAmount; }

    public String getCardBrand() { return cardBrand; }
    public void setCardBrand(String cardBrand) { this.cardBrand = cardBrand; }

    public String getCardLast4() { return cardLast4; }
    public void setCardLast4(String cardLast4) { this.cardLast4 = cardLast4; }

    public String getCardCountry() { return cardCountry; }
    public void setCardCountry(String cardCountry) { this.cardCountry = cardCountry; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

    public String getRazorpaySignature() { return razorpaySignature; }
    public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public String getReceiptId() { return receiptId; }
    public void setReceiptId(String receiptId) { this.receiptId = receiptId; }

    public String getDisputeResolution() { return disputeResolution; }
    public void setDisputeResolution(String disputeResolution) { this.disputeResolution = disputeResolution; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
