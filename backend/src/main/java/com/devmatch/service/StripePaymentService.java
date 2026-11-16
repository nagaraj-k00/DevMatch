package com.devmatch.service;

import com.devmatch.model.*;
import com.devmatch.repository.MilestoneRepository;
import com.devmatch.repository.PaymentRecordRepository;
import com.devmatch.repository.ProjectRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.Stripe;
import com.stripe.model.Charge;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.PaymentMethod;
import com.stripe.model.Refund;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class StripePaymentService {

    private static final Logger logger = LoggerFactory.getLogger(StripePaymentService.class);

    @Value("${stripe.api.key:sk_test_51O5LGtSJ9VQFslkVFTJ3Ts9bv5A4ctW9yJYR7UIG4BCu3zyX12iu6bKqUV6sMXGvikwmB4Ml1475cbQB1dgHZytx00K4vVIadp}")
    private String stripeApiKey;

    @Value("${stripe.publishable.key:pk_test_51O5LGtSJ9VQFslkVXnapit9PBhCYT6bAvo2GbgoXROsASuzIxYFVrFmKGKKJSkCxAxJYJZ7DGur9buGTbD8qPAyP000U8oxA69}")
    private String stripePublishableKey;

    @Value("${stripe.webhook.secret:}")
    private String stripeWebhookSecret;

    @Value("${stripe.currency:inr}")
    private String stripeCurrency;

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private PaymentRecordRepository paymentRecordRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private NotificationService notificationService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        if (stripeApiKey != null && !stripeApiKey.isBlank()) {
            Stripe.apiKey = stripeApiKey.trim();
            logger.info("Stripe Java SDK initialized successfully in TEST MODE");
        } else {
            logger.warn("Stripe API key is not configured.");
        }
    }

    public String getPublishableKey() {
        return stripePublishableKey;
    }

    /**
     * 1. CREATE STRIPE CHECKOUT SESSION (TEST MODE)
     * Creates a secure Stripe Checkout Session for funding a milestone in escrow.
     */
    public Map<String, Object> createCheckoutSession(String milestoneId, User payer, String clientOrigin) throws Exception {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        Project project = projectRepository.findById(milestone.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + milestone.getProjectId()));

        if (!project.getFounderId().equals(payer.getId()) && payer.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only the project founder can fund this milestone");
        }

        // Idempotency: Prevent re-funding already funded or in-progress milestones
        if (milestone.getStatus() == MilestoneStatus.FUNDED ||
            milestone.getStatus() == MilestoneStatus.IN_PROGRESS ||
            milestone.getStatus() == MilestoneStatus.SUBMITTED ||
            milestone.getStatus() == MilestoneStatus.RELEASED) {
            throw new IllegalStateException("Milestone is already funded or in progress (Status: " + milestone.getStatus() + ")");
        }

        String origin = (clientOrigin != null && !clientOrigin.isBlank()) ? clientOrigin : "http://localhost:5173";
        if (origin.endsWith("/")) {
            origin = origin.substring(0, origin.length() - 1);
        }

        String payeeId = project.getHiredDeveloperId() != null 
                ? project.getHiredDeveloperId() 
                : (project.getSelectedDeveloperId() != null ? project.getSelectedDeveloperId() : "PLATFORM_ESCROW");

        String currencyCode = (stripeCurrency != null && !stripeCurrency.isBlank()) ? stripeCurrency.toLowerCase() : "inr";
        long unitAmountInSmallestUnit = Math.round(milestone.getAmount() * 100);

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setCustomerEmail(payer.getEmail())
                .setClientReferenceId(milestoneId)
                .setBillingAddressCollection(SessionCreateParams.BillingAddressCollection.AUTO)
                .putMetadata("milestoneId", milestoneId)
                .putMetadata("projectId", project.getId())
                .putMetadata("payerId", payer.getId())
                .putMetadata("payeeId", payeeId)
                .putMetadata("platform", "DevMatch AI")
                .setPaymentIntentData(
                        SessionCreateParams.PaymentIntentData.builder()
                                .setDescription("DevMatch Escrow Milestone: " + milestone.getTitle())
                                .putMetadata("milestoneId", milestoneId)
                                .putMetadata("projectId", project.getId())
                                .putMetadata("payerId", payer.getId())
                                .putMetadata("payeeId", payeeId)
                                .build()
                )
                .setSuccessUrl(origin + "/project/" + project.getId() + "?session_id={CHECKOUT_SESSION_ID}&payment_status=success&milestone_id=" + milestoneId)
                .setCancelUrl(origin + "/project/" + project.getId() + "?session_id={CHECKOUT_SESSION_ID}&payment_status=cancelled&milestone_id=" + milestoneId)
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency(currencyCode)
                                                .setUnitAmount(unitAmountInSmallestUnit)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Milestone Escrow: " + milestone.getTitle())
                                                                .setDescription("Escrow funding for Project: " + project.getTitle() + " (Held safely until approval)")
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .build();

        // Idempotency key per milestone creation attempt
        RequestOptions requestOptions = RequestOptions.builder()
                .setIdempotencyKey("cs_" + milestoneId + "_" + UUID.randomUUID())
                .build();

        Session session = Session.create(params, requestOptions);

        // Record pending payment in MongoDB
        PaymentRecord record = paymentRecordRepository.findByStripeSessionId(session.getId())
                .orElse(new PaymentRecord());
        record.setMilestoneId(milestoneId);
        record.setProjectId(project.getId());
        record.setPayerId(payer.getId());
        record.setPayeeId(payeeId);
        record.setAmount(milestone.getAmount());
        record.setCurrency(currencyCode.toUpperCase());
        record.setPaymentGateway("STRIPE");
        record.setStripeSessionId(session.getId());
        record.setStatus(PaymentStatus.PENDING);
        record.setUpdatedAt(Instant.now());
        paymentRecordRepository.save(record);

        // Update milestone with session id
        milestone.setStripeSessionId(session.getId());
        milestone.setUpdatedAt(Instant.now());
        milestoneRepository.save(milestone);

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", session.getId());
        result.put("checkoutUrl", session.getUrl());
        result.put("publishableKey", stripePublishableKey);
        result.put("amount", milestone.getAmount());
        result.put("currency", currencyCode.toUpperCase());
        result.put("milestoneId", milestoneId);
        result.put("milestoneTitle", milestone.getTitle());
        return result;
    }

    /**
     * 2. SERVER-SIDE VERIFICATION & CAPTURE (NEVER TRUST FRONTEND)
     * Queries Stripe API directly using the session ID to verify payment status.
     */
    public synchronized PaymentRecord verifyAndCaptureSession(String sessionId, User actingUser) throws Exception {
        if (sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException("Session ID cannot be empty");
        }

        Session session = Session.retrieve(sessionId);
        if (session == null) {
            throw new IllegalArgumentException("Stripe Checkout Session not found: " + sessionId);
        }

        String paymentStatus = session.getPaymentStatus();
        String milestoneId = session.getMetadata() != null ? session.getMetadata().get("milestoneId") : session.getClientReferenceId();
        if (milestoneId == null) {
            throw new IllegalStateException("Session metadata missing milestoneId");
        }

        PaymentRecord record = paymentRecordRepository.findByStripeSessionId(sessionId)
                .orElseGet(() -> {
                    PaymentRecord pr = new PaymentRecord();
                    pr.setStripeSessionId(sessionId);
                    pr.setMilestoneId(milestoneId);
                    pr.setPaymentGateway("STRIPE");
                    return pr;
                });

        // IDEMPOTENCY: If already captured and held in escrow, return directly without double-processing
        if (record.getStatus() == PaymentStatus.HELD || record.getStatus() == PaymentStatus.RELEASED) {
            logger.info("Session {} already verified as HELD/RELEASED (Idempotent).", sessionId);
            return record;
        }

        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        if ("paid".equalsIgnoreCase(paymentStatus)) {
            String paymentIntentId = session.getPaymentIntent();
            record.setStripePaymentIntentId(paymentIntentId);
            record.setStatus(PaymentStatus.HELD);
            record.setAmount(milestone.getAmount());
            record.setCurrency((session.getCurrency() != null ? session.getCurrency() : "INR").toUpperCase());
            record.setUpdatedAt(Instant.now());

            if (paymentIntentId != null) {
                try {
                    PaymentIntent pi = PaymentIntent.retrieve(paymentIntentId);
                    logger.info("PaymentIntent Diagnostic: id={}, status={}, amount={}, currency={}, lastPaymentError={}",
                            pi.getId(), pi.getStatus(), pi.getAmount(), pi.getCurrency(),
                            pi.getLastPaymentError() != null ? pi.getLastPaymentError().getMessage() : "None");

                    if (pi.getPaymentMethod() != null) {
                        try {
                            PaymentMethod pm = PaymentMethod.retrieve(pi.getPaymentMethod());
                            if (pm != null && pm.getCard() != null) {
                                record.setCardBrand(pm.getCard().getBrand());
                                record.setCardLast4(pm.getCard().getLast4());
                                record.setCardCountry(pm.getCard().getCountry());
                                logger.info("Captured Card: brand={}, last4={}, country={}",
                                        pm.getCard().getBrand(), pm.getCard().getLast4(), pm.getCard().getCountry());
                            }
                        } catch (Exception pmEx) {
                            logger.debug("Could not inspect PaymentMethod: {}", pmEx.getMessage());
                        }
                    }

                    if (pi.getLatestCharge() != null) {
                        record.setStripeChargeId(pi.getLatestCharge());
                        Charge charge = Charge.retrieve(pi.getLatestCharge());
                        if (charge != null && charge.getReceiptUrl() != null) {
                            record.setReceiptUrl(charge.getReceiptUrl());
                        }
                    }
                } catch (Exception e) {
                    logger.warn("Could not retrieve latest charge for receipt: {}", e.getMessage());
                }
            }

            PaymentRecord savedRecord = paymentRecordRepository.save(record);

            // Transition milestone to FUNDED (Escrow Locked)
            MilestoneStatus oldStatus = milestone.getStatus();
            milestone.setStatus(MilestoneStatus.FUNDED);
            milestone.setStripeSessionId(sessionId);
            milestone.setStripePaymentIntentId(paymentIntentId);
            milestone.setUpdatedAt(Instant.now());
            String actorName = actingUser != null ? actingUser.getName() : "Stripe Checkout";
            String actorRole = actingUser != null ? actingUser.getRole().name() : "FOUNDER";
            milestone.addAuditEntry(
                    actingUser != null ? actingUser.getId() : "STRIPE_VERIFY",
                    actorName,
                    actorRole,
                    oldStatus.name(),
                    "FUNDED",
                    milestone.getAmount(),
                    "Milestone payment of " + milestone.getAmount() + " " + record.getCurrency() + " verified and held in escrow via Stripe (Session: " + sessionId + ")"
            );
            milestoneRepository.save(milestone);

            // Update Project to IN_PROGRESS if currently OPEN
            projectRepository.findById(milestone.getProjectId()).ifPresent(p -> {
                if (p.getStatus() == ProjectStatus.OPEN) {
                    p.setStatus(ProjectStatus.IN_PROGRESS);
                    projectRepository.save(p);
                }
                String devId = p.getHiredDeveloperId() != null ? p.getHiredDeveloperId() : p.getSelectedDeveloperId();
                if (devId != null) {
                    notificationService.createNotification(
                            devId,
                            "PAYMENT",
                            String.format("Payment for milestone '%s' (%s %.2f) is FUNDED in escrow via Stripe! You can now start work.", milestone.getTitle(), record.getCurrency(), milestone.getAmount()),
                            "/project/" + p.getId()
                    );
                }
            });

            logger.info("Successfully confirmed and held milestone {} in escrow via Stripe.", milestoneId);
            return savedRecord;

        } else if ("unpaid".equalsIgnoreCase(paymentStatus) && "open".equalsIgnoreCase(session.getStatus())) {
            record.setStatus(PaymentStatus.PENDING);
            record.setUpdatedAt(Instant.now());
            return paymentRecordRepository.save(record);
        } else {
            record.setStatus(PaymentStatus.FAILED);
            String failReason = "Payment status: " + paymentStatus + ", session status: " + session.getStatus();
            if (session.getPaymentIntent() != null) {
                try {
                    PaymentIntent pi = PaymentIntent.retrieve(session.getPaymentIntent());
                    if (pi != null && pi.getLastPaymentError() != null) {
                        failReason = pi.getLastPaymentError().getMessage();
                        logger.warn("Stripe PaymentIntent Diagnostic Failure: code={}, declineCode={}, message={}",
                                pi.getLastPaymentError().getCode(),
                                pi.getLastPaymentError().getDeclineCode(),
                                pi.getLastPaymentError().getMessage());
                    }
                } catch (Exception ignored) {}
            }
            record.setFailureReason(failReason);
            record.setUpdatedAt(Instant.now());
            return paymentRecordRepository.save(record);
        }
    }

    /**
     * 3. STRIPE WEBHOOK SIGNATURE VERIFICATION & PROCESSING (IDEMPOTENT)
     */
    public synchronized Map<String, Object> handleStripeWebhook(String payload, String sigHeader) {
        Event event;
        try {
            if (stripeWebhookSecret != null && !stripeWebhookSecret.isBlank()) {
                event = Webhook.constructEvent(payload, sigHeader, stripeWebhookSecret.trim());
            } else {
                event = Event.GSON.fromJson(payload, Event.class);
            }
        } catch (Exception e) {
            logger.error("Stripe Webhook signature verification failed: {}", e.getMessage());
            throw new IllegalArgumentException("Webhook verification error: " + e.getMessage());
        }

        String eventType = event.getType();
        logger.info("Received Stripe Webhook event: {}", eventType);

        String sessionId = extractSessionIdFromEvent(event, payload);
        String paymentIntentId = extractPaymentIntentFromEvent(event, payload);

        switch (eventType) {
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded": {
                if (sessionId != null) {
                    try {
                        verifyAndCaptureSession(sessionId, null);
                    } catch (Exception e) {
                        logger.error("Failed to process checkout.session.completed: {}", e.getMessage(), e);
                    }
                }
                break;
            }
            case "payment_intent.succeeded": {
                if (paymentIntentId != null) {
                    paymentRecordRepository.findByStripePaymentIntentId(paymentIntentId).ifPresent(pr -> {
                        if (pr.getStatus() != PaymentStatus.HELD && pr.getStatus() != PaymentStatus.RELEASED) {
                            pr.setStatus(PaymentStatus.HELD);
                            pr.setUpdatedAt(Instant.now());
                            paymentRecordRepository.save(pr);

                            milestoneRepository.findById(pr.getMilestoneId()).ifPresent(m -> {
                                if (m.getStatus() != MilestoneStatus.FUNDED) {
                                    m.setStatus(MilestoneStatus.FUNDED);
                                    m.setUpdatedAt(Instant.now());
                                    m.addAuditEntry("STRIPE_WEBHOOK", "Stripe Webhook", "SYSTEM", "PENDING", "FUNDED", pr.getAmount(), "Payment confirmed via payment_intent.succeeded");
                                    milestoneRepository.save(m);
                                }
                            });
                        }
                    });
                }
                break;
            }
            case "payment_intent.payment_failed": {
                if (paymentIntentId != null) {
                    paymentRecordRepository.findByStripePaymentIntentId(paymentIntentId).ifPresent(pr -> {
                        pr.setStatus(PaymentStatus.FAILED);
                        pr.setFailureReason("Payment intent failed");
                        pr.setUpdatedAt(Instant.now());
                        paymentRecordRepository.save(pr);
                    });
                }
                break;
            }
            case "payment_intent.processing": {
                if (paymentIntentId != null) {
                    paymentRecordRepository.findByStripePaymentIntentId(paymentIntentId).ifPresent(pr -> {
                        pr.setStatus(PaymentStatus.PENDING);
                        pr.setUpdatedAt(Instant.now());
                        paymentRecordRepository.save(pr);
                    });
                }
                break;
            }
            case "checkout.session.async_payment_failed": {
                if (sessionId != null) {
                    paymentRecordRepository.findByStripeSessionId(sessionId).ifPresent(pr -> {
                        pr.setStatus(PaymentStatus.FAILED);
                        pr.setFailureReason("Async payment failed");
                        pr.setUpdatedAt(Instant.now());
                        paymentRecordRepository.save(pr);
                    });
                }
                break;
            }
            case "checkout.session.expired": {
                if (sessionId != null) {
                    paymentRecordRepository.findByStripeSessionId(sessionId).ifPresent(pr -> {
                        if (pr.getStatus() == PaymentStatus.PENDING || pr.getStatus() == PaymentStatus.CREATED) {
                            pr.setStatus(PaymentStatus.CANCELLED);
                            pr.setFailureReason("Checkout session expired");
                            pr.setUpdatedAt(Instant.now());
                            paymentRecordRepository.save(pr);
                        }
                    });
                }
                break;
            }
            case "charge.refunded": {
                if (paymentIntentId == null) {
                    paymentIntentId = extractPaymentIntentFromEvent(event, payload);
                }
                if (paymentIntentId != null) {
                    paymentRecordRepository.findByStripePaymentIntentId(paymentIntentId).ifPresent(pr -> {
                        pr.setStatus(PaymentStatus.REFUNDED);
                        pr.setUpdatedAt(Instant.now());
                        paymentRecordRepository.save(pr);

                        milestoneRepository.findById(pr.getMilestoneId()).ifPresent(m -> {
                            m.setStatus(MilestoneStatus.REFUNDED);
                            m.setUpdatedAt(Instant.now());
                            m.addAuditEntry("STRIPE_WEBHOOK", "Stripe Webhook", "SYSTEM", "FUNDED", "REFUNDED", pr.getAmount(), "Refund recorded from Stripe webhook");
                            milestoneRepository.save(m);
                        });
                    });
                }
                break;
            }
            default:
                logger.debug("Unhandled Stripe webhook event: {}", eventType);
                break;
        }

        return Map.of("received", true, "event", eventType);
    }

    private String extractSessionIdFromEvent(Event event, String rawPayload) {
        try {
            StripeObject obj = event.getDataObjectDeserializer().getObject().orElse(null);
            if (obj instanceof Session session) {
                return session.getId();
            }
        } catch (Exception ignored) {}

        // Fallback: Parse raw payload using Jackson
        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            String id = root.path("data").path("object").path("id").asText();
            if (id != null && !id.isBlank()) return id;
        } catch (Exception ignored) {}

        return null;
    }

    private String extractPaymentIntentFromEvent(Event event, String rawPayload) {
        try {
            StripeObject obj = event.getDataObjectDeserializer().getObject().orElse(null);
            if (obj instanceof PaymentIntent pi) {
                return pi.getId();
            }
            if (obj instanceof Charge charge) {
                return charge.getPaymentIntent();
            }
        } catch (Exception ignored) {}

        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            String pi = root.path("data").path("object").path("payment_intent").asText();
            if (pi != null && !pi.isBlank() && !pi.equals("null")) return pi;

            String objType = root.path("data").path("object").path("object").asText();
            String id = root.path("data").path("object").path("id").asText();
            if ("payment_intent".equalsIgnoreCase(objType) && id != null && !id.isBlank()) {
                return id;
            }
            if (id != null && id.startsWith("pi_")) {
                return id;
            }
        } catch (Exception ignored) {}

        return null;
    }

    /**
     * 4. STRIPE TEST MODE REFUND SUPPORT
     * Issues an official Stripe test refund for an escrow-held milestone.
     */
    public PaymentRecord issueStripeRefund(String milestoneId, String reason, User actor) throws Exception {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        Project project = projectRepository.findById(milestone.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + milestone.getProjectId()));

        if (!project.getFounderId().equals(actor.getId()) && actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only the founder or platform admin can issue a refund");
        }

        PaymentRecord record = paymentRecordRepository.findByMilestoneId(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("No payment record found for milestone: " + milestoneId));

        if (record.getStatus() == PaymentStatus.RELEASED) {
            throw new IllegalStateException("Cannot refund a milestone whose funds were already approved and released to the developer.");
        }

        if (record.getStatus() == PaymentStatus.REFUNDED) {
            logger.info("Milestone {} already refunded (Idempotent).", milestoneId);
            return record;
        }

        String paymentIntentId = record.getStripePaymentIntentId();
        if (paymentIntentId == null || paymentIntentId.isBlank()) {
            throw new IllegalStateException("Payment record does not have a Stripe Payment Intent ID to refund");
        }

        // Call Stripe Refund API
        RefundCreateParams params = RefundCreateParams.builder()
                .setPaymentIntent(paymentIntentId)
                .setReason(RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER)
                .build();

        RequestOptions requestOptions = RequestOptions.builder()
                .setIdempotencyKey("rf_" + milestoneId + "_" + (System.currentTimeMillis() / 60000))
                .build();

        Refund refund = Refund.create(params, requestOptions);

        // Update PaymentRecord
        record.setStatus(PaymentStatus.REFUNDED);
        record.setRefundId(refund.getId());
        record.setRefundAmount(refund.getAmount() / 100.0);
        record.setFailureReason("Refund issued: " + (reason != null ? reason : "Customer request"));
        record.setUpdatedAt(Instant.now());
        PaymentRecord savedRecord = paymentRecordRepository.save(record);

        // Update Milestone
        MilestoneStatus oldStatus = milestone.getStatus();
        milestone.setStatus(MilestoneStatus.REFUNDED);
        milestone.setUpdatedAt(Instant.now());
        milestone.addAuditEntry(
                actor.getId(),
                actor.getName(),
                actor.getRole().name(),
                oldStatus.name(),
                "REFUNDED",
                milestone.getAmount(),
                "Stripe refund processed (" + (refund.getAmount() / 100.0) + " " + record.getCurrency() + "). Refund ID: " + refund.getId() + ". Reason: " + reason
        );
        milestoneRepository.save(milestone);

        // Notify
        notificationService.createNotification(
                project.getFounderId(),
                "PAYMENT",
                String.format("Stripe refund of %.2f %s for milestone '%s' was completed.", milestone.getAmount(), record.getCurrency(), milestone.getTitle()),
                "/project/" + project.getId()
        );

        logger.info("Successfully processed Stripe refund {} for milestone {}", refund.getId(), milestoneId);
        return savedRecord;
    }

    /**
     * 5. GET TRANSACTION DETAILS & STATUS
     */
    public PaymentRecord getTransactionBySession(String sessionId) {
        return paymentRecordRepository.findByStripeSessionId(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found for session: " + sessionId));
    }

    public List<PaymentRecord> getUserTransactions(User user) {
        if (user.getRole() == Role.FOUNDER) {
            return paymentRecordRepository.findByPayerId(user.getId());
        } else if (user.getRole() == Role.DEVELOPER) {
            return paymentRecordRepository.findByPayeeId(user.getId());
        } else {
            return paymentRecordRepository.findAll();
        }
    }
}
