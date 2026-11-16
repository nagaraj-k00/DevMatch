package com.devmatch.controller;

import com.devmatch.dto.ApiResponse;
import com.devmatch.dto.MilestoneDto;
import com.devmatch.model.Milestone;
import com.devmatch.model.PaymentRecord;
import com.devmatch.model.User;
import com.devmatch.service.AuthService;
import com.devmatch.service.MilestonePaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MilestoneController {

    @Autowired
    private MilestonePaymentService milestonePaymentService;

    @Autowired
    private AuthService authService;

    // Propose / create milestone list
    @PostMapping("/projects/{id}/milestones")
    public ResponseEntity<ApiResponse<List<Milestone>>> createMilestones(
            @PathVariable String id,
            @RequestBody List<MilestoneDto> dtos) {
        User user = authService.getCurrentAuthenticatedUser();
        try {
            List<Milestone> created = milestonePaymentService.createMilestones(id, dtos, user);
            return ResponseEntity.ok(ApiResponse.ok("Milestones created successfully", created));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Accept / Lock Milestone Agreement
    @PostMapping("/projects/{id}/milestones/agree")
    public ResponseEntity<ApiResponse<List<Milestone>>> agreeMilestones(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        try {
            List<Milestone> milestones = milestonePaymentService.agreeMilestoneList(id, user);
            return ResponseEntity.ok(ApiResponse.ok("Milestone agreement accepted", milestones));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/projects/{id}/milestones")
    public ResponseEntity<ApiResponse<List<Milestone>>> getMilestones(@PathVariable String id) {
        List<Milestone> milestones = milestonePaymentService.getProjectMilestones(id);
        return ResponseEntity.ok(ApiResponse.ok(milestones));
    }

    // Razorpay Order Creation
    @PostMapping("/milestones/{id}/pay")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createRazorpayOrder(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        try {
            Map<String, Object> orderDetails = milestonePaymentService.createRazorpayOrder(id, user);
            return ResponseEntity.ok(ApiResponse.ok("Razorpay order generated", orderDetails));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Verify & Hold Milestone Payment (Idempotent)
    @PostMapping("/milestones/{id}/verify-payment")
    public ResponseEntity<ApiResponse<PaymentRecord>> verifyPayment(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        User user = authService.getCurrentAuthenticatedUser();
        String orderId = payload.get("orderId");
        String paymentId = payload.get("paymentId");
        String signature = payload.get("signature");

        PaymentRecord record = milestonePaymentService.processCapturedPayment(orderId, paymentId, signature, "FRONTEND_VERIFIED", user);
        return ResponseEntity.ok(ApiResponse.ok("Payment confirmed and held in escrow", record));
    }

    // Razorpay Webhook Endpoint
    @PostMapping("/webhooks/razorpay")
    public ResponseEntity<Map<String, Object>> handleRazorpayWebhook(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        Map<String, Object> res = milestonePaymentService.handleRazorpayWebhook(payload, signature);
        return ResponseEntity.ok(res);
    }

    // Developer Starts Work (Enforces FUNDED status)
    @PostMapping("/milestones/{id}/start")
    public ResponseEntity<ApiResponse<Milestone>> startWork(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        try {
            Milestone milestone = milestonePaymentService.startWork(id, user);
            return ResponseEntity.ok(ApiResponse.ok("Work started on milestone", milestone));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Developer Submits Deliverables
    @PostMapping("/milestones/{id}/submit")
    public ResponseEntity<ApiResponse<Milestone>> submitDeliverables(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        User user = authService.getCurrentAuthenticatedUser();
        String deliverables = payload.getOrDefault("deliverables", "");
        String note = payload.getOrDefault("note", "");
        try {
            Milestone milestone = milestonePaymentService.submitDeliverables(id, deliverables, note, user);
            return ResponseEntity.ok(ApiResponse.ok("Deliverables submitted for review", milestone));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Founder Approves and Releases Payment
    @PostMapping("/milestones/{id}/approve")
    public ResponseEntity<ApiResponse<Milestone>> approveMilestone(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        try {
            Milestone milestone = milestonePaymentService.approveMilestoneAndRelease(id, user);
            return ResponseEntity.ok(ApiResponse.ok("Milestone approved and payment released to developer", milestone));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Founder Requests Revision
    @PostMapping("/milestones/{id}/revision")
    public ResponseEntity<ApiResponse<Milestone>> requestRevision(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        User user = authService.getCurrentAuthenticatedUser();
        String feedback = body.getOrDefault("feedback", "Deliverables require revision");
        try {
            Milestone milestone = milestonePaymentService.requestRevision(id, user, feedback);
            return ResponseEntity.ok(ApiResponse.ok("Milestone revision requested", milestone));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Raise Dispute (Money Frozen)
    @PostMapping("/milestones/{id}/dispute")
    public ResponseEntity<ApiResponse<Milestone>> raiseDispute(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        User user = authService.getCurrentAuthenticatedUser();
        String reason = body.getOrDefault("reason", "Dispute raised on deliverables/terms");
        try {
            Milestone milestone = milestonePaymentService.raiseDispute(id, user, reason);
            return ResponseEntity.ok(ApiResponse.ok("Dispute raised. Escrow funds are frozen.", milestone));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Admin Resolves Dispute
    @PostMapping("/milestones/{id}/dispute/resolve")
    public ResponseEntity<ApiResponse<Milestone>> resolveDispute(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        User user = authService.getCurrentAuthenticatedUser();
        String decision = (String) body.getOrDefault("decision", "FULL_RELEASE");
        String reason = (String) body.getOrDefault("reason", "Admin dispute adjudication");
        Double splitPercent = null;
        if (body.get("splitPercent") instanceof Number) {
            splitPercent = ((Number) body.get("splitPercent")).doubleValue();
        }

        try {
            Milestone milestone = milestonePaymentService.resolveDispute(id, user, decision, reason, splitPercent);
            return ResponseEntity.ok(ApiResponse.ok("Dispute resolved by administrator", milestone));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Cancel Milestone
    @PostMapping("/milestones/{id}/cancel")
    public ResponseEntity<ApiResponse<Milestone>> cancelMilestone(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        try {
            Milestone milestone = milestonePaymentService.cancelMilestone(id, user);
            return ResponseEntity.ok(ApiResponse.ok("Milestone cancelled", milestone));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Extend Due Date
    @PostMapping("/milestones/{id}/extend")
    public ResponseEntity<ApiResponse<Milestone>> extendDueDate(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        User user = authService.getCurrentAuthenticatedUser();
        String newDueDate = body.get("dueDate");
        try {
            Milestone milestone = milestonePaymentService.extendDueDate(id, newDueDate, user);
            return ResponseEntity.ok(ApiResponse.ok("Due date extended", milestone));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Download / View Receipt
    @GetMapping("/milestones/{id}/receipt")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReceipt(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        try {
            Map<String, Object> receipt = milestonePaymentService.generateReceipt(id, user);
            return ResponseEntity.ok(ApiResponse.ok("Receipt generated", receipt));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Backward-compatible endpoints for existing frontend buttons
    @PostMapping("/milestones/{id}/complete")
    public ResponseEntity<ApiResponse<Milestone>> markCompleteLegacy(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> payload) {
        User user = authService.getCurrentAuthenticatedUser();
        String deliverables = payload != null ? payload.getOrDefault("deliverables", "Project deliverables complete") : "Deliverables completed";
        String note = payload != null ? payload.getOrDefault("note", "") : "";
        try {
            Milestone milestone = milestonePaymentService.submitDeliverables(id, deliverables, note, user);
            return ResponseEntity.ok(ApiResponse.ok("Milestone submitted for review", milestone));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/milestones/{id}/reject")
    public ResponseEntity<ApiResponse<Milestone>> rejectLegacy(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        return requestRevision(id, body);
    }
}
