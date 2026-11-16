package com.devmatch.controller;

import com.devmatch.dto.ApiResponse;
import com.devmatch.dto.ChangePasswordRequest;
import com.devmatch.dto.UserProfileDto;
import com.devmatch.model.User;
import com.devmatch.service.AuthService;
import com.devmatch.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> getMyProfile() {
        User user = authService.getCurrentAuthenticatedUser();
        UserProfileDto profile = userService.getUserProfile(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateMyProfile(@RequestBody UserProfileDto dto) {
        User user = authService.getCurrentAuthenticatedUser();
        UserProfileDto updated = userService.updateUserProfile(user.getId(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserProfileDto>> getUserById(@PathVariable String id) {
        UserProfileDto profile = userService.getUserProfile(id);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        userService.changePassword(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", null));
    }
}

