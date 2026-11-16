package com.devmatch.controller;

import com.devmatch.dto.ApiResponse;
import com.devmatch.model.Notification;
import com.devmatch.model.User;
import com.devmatch.service.AuthService;
import com.devmatch.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuthService authService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNotifications() {
        User user = authService.getCurrentAuthenticatedUser();
        List<Notification> list = notificationService.getUserNotifications(user.getId());
        long unread = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("notifications", list, "unreadCount", unread)));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<String>> markReadAll() {
        User user = authService.getCurrentAuthenticatedUser();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(ApiResponse.ok("All marked as read", null));
    }
}

