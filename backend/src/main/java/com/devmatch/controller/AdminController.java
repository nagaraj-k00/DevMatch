package com.devmatch.controller;

import com.devmatch.dto.AdminOverviewDto;
import com.devmatch.dto.ApiResponse;
import com.devmatch.model.Milestone;
import com.devmatch.model.PaymentRecord;
import com.devmatch.model.Project;
import com.devmatch.model.User;
import com.devmatch.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AdminOverviewDto>> getOverview() {
        AdminOverviewDto overview = adminService.getOverview();
        return ResponseEntity.ok(ApiResponse.ok(overview));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllUsers()));
    }

    @PostMapping("/users/{id}/toggle-active")
    public ResponseEntity<ApiResponse<User>> toggleUserActive(@PathVariable String id) {
        User updated = adminService.toggleUserActive(id);
        return ResponseEntity.ok(ApiResponse.ok("User status updated", updated));
    }

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<PaymentRecord>>> getAllPayments() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllPayments()));
    }

    @GetMapping("/disputes")
    public ResponseEntity<ApiResponse<List<Milestone>>> getAllDisputes() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllDisputes()));
    }

    @GetMapping("/projects")
    public ResponseEntity<ApiResponse<List<Project>>> getAllProjects() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllProjects()));
    }
}
