package com.devmatch.controller;

import com.devmatch.dto.ApiResponse;
import com.devmatch.model.PaymentRecord;
import com.devmatch.model.User;
import com.devmatch.service.AuthService;
import com.devmatch.service.StripePaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private StripePaymentService stripePaymentService;

    @Autowired
    private AuthService authService;

    /**
     * 1. GET STRIPE CONFIG
     */
    @GetMapping("/stripe/config")
    public ResponseEntity<ApiResponse<Map<String, String>>> getStripeConfig() {
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "publishableKey", stripePaymentService.getPublishableKey(),
                "mode", "test"
        )));
    }

    /**
     * 2. CREATE STRIPE CHECKOUT SESSION
     */
    @PostMapping("/stripe/checkout-session")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createCheckoutSession(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "Origin", required = false) String origin) {
        String milestoneId = request.get("milestoneId");
        if (milestoneId == null || milestoneId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("milestoneId is required"));
        }

        User user = authService.getCurrentAuthenticatedUser();
        try {
            Map<String, Object> sessionData = stripePaymentService.createCheckoutSession(milestoneId, user, origin);
            return ResponseEntity.ok(ApiResponse.ok("Stripe Checkout Session created", sessionData));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create Stripe Checkout session: " + e.getMessage()));
        }
    }

    /**
     * 3. VERIFY STRIPE SESSION (SERVER-SIDE)
     */
    @PostMapping("/stripe/verify-session")
    public ResponseEntity<ApiResponse<PaymentRecord>> verifyStripeSession(@RequestBody Map<String, String> request) {
        String sessionId = request.get("sessionId");
        if (sessionId == null || sessionId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("sessionId is required"));
        }

        User user = authService.getCurrentAuthenticatedUser();
        try {
            PaymentRecord record = stripePaymentService.verifyAndCaptureSession(sessionId, user);
            return ResponseEntity.ok(ApiResponse.ok("Payment verified and captured", record));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Verification failed: " + e.getMessage()));
        }
    }

    /**
     * 4. STRIPE WEBHOOK (WITH SIGNATURE VERIFICATION)
     */
    @PostMapping("/webhook/stripe")
    public ResponseEntity<Map<String, Object>> handleStripeWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "Stripe-Signature", required = false) String signatureHeader) {
        try {
            Map<String, Object> result = stripePaymentService.handleStripeWebhook(rawPayload, signatureHeader);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 5. ISSUE REFUND (TEST MODE)
     */
    @PostMapping("/stripe/refund")
    public ResponseEntity<ApiResponse<PaymentRecord>> refundMilestone(@RequestBody Map<String, String> request) {
        String milestoneId = request.get("milestoneId");
        String reason = request.getOrDefault("reason", "Customer requested cancellation");
        if (milestoneId == null || milestoneId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("milestoneId is required"));
        }

        User user = authService.getCurrentAuthenticatedUser();
        try {
            PaymentRecord record = stripePaymentService.issueStripeRefund(milestoneId, reason, user);
            return ResponseEntity.ok(ApiResponse.ok("Refund successfully processed", record));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Refund failed: " + e.getMessage()));
        }
    }

    /**
     * 6. GET ALL USER TRANSACTIONS
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<PaymentRecord>>> getMyTransactions() {
        User user = authService.getCurrentAuthenticatedUser();
        List<PaymentRecord> records = stripePaymentService.getUserTransactions(user);
        return ResponseEntity.ok(ApiResponse.ok(records));
    }

    /**
     * Backward-compatibility for Razorpay Webhook
     */
    @PostMapping("/webhook/razorpay")
    public ResponseEntity<Map<String, Object>> handleRazorpayWebhook(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Legacy webhook endpoint"));
    }
}
