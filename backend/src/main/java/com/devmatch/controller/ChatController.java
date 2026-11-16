package com.devmatch.controller;

import com.devmatch.dto.ApiResponse;
import com.devmatch.model.Conversation;
import com.devmatch.model.Message;
import com.devmatch.model.User;
import com.devmatch.service.AuthService;
import com.devmatch.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private AuthService authService;

    @GetMapping("/api/conversations")
    public ResponseEntity<ApiResponse<List<Conversation>>> getUserConversations() {
        User user = authService.getCurrentAuthenticatedUser();
        List<Conversation> conversations = chatService.getUserConversations(user);
        return ResponseEntity.ok(ApiResponse.ok(conversations));
    }

    @PostMapping("/api/conversations/initiate")
    public ResponseEntity<ApiResponse<Conversation>> initiateConversation(@RequestBody Map<String, String> body) {
        String projectId = body.get("projectId");
        String developerId = body.get("developerId");
        User user = authService.getCurrentAuthenticatedUser();

        String founderId = user.getId();
        if (body.containsKey("founderId")) {
            founderId = body.get("founderId");
        }

        try {
            Conversation conversation = chatService.getOrCreateConversation(projectId, founderId, developerId);
            return ResponseEntity.ok(ApiResponse.ok(conversation));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Feature 2: Paginated chat history (latest 50 first, load older on scroll up)
    @GetMapping("/api/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<List<Message>>> getMessages(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        User user = authService.getCurrentAuthenticatedUser();
        try {
            List<Message> messages = chatService.getMessagesPaged(id, user, page, size);
            return ResponseEntity.ok(ApiResponse.ok(messages));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/api/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<Message>> postMessage(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        User user = authService.getCurrentAuthenticatedUser();
        String text = (String) body.get("text");
        String fileUrl = (String) body.get("fileUrl");
        String fileName = (String) body.get("fileName");
        String fileType = (String) body.get("fileType");
        Long fileSize = null;
        if (body.get("fileSize") instanceof Number) {
            fileSize = ((Number) body.get("fileSize")).longValue();
        }

        try {
            Message msg = chatService.sendMessage(id, user, text, fileUrl, fileName, fileType, fileSize);
            return ResponseEntity.ok(ApiResponse.ok(msg));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Mark as read receipt (double blue tick)
    @PostMapping("/api/conversations/{id}/read")
    public ResponseEntity<ApiResponse<String>> markRead(@PathVariable String id) {
        User user = authService.getCurrentAuthenticatedUser();
        try {
            chatService.markMessagesAsRead(id, user);
            return ResponseEntity.ok(ApiResponse.ok("Marked read", null));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Typing indicator
    @PostMapping("/api/conversations/{id}/typing")
    public ResponseEntity<ApiResponse<String>> typing(
            @PathVariable String id,
            @RequestBody Map<String, Boolean> body) {
        User user = authService.getCurrentAuthenticatedUser();
        boolean isTyping = body.getOrDefault("isTyping", false);
        try {
            chatService.broadcastTyping(id, user, isTyping);
            return ResponseEntity.ok(ApiResponse.ok("Typing broadcasted", null));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Presence heartbeat
    @PostMapping("/api/users/presence")
    public ResponseEntity<ApiResponse<String>> updatePresence(@RequestBody Map<String, Boolean> body) {
        User user = authService.getCurrentAuthenticatedUser();
        boolean online = body.getOrDefault("online", true);
        chatService.updateUserPresence(user.getId(), online);
        return ResponseEntity.ok(ApiResponse.ok("Presence updated", null));
    }

    // STOMP WebSocket endpoints
    @MessageMapping("/chat.send")
    public void handleWsMessage(@Payload Map<String, Object> payload) {
        String conversationId = (String) payload.get("conversationId");
        String senderId = (String) payload.get("senderId");
        String senderName = (String) payload.get("senderName");
        String text = (String) payload.get("text");
        String fileUrl = (String) payload.get("fileUrl");
        String fileName = (String) payload.get("fileName");
        String fileType = (String) payload.get("fileType");
        Long fileSize = payload.get("fileSize") instanceof Number ? ((Number) payload.get("fileSize")).longValue() : null;

        User dummyUser = new User();
        dummyUser.setId(senderId);
        dummyUser.setName(senderName);

        chatService.sendMessage(conversationId, dummyUser, text, fileUrl, fileName, fileType, fileSize);
    }

    @MessageMapping("/chat.typing")
    public void handleWsTyping(@Payload Map<String, Object> payload) {
        String conversationId = (String) payload.get("conversationId");
        String senderId = (String) payload.get("senderId");
        String senderName = (String) payload.get("senderName");
        boolean isTyping = Boolean.TRUE.equals(payload.get("isTyping"));

        User dummyUser = new User();
        dummyUser.setId(senderId);
        dummyUser.setName(senderName);

        chatService.broadcastTyping(conversationId, dummyUser, isTyping);
    }

    @MessageMapping("/chat.read")
    public void handleWsRead(@Payload Map<String, String> payload) {
        String conversationId = payload.get("conversationId");
        String readerId = payload.get("readerId");

        User dummyUser = new User();
        dummyUser.setId(readerId);

        chatService.markMessagesAsRead(conversationId, dummyUser);
    }
}
