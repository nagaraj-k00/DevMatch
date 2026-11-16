package com.devmatch.service;

import com.devmatch.dto.MilestoneDto;
import com.devmatch.model.*;
import com.devmatch.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class MilestonePaymentService {

    private static final Logger logger = LoggerFactory.getLogger(MilestonePaymentService.class);

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private PaymentRecordRepository paymentRecordRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private NotificationService notificationService;

    @Value("${razorpay.key_id:rzp_test_devmatch123}")
    private String razorpayKeyId;

    @Value("${razorpay.key_secret:secret_devmatch456}")
    private String razorpayKeySecret;

    @Value("${platform.fee.percent:10.0}")
    private double platformFeePercent;

    @Value("${milestone.review.window.days:5}")
    private int reviewWindowDays;

    // 1. MILESTONE AGREEMENT & CREATION
    public List<Milestone> createMilestones(String projectId, List<MilestoneDto> dtos, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        if (!project.getFounderId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only the project founder can propose milestones");
        }

        if (dtos == null || dtos.isEmpty()) {
            throw new IllegalArgumentException("At least one milestone must be defined");
        }

        List<Milestone> existing = milestoneRepository.findByProjectId(projectId);
        boolean isLocked = existing.stream().anyMatch(Milestone::isLocked);
        if (isLocked) {
            throw new IllegalStateException("Milestones are locked under active agreement. Use change requests to amend.");
        }

        // Validate each milestone
        double totalSum = 0.0;
        LocalDate today = LocalDate.now();

        for (int i = 0; i < dtos.size(); i++) {
            MilestoneDto dto = dtos.get(i);
            int idx = i + 1;

            if (dto.getTitle() == null || dto.getTitle().trim().length() < 5 || dto.getTitle().trim().length() > 100) {
                throw new IllegalArgumentException("Milestone #" + idx + " title must be between 5 and 100 characters");
            }

            if (dto.getDescription() == null || dto.getDescription().trim().length() < 20 || dto.getDescription().trim().length() > 1000) {
                throw new IllegalArgumentException("Milestone #" + idx + " deliverables description must be between 20 and 1,000 characters");
            }

            if (dto.getAmount() == null || dto.getAmount() <= 0) {
                throw new IllegalArgumentException("Milestone #" + idx + " amount must be greater than 0");
            }
            totalSum += dto.getAmount();

            if (dto.getFreeRevisionRounds() != null && (dto.getFreeRevisionRounds() < 0 || dto.getFreeRevisionRounds() > 5)) {
                throw new IllegalArgumentException("Milestone #" + idx + " free revision rounds must be a whole number between 0 and 5");
            }

            if (dto.getDueDate() != null && !dto.getDueDate().isBlank()) {
                try {
                    String cleanDate = dto.getDueDate().trim().substring(0, Math.min(10, dto.getDueDate().trim().length()));
                    LocalDate due = LocalDate.parse(cleanDate);
                    if (due.isBefore(today)) {
                        throw new IllegalArgumentException("Milestone #" + idx + " due date cannot be a past date (" + cleanDate + ")");
                    }
                } catch (Exception e) {
                    if (e instanceof IllegalArgumentException) throw e;
                }
            }
        }

        // Validate that all milestone amounts together equal the total project budget
        double targetBudget = project.getBudgetMax() > 0 ? project.getBudgetMax() : project.getBudgetMin();
        if (targetBudget > 0 && Math.abs(totalSum - targetBudget) > 1.0) {
            // Also allow match with budgetMin if founder configured flat min budget
            if (project.getBudgetMin() > 0 && Math.abs(totalSum - project.getBudgetMin()) <= 1.0) {
                // Matches budgetMin, accepted
            } else {
                throw new IllegalArgumentException(String.format(
                    "All milestone amounts together ($%.2f) must equal the total project budget ($%.2f)",
                    totalSum, targetBudget
                ));
            }
        }

        milestoneRepository.deleteAll(existing);

        List<Milestone> created = new ArrayList<>();
        for (MilestoneDto dto : dtos) {
            Milestone m = new Milestone();
            m.setProjectId(projectId);
            m.setTitle(dto.getTitle().trim());
            m.setDescription(dto.getDescription().trim());
            m.setAmount(dto.getAmount());
            m.setDueDate(dto.getDueDate());
            m.setFreeRevisionRounds(dto.getFreeRevisionRounds() != null && dto.getFreeRevisionRounds() >= 0 ? dto.getFreeRevisionRounds() : 2);
            m.setRevisionRoundsUsed(0);
            m.setStatus(MilestoneStatus.PENDING_FUNDING);
            m.setFounderAccepted(true); // Proposer automatically accepts
            m.setDeveloperAccepted(false);
            m.setLocked(false);
            m.setCreatedAt(Instant.now());
            m.setUpdatedAt(Instant.now());
            m.addAuditEntry(user.getId(), user.getName(), user.getRole().name(), "NONE", "PENDING_FUNDING", dto.getAmount(), "Milestone proposed by founder");
            created.add(milestoneRepository.save(m));
        }

        String assignedDev = project.getHiredDeveloperId() != null ? project.getHiredDeveloperId() : project.getSelectedDeveloperId();
        if (assignedDev != null) {
            notificationService.createNotification(
                    assignedDev,
                    "MILESTONE",
                    "Founder proposed milestones for '" + project.getTitle() + "'. Please review and accept agreement.",
                    "/project/" + projectId
            );
        }

        return created;
    }

    public List<Milestone> agreeMilestoneList(String projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        List<Milestone> milestones = milestoneRepository.findByProjectId(projectId);
        if (milestones.isEmpty()) {
            throw new IllegalArgumentException("No milestones exist to accept");
        }

        boolean isFounder = project.getFounderId().equals(user.getId());
        String assignedDev = project.getHiredDeveloperId() != null ? project.getHiredDeveloperId() : project.getSelectedDeveloperId();
        boolean isDev = assignedDev != null && assignedDev.equals(user.getId());

        if (!isFounder && !isDev && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only contract participants can accept milestone agreement");
        }

        for (Milestone m : milestones) {
            if (isFounder) m.setFounderAccepted(true);
            if (isDev) m.setDeveloperAccepted(true);

            if (m.isFounderAccepted() && m.isDeveloperAccepted()) {
                m.setLocked(true);
                m.setStatus(MilestoneStatus.PENDING_FUNDING);
                m.addAuditEntry(user.getId(), user.getName(), user.getRole().name(), m.getStatus().name(), "PENDING_FUNDING", m.getAmount(), "Milestone contract mutually accepted and locked");
            }
            m.setUpdatedAt(Instant.now());
            milestoneRepository.save(m);
        }

        boolean allLocked = milestones.stream().allMatch(Milestone::isLocked);
        if (allLocked && assignedDev != null) {
            notificationService.createNotification(
                    project.getFounderId(),
                    "MILESTONE",
                    "Developer accepted milestone agreement for '" + project.getTitle() + "'. You can now fund Milestone 1 to begin work.",
                    "/project/" + projectId
            );
            notificationService.createNotification(
                    assignedDev,
                    "MILESTONE",
                    "Milestone agreement locked for '" + project.getTitle() + "'. Awaiting founder funding.",
                    "/project/" + projectId
            );
        }

        return milestones;
    }

    public List<Milestone> getProjectMilestones(String projectId) {
        return milestoneRepository.findByProjectId(projectId);
    }

    // 2. FUND-FIRST RULE & RAZORPAY ORDERS
    public Map<String, Object> createRazorpayOrder(String milestoneId, User payer) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        Project project = projectRepository.findById(milestone.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (!project.getFounderId().equals(payer.getId()) && payer.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only the project founder can fund this milestone");
        }

        // Generate synthetic or real Razorpay order ID
        String orderId = "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        long amountInPaise = Math.round(milestone.getAmount() * 100);

        milestone.setRazorpayOrderId(orderId);
        milestone.setUpdatedAt(Instant.now());
        milestoneRepository.save(milestone);

        PaymentRecord record = paymentRecordRepository.findByRazorpayOrderId(orderId)
                .orElse(new PaymentRecord());
        record.setMilestoneId(milestoneId);
        record.setProjectId(project.getId());
        record.setPayerId(payer.getId());
        String payee = project.getHiredDeveloperId() != null ? project.getHiredDeveloperId() : project.getSelectedDeveloperId();
        record.setPayeeId(payee != null ? payee : "PLATFORM_ESCROW");
        record.setAmount(milestone.getAmount());
        record.setRazorpayOrderId(orderId);
        record.setStatus(PaymentStatus.CREATED);
        record.setCreatedAt(Instant.now());
        record.setUpdatedAt(Instant.now());
        paymentRecordRepository.save(record);

        Map<String, Object> response = new HashMap<>();
        response.put("orderId", orderId);
        response.put("amount", amountInPaise);
        response.put("currency", "INR");
        response.put("keyId", razorpayKeyId);
        response.put("milestoneId", milestoneId);
        response.put("milestoneTitle", milestone.getTitle());
        return response;
    }

    // Webhook-driven or verified payment processing (Idempotent)
    public synchronized PaymentRecord processCapturedPayment(String orderId, String paymentId, String signature, String source, User actingUser) {
        Optional<PaymentRecord> existingRecordOpt = paymentRecordRepository.findByRazorpayOrderId(orderId);
        PaymentRecord paymentRecord = existingRecordOpt.orElseGet(() -> {
            Optional<Milestone> mOpt = milestoneRepository.findByRazorpayOrderId(orderId);
            if (mOpt.isEmpty()) {
                throw new IllegalArgumentException("Order ID not recognized: " + orderId);
            }
            Milestone m = mOpt.get();
            PaymentRecord pr = new PaymentRecord();
            pr.setMilestoneId(m.getId());
            pr.setProjectId(m.getProjectId());
            pr.setAmount(m.getAmount());
            pr.setRazorpayOrderId(orderId);
            return pr;
        });

        // IDEMPOTENCY CHECK: if already HELD or RELEASED, do not double-process
        if (paymentRecord.getStatus() == PaymentStatus.HELD || paymentRecord.getStatus() == PaymentStatus.RELEASED) {
            logger.info("Payment for order {} already processed ({}), returning existing record (idempotent)", orderId, paymentRecord.getStatus());
            return paymentRecord;
        }

        Milestone milestone = milestoneRepository.findById(paymentRecord.getMilestoneId())
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found for payment"));

        if (milestone.getStatus() == MilestoneStatus.FUNDED || milestone.getStatus() == MilestoneStatus.IN_PROGRESS) {
            logger.info("Milestone {} already funded, returning existing record (idempotent)", milestone.getId());
            return paymentRecord;
        }

        Project project = projectRepository.findById(milestone.getProjectId()).orElse(null);

        paymentRecord.setStatus(PaymentStatus.HELD);
        paymentRecord.setRazorpayPaymentId(paymentId != null ? paymentId : "pay_" + UUID.randomUUID().toString().substring(0, 12));
        paymentRecord.setRazorpaySignature(signature);
        paymentRecord.setUpdatedAt(Instant.now());
        PaymentRecord savedRecord = paymentRecordRepository.save(paymentRecord);

        MilestoneStatus oldStatus = milestone.getStatus();
        milestone.setStatus(MilestoneStatus.FUNDED);
        milestone.setRazorpayPaymentId(savedRecord.getRazorpayPaymentId());
        milestone.setUpdatedAt(Instant.now());
        String actorId = actingUser != null ? actingUser.getId() : "SYSTEM_WEBHOOK";
        String actorName = actingUser != null ? actingUser.getName() : "Razorpay Webhook";
        String actorRole = actingUser != null ? actingUser.getRole().name() : "WEBHOOK";
        milestone.addAuditEntry(actorId, actorName, actorRole, oldStatus.name(), "FUNDED", milestone.getAmount(), "Payment captured and held in escrow via " + source);
        milestoneRepository.save(milestone);

        if (project != null) {
            if (project.getStatus() == ProjectStatus.OPEN) {
                project.setStatus(ProjectStatus.IN_PROGRESS);
                projectRepository.save(project);
            }
            String devId = project.getHiredDeveloperId() != null ? project.getHiredDeveloperId() : project.getSelectedDeveloperId();
            if (devId != null) {
                notificationService.createNotification(
                        devId,
                        "PAYMENT",
                        String.format("Payment for milestone '%s' ($%.2f) is FUNDED & held in escrow! You can now start work.", milestone.getTitle(), milestone.getAmount()),
                        "/project/" + project.getId()
                );
            }
        }

        return savedRecord;
    }

    // Razorpay Webhook Endpoint Handler
    public Map<String, Object> handleRazorpayWebhook(Map<String, Object> payload, String signature) {
        String event = (String) payload.get("event");
        logger.info("Received Razorpay Webhook Event: {}", event);

        if ("payment.captured".equals(event) || "order.paid".equals(event)) {
            Map<?, ?> payloadMap = (Map<?, ?>) payload.get("payload");
            if (payloadMap != null) {
                Map<?, ?> payment = (Map<?, ?>) payloadMap.get("payment");
                Map<?, ?> paymentEntity = payment != null ? (Map<?, ?>) payment.get("entity") : null;
                if (paymentEntity != null) {
                    String orderId = (String) paymentEntity.get("order_id");
                    String paymentId = (String) paymentEntity.get("id");
                    if (orderId != null) {
                        processCapturedPayment(orderId, paymentId, signature, "RAZORPAY_WEBHOOK", null);
                    }
                }
            }
        }
        return Map.of("status", "ok", "processed", true);
    }

    // 3. START WORK (FUND-FIRST ENFORCEMENT)
    public Milestone startWork(String milestoneId, User developer) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        Project project = projectRepository.findById(milestone.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        String hiredDev = project.getHiredDeveloperId() != null ? project.getHiredDeveloperId() : project.getSelectedDeveloperId();
        if (hiredDev == null || (!hiredDev.equals(developer.getId()) && developer.getRole() != Role.ADMIN)) {
            throw new AccessDeniedException("Only the hired developer can start work on this milestone");
        }

        // FUND-FIRST RULE ENFORCEMENT
        if (milestone.getStatus() != MilestoneStatus.FUNDED) {
            throw new IllegalStateException("Developer can only start work on a milestone whose status is FUNDED. Current status: " + milestone.getStatus());
        }

        milestone.setStatus(MilestoneStatus.IN_PROGRESS);
        milestone.setUpdatedAt(Instant.now());
        milestone.addAuditEntry(developer.getId(), developer.getName(), developer.getRole().name(), "FUNDED", "IN_PROGRESS", milestone.getAmount(), "Developer started work");
        Milestone saved = milestoneRepository.save(milestone);

        notificationService.createNotification(
                project.getFounderId(),
                "MILESTONE",
                String.format("Developer started work on milestone '%s'.", milestone.getTitle()),
                "/project/" + project.getId()
        );

        return saved;
    }

    // 4. SUBMISSION AND REVIEW WINDOW
    public Milestone submitDeliverables(String milestoneId, String deliverables, String note, User developer) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        Project project = projectRepository.findById(milestone.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        String hiredDev = project.getHiredDeveloperId() != null ? project.getHiredDeveloperId() : project.getSelectedDeveloperId();
        if (hiredDev == null || (!hiredDev.equals(developer.getId()) && developer.getRole() != Role.ADMIN)) {
            throw new AccessDeniedException("Only the hired developer can submit deliverables");
        }

        if (milestone.getStatus() != MilestoneStatus.IN_PROGRESS && milestone.getStatus() != MilestoneStatus.REVISION_REQUESTED && milestone.getStatus() != MilestoneStatus.FUNDED) {
            throw new IllegalStateException("Milestone must be IN_PROGRESS or FUNDED before submitting work (current: " + milestone.getStatus() + ")");
        }

        MilestoneStatus oldStatus = milestone.getStatus();
        milestone.setStatus(MilestoneStatus.SUBMITTED);
        milestone.setSubmittedDeliverables(deliverables);
        milestone.setSubmissionNote(note);
        milestone.setSubmittedAt(Instant.now());
        milestone.setReviewDeadline(Instant.now().plus(reviewWindowDays, ChronoUnit.DAYS));
        milestone.setUpdatedAt(Instant.now());
        milestone.addAuditEntry(developer.getId(), developer.getName(), developer.getRole().name(), oldStatus.name(), "SUBMITTED", milestone.getAmount(), "Deliverables submitted. 5-day review window started.");
        Milestone saved = milestoneRepository.save(milestone);

        notificationService.createNotification(
                project.getFounderId(),
                "MILESTONE",
                String.format("Deliverables submitted for milestone '%s'. Please review within 5 days (Auto-approves on deadline).", milestone.getTitle()),
                "/project/" + project.getId()
        );

        return saved;
    }

    // 5. APPROVE & RELEASE
    public Milestone approveMilestoneAndRelease(String milestoneId, User founder) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        Project project = projectRepository.findById(milestone.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (!project.getFounderId().equals(founder.getId()) && founder.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only the project founder can approve and release milestone funds");
        }

        if (milestone.getStatus() != MilestoneStatus.SUBMITTED) {
            throw new IllegalStateException("Can only release funds for a SUBMITTED milestone (current: " + milestone.getStatus() + ")");
        }

        return executeRelease(milestone, project, founder, false);
    }

    private Milestone executeRelease(Milestone milestone, Project project, User actor, boolean autoApproved) {
        double fee = Math.round(milestone.getAmount() * (platformFeePercent / 100.0) * 100.0) / 100.0;
        double netDeveloperAmount = Math.round((milestone.getAmount() - fee) * 100.0) / 100.0;

        MilestoneStatus oldStatus = milestone.getStatus();
        milestone.setStatus(MilestoneStatus.RELEASED);
        milestone.setPlatformFee(fee);
        milestone.setDeveloperReceivedAmount(netDeveloperAmount);
        milestone.setAutoApproved(autoApproved);
        milestone.setUpdatedAt(Instant.now());

        String receiptId = "RCP-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        String actorId = actor != null ? actor.getId() : "SYSTEM_CRON";
        String actorName = actor != null ? actor.getName() : "Auto-Approval Cron";
        String actorRole = actor != null ? actor.getRole().name() : "SYSTEM";
        milestone.addAuditEntry(actorId, actorName, actorRole, oldStatus.name(), "RELEASED", milestone.getAmount(),
                autoApproved ? "Auto-approved after 5-day review window expired. Released $" + netDeveloperAmount + " (Fee: $" + fee + ")"
                             : "Approved by founder. Released $" + netDeveloperAmount + " (Fee: $" + fee + ")");

        Milestone saved = milestoneRepository.save(milestone);

        // Update PaymentRecord
        Optional<PaymentRecord> recordOpt = paymentRecordRepository.findByMilestoneIdAndStatus(milestone.getId(), PaymentStatus.HELD);
        if (recordOpt.isEmpty()) {
            recordOpt = paymentRecordRepository.findByMilestoneId(milestone.getId());
        }
        if (recordOpt.isPresent()) {
            PaymentRecord pr = recordOpt.get();
            pr.setStatus(PaymentStatus.RELEASED);
            pr.setPlatformFee(fee);
            pr.setDeveloperReceivedAmount(netDeveloperAmount);
            pr.setReceiptId(receiptId);
            pr.setUpdatedAt(Instant.now());
            paymentRecordRepository.save(pr);
        }

        String devId = project.getHiredDeveloperId() != null ? project.getHiredDeveloperId() : project.getSelectedDeveloperId();
        if (devId != null) {
            notificationService.createNotification(
                    devId,
                    "PAYMENT",
                    String.format("Payment of $%.2f (net $%.2f after platform fee) for '%s' has been RELEASED to your earnings!", milestone.getAmount(), netDeveloperAmount, milestone.getTitle()),
                    "/project/" + project.getId()
            );
        }

        return saved;
    }

    // 6. REQUEST REVISION
    public Milestone requestRevision(String milestoneId, User founder, String feedback) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        Project project = projectRepository.findById(milestone.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (!project.getFounderId().equals(founder.getId()) && founder.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only the project founder can request revisions");
        }

        if (milestone.getStatus() != MilestoneStatus.SUBMITTED) {
            throw new IllegalStateException("Revisions can only be requested on SUBMITTED milestones (current: " + milestone.getStatus() + ")");
        }

        int currentUsed = milestone.getRevisionRoundsUsed() + 1;
        milestone.setRevisionRoundsUsed(currentUsed);
        milestone.setStatus(MilestoneStatus.IN_PROGRESS);
        milestone.setRevisionFeedback(feedback);
        milestone.setUpdatedAt(Instant.now());
        milestone.addAuditEntry(founder.getId(), founder.getName(), founder.getRole().name(), "SUBMITTED", "IN_PROGRESS", milestone.getAmount(),
                "Revision requested (Round " + currentUsed + "/" + milestone.getFreeRevisionRounds() + "): " + feedback);

        Milestone saved = milestoneRepository.save(milestone);

        String devId = project.getHiredDeveloperId() != null ? project.getHiredDeveloperId() : project.getSelectedDeveloperId();
        if (devId != null) {
            notificationService.createNotification(
                    devId,
                    "MILESTONE",
                    String.format("Founder requested revisions for '%s': %s (Revision round %d/%d)", milestone.getTitle(), feedback, currentUsed, milestone.getFreeRevisionRounds()),
                    "/project/" + project.getId()
            );
        }

        return saved;
    }

    // 7. DISPUTES & FREEZING
    public Milestone raiseDispute(String milestoneId, User user, String reason) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        Project project = projectRepository.findById(milestone.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        boolean isFounder = project.getFounderId().equals(user.getId());
        String devId = project.getHiredDeveloperId() != null ? project.getHiredDeveloperId() : project.getSelectedDeveloperId();
        boolean isDev = devId != null && devId.equals(user.getId());

        if (!isFounder && !isDev && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only project participants can raise a dispute");
        }

        if (milestone.getStatus() != MilestoneStatus.SUBMITTED && milestone.getStatus() != MilestoneStatus.IN_PROGRESS) {
            throw new IllegalStateException("Dispute can only be raised on submitted or active milestones (current: " + milestone.getStatus() + ")");
        }

        MilestoneStatus oldStatus = milestone.getStatus();
        milestone.setStatus(MilestoneStatus.DISPUTED);
        milestone.setDisputeRaisedBy(user.getId());
        milestone.setDisputeReason(reason);
        milestone.setUpdatedAt(Instant.now());
        milestone.addAuditEntry(user.getId(), user.getName(), user.getRole().name(), oldStatus.name(), "DISPUTED", milestone.getAmount(),
                "Dispute raised by " + user.getName() + " (" + user.getRole() + "): " + reason + ". Money is FROZEN.");

        Milestone saved = milestoneRepository.save(milestone);

        // Freeze PaymentRecord
        paymentRecordRepository.findByMilestoneId(milestoneId).ifPresent(pr -> {
            pr.setStatus(PaymentStatus.DISPUTED);
            pr.setFailureReason("Dispute raised: " + reason);
            pr.setUpdatedAt(Instant.now());
            paymentRecordRepository.save(pr);
        });

        // Notify both sides
        String targetNotify = isFounder ? devId : project.getFounderId();
        if (targetNotify != null) {
            notificationService.createNotification(
                    targetNotify,
                    "DISPUTE",
                    "A dispute was raised on milestone '" + milestone.getTitle() + "'. Escrow funds are frozen pending Admin review.",
                    "/project/" + project.getId()
            );
        }

        return saved;
    }

    // Admin Dispute Resolution
    public Milestone resolveDispute(String milestoneId, User admin, String decision, String reason, Double splitPercent) {
        if (admin.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only administrators can resolve disputes");
        }

        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        Project project = projectRepository.findById(milestone.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (milestone.getStatus() != MilestoneStatus.DISPUTED) {
            throw new IllegalStateException("Milestone is not currently in DISPUTED status (current: " + milestone.getStatus() + ")");
        }

        milestone.setAdminDecision(decision);
        milestone.setAdminDecisionReason(reason);
        milestone.setAdminSplitDeveloperPercent(splitPercent);
        milestone.setUpdatedAt(Instant.now());

        Optional<PaymentRecord> recordOpt = paymentRecordRepository.findByMilestoneId(milestoneId);
        PaymentRecord pr = recordOpt.orElseGet(() -> new PaymentRecord());

        if ("FULL_RELEASE".equalsIgnoreCase(decision)) {
            double fee = Math.round(milestone.getAmount() * (platformFeePercent / 100.0) * 100.0) / 100.0;
            double netDev = Math.round((milestone.getAmount() - fee) * 100.0) / 100.0;
            milestone.setStatus(MilestoneStatus.RELEASED);
            milestone.setPlatformFee(fee);
            milestone.setDeveloperReceivedAmount(netDev);
            pr.setStatus(PaymentStatus.RELEASED);
            pr.setPlatformFee(fee);
            pr.setDeveloperReceivedAmount(netDev);
            pr.setDisputeResolution("Admin decided Full Release to developer: " + reason);
        } else if ("FULL_REFUND".equalsIgnoreCase(decision)) {
            milestone.setStatus(MilestoneStatus.REFUNDED);
            milestone.setPlatformFee(0.0);
            milestone.setDeveloperReceivedAmount(0.0);
            pr.setStatus(PaymentStatus.REFUNDED);
            pr.setDisputeResolution("Admin decided Full Refund to founder: " + reason);
        } else {
            // SPLIT
            double devPercent = (splitPercent != null && splitPercent > 0 && splitPercent < 100) ? splitPercent : 50.0;
            double devGross = Math.round(milestone.getAmount() * (devPercent / 100.0) * 100.0) / 100.0;
            double fee = Math.round(devGross * (platformFeePercent / 100.0) * 100.0) / 100.0;
            double devNet = Math.round((devGross - fee) * 100.0) / 100.0;

            milestone.setStatus(MilestoneStatus.RELEASED);
            milestone.setPlatformFee(fee);
            milestone.setDeveloperReceivedAmount(devNet);
            pr.setStatus(PaymentStatus.RELEASED);
            pr.setPlatformFee(fee);
            pr.setDeveloperReceivedAmount(devNet);
            pr.setDisputeResolution(String.format("Admin split resolution: %.0f%% Dev ($%.2f net), remainder refunded to Founder. Reason: %s", devPercent, devNet, reason));
        }

        milestone.addAuditEntry(admin.getId(), admin.getName(), "ADMIN", "DISPUTED", milestone.getStatus().name(), milestone.getAmount(),
                "Admin dispute resolution (" + decision + "): " + reason);

        Milestone saved = milestoneRepository.save(milestone);
        pr.setUpdatedAt(Instant.now());
        paymentRecordRepository.save(pr);

        String devId = project.getHiredDeveloperId() != null ? project.getHiredDeveloperId() : project.getSelectedDeveloperId();
        if (devId != null) {
            notificationService.createNotification(devId, "DISPUTE", "Admin resolved dispute on '" + milestone.getTitle() + "': " + decision, "/project/" + project.getId());
        }
        notificationService.createNotification(project.getFounderId(), "DISPUTE", "Admin resolved dispute on '" + milestone.getTitle() + "': " + decision, "/project/" + project.getId());

        return saved;
    }

    // 8. CANCELLATION & DUE DATE EXTENSIONS
    public Milestone cancelMilestone(String milestoneId, User user) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        Project project = projectRepository.findById(milestone.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (!project.getFounderId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only the founder can cancel milestones");
        }

        // Before funding: cancel freely
        if (milestone.getStatus() == MilestoneStatus.PENDING_FUNDING || milestone.getStatus() == MilestoneStatus.DRAFT) {
            milestone.setStatus(MilestoneStatus.CANCELLED);
            milestone.setUpdatedAt(Instant.now());
            milestone.addAuditEntry(user.getId(), user.getName(), user.getRole().name(), "PENDING_FUNDING", "CANCELLED", milestone.getAmount(), "Cancelled by founder before funding");
            return milestoneRepository.save(milestone);
        }

        // After funding but before submission: refund
        if (milestone.getStatus() == MilestoneStatus.FUNDED) {
            milestone.setStatus(MilestoneStatus.REFUNDED);
            milestone.setUpdatedAt(Instant.now());
            milestone.addAuditEntry(user.getId(), user.getName(), user.getRole().name(), "FUNDED", "REFUNDED", milestone.getAmount(), "Refunded before work submission");
            paymentRecordRepository.findByMilestoneId(milestoneId).ifPresent(pr -> {
                pr.setStatus(PaymentStatus.REFUNDED);
                pr.setUpdatedAt(Instant.now());
                paymentRecordRepository.save(pr);
            });
            return milestoneRepository.save(milestone);
        }

        throw new IllegalStateException("Cannot cancel milestone in current status: " + milestone.getStatus());
    }

    public Milestone extendDueDate(String milestoneId, String newDueDate, User founder) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        Project project = projectRepository.findById(milestone.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (!project.getFounderId().equals(founder.getId()) && founder.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only the founder can extend milestone due dates");
        }

        String oldDate = milestone.getDueDate();
        milestone.setDueDate(newDueDate);
        if (milestone.getStatus() == MilestoneStatus.OVERDUE) {
            milestone.setStatus(MilestoneStatus.IN_PROGRESS);
        }
        milestone.setUpdatedAt(Instant.now());
        milestone.addAuditEntry(founder.getId(), founder.getName(), founder.getRole().name(), milestone.getStatus().name(), milestone.getStatus().name(), milestone.getAmount(),
                "Due date extended from " + oldDate + " to " + newDueDate);

        return milestoneRepository.save(milestone);
    }

    // 9. RECEIPT GENERATION
    public Map<String, Object> generateReceipt(String milestoneId, User user) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found"));

        Project project = projectRepository.findById(milestone.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        boolean isFounder = project.getFounderId().equals(user.getId());
        String devId = project.getHiredDeveloperId() != null ? project.getHiredDeveloperId() : project.getSelectedDeveloperId();
        boolean isDev = devId != null && devId.equals(user.getId());

        if (!isFounder && !isDev && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only project participants can access payment receipts");
        }

        PaymentRecord record = paymentRecordRepository.findByMilestoneId(milestoneId)
                .orElseGet(() -> paymentRecordRepository.findByProjectId(project.getId()).stream().findFirst().orElse(new PaymentRecord()));

        Map<String, Object> receipt = new HashMap<>();
        receipt.put("receiptId", record.getReceiptId() != null ? record.getReceiptId() : "RCP-" + milestone.getId().substring(0, 8).toUpperCase());
        receipt.put("date", milestone.getUpdatedAt().toString());
        receipt.put("projectId", project.getId());
        receipt.put("projectTitle", project.getTitle());
        receipt.put("milestoneId", milestone.getId());
        receipt.put("milestoneTitle", milestone.getTitle());
        receipt.put("status", milestone.getStatus().name());
        receipt.put("founderPaidAmount", milestone.getAmount());
        receipt.put("platformFeePercent", platformFeePercent + "%");
        receipt.put("platformFeeAmount", milestone.getPlatformFee());
        receipt.put("developerReceivedAmount", milestone.getDeveloperReceivedAmount());
        receipt.put("razorpayPaymentId", milestone.getRazorpayPaymentId());
        receipt.put("autoApproved", milestone.isAutoApproved());
        return receipt;
    }

    // 10. SCHEDULED CRON JOBS
    // Auto-approve expired submissions (reviewWindowDays exceeded)
    @Scheduled(fixedRate = 30000) // Runs every 30 seconds
    public void autoApproveExpiredSubmissions() {
        Instant now = Instant.now();
        List<Milestone> expired = milestoneRepository.findByStatusAndReviewDeadlineBefore(MilestoneStatus.SUBMITTED, now);
        for (Milestone m : expired) {
            try {
                Project p = projectRepository.findById(m.getProjectId()).orElse(null);
                if (p != null) {
                    logger.info("Auto-approving expired submission for milestone {} on project {}", m.getId(), p.getId());
                    executeRelease(m, p, null, true);
                }
            } catch (Exception e) {
                logger.error("Failed to auto-approve milestone {}", m.getId(), e);
            }
        }
    }

    // Check overdue milestones
    @Scheduled(fixedRate = 60000) // Runs every minute
    public void checkOverdueMilestones() {
        // Can mark overdue if dueDate passed and in IN_PROGRESS
    }
}
