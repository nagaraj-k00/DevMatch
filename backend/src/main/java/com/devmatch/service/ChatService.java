package com.devmatch.service;

import com.devmatch.model.*;
import com.devmatch.repository.ConversationRepository;
import com.devmatch.repository.MessageRepository;
import com.devmatch.repository.ProjectRepository;
import com.devmatch.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class ChatService {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    // Feature 2: Only create/allow conversation for hired developer
    public Conversation getOrCreateConversation(String projectId, String founderId, String developerId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        // Enforce: Do not allow chat before hiring
        String hiredDev = project.getHiredDeveloperId();
        if (hiredDev == null || !hiredDev.equals(developerId) || project.getStatus() == ProjectStatus.DRAFT || project.getStatus() == ProjectStatus.OPEN) {
            throw new IllegalStateException("Chat is strictly restricted to the founder and the hired developer after hire confirmation.");
        }

        return conversationRepository.findByProjectIdAndDeveloperId(projectId, developerId)
                .orElseGet(() -> {
                    Conversation c = new Conversation(projectId, founderId, developerId);
                    return conversationRepository.save(c);
                });
    }

    public void validateParticipant(Conversation conversation, User user) {
        if (user.getRole() == Role.ADMIN) return;
        if (!user.getId().equals(conversation.getFounderId()) && !user.getId().equals(conversation.getDeveloperId())) {
            throw new AccessDeniedException("Forbidden: You are not a participant in this conversation.");
        }
    }

    public List<Conversation> getUserConversations(User user) {
        if (user.getRole() == Role.FOUNDER) {
            return conversationRepository.findByFounderIdOrderByLastMessageAtDesc(user.getId());
        } else {
            return conversationRepository.findByDeveloperIdOrderByLastMessageAtDesc(user.getId());
        }
    }

    public Message sendMessage(String conversationId, User sender, String text, String fileUrl, String fileName, String fileType, Long fileSize) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        // Feature 2: Server-side participant security check
        validateParticipant(conversation, sender);

        boolean hasFile = fileUrl != null && !fileUrl.isBlank();
        boolean hasText = text != null && !text.trim().isBlank();

        if (!hasFile && !hasText) {
            throw new IllegalArgumentException("Message cannot be empty or contain only spaces");
        }

        if (text != null && text.length() > 2000) {
            throw new IllegalArgumentException("Message exceeds maximum allowed length of 2,000 characters (current length: " + text.length() + ")");
        }

        if (hasFile) {
            // Validate file size (max 10 MB)
            if (fileSize != null && fileSize > 10L * 1024 * 1024) {
                throw new IllegalArgumentException("File size exceeds the 10 MB limit (size: " + (fileSize / (1024 * 1024)) + " MB)");
            }

            // Validate allowed file extensions and mime types
            String lowerName = fileName != null ? fileName.toLowerCase() : "";
            String lowerType = fileType != null ? fileType.toLowerCase() : "";
            boolean isAllowedExt = lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || 
                                   lowerName.endsWith(".png") || lowerName.endsWith(".gif") || 
                                   lowerName.endsWith(".webp") || lowerName.endsWith(".pdf") || 
                                   lowerName.endsWith(".zip");
            boolean isAllowedMime = lowerType.startsWith("image/") || lowerType.equals("application/pdf") || 
                                    lowerType.contains("zip") || lowerType.equals("application/octet-stream");

            if (!isAllowedExt && !isAllowedMime) {
                throw new IllegalArgumentException("Unsupported file type. Only images (JPG, PNG, GIF, WebP), PDFs, and ZIP archives up to 10 MB are allowed.");
            }
        }

        String recipientId = sender.getId().equals(conversation.getFounderId()) ?
                conversation.getDeveloperId() : conversation.getFounderId();

        User recipient = userRepository.findById(recipientId).orElse(null);

        Message message = new Message(
                conversationId,
                conversation.getProjectId(),
                sender.getId(),
                sender.getName(),
                text,
                fileUrl,
                fileName
        );
        message.setFileType(fileType);
        message.setFileSize(fileSize);

        // Check recipient online status for delivered tick
        if (recipient != null && recipient.isOnline()) {
            message.setStatus("DELIVERED");
            message.setDeliveredAt(Instant.now());
        } else {
            message.setStatus("SENT");
        }

        Message savedMessage = messageRepository.save(message);

        conversation.setLastMessageText(text != null && !text.isBlank() ? text : "[Attachment: " + fileName + "]");
        conversation.setLastMessageAt(Instant.now());
        conversationRepository.save(conversation);

        // Notification if recipient is offline
        if (recipient == null || !recipient.isOnline()) {
            notificationService.createNotification(
                    recipientId,
                    "MESSAGE",
                    "New message from " + sender.getName() + ": " + (text != null && text.length() > 30 ? text.substring(0, 30) + "..." : (text != null ? text : "[Attachment]")),
                    "/project/" + conversation.getProjectId()
            );
        }

        // Broadcast to WebSocket topic
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, savedMessage);
            } catch (Exception ignored) {}
        }

        return savedMessage;
    }

    public List<Message> getMessagesPaged(String conversationId, User user, int page, int size) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        validateParticipant(conversation, user);

        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messagePage = messageRepository.findByConversationIdOrderBySentAtDesc(conversationId, pageable);

        List<Message> content = new ArrayList<>(messagePage.getContent());
        // Reverse so frontend gets chronological order
        Collections.reverse(content);
        return content;
    }

    public List<Message> getMessages(String conversationId, User user) {
        return getMessagesPaged(conversationId, user, 0, 50);
    }

    public void markMessagesAsRead(String conversationId, User reader) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        validateParticipant(conversation, reader);

        List<Message> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversationId);
        boolean changed = false;
        for (Message m : messages) {
            if (!m.getSenderId().equals(reader.getId()) && !"READ".equalsIgnoreCase(m.getStatus())) {
                m.setStatus("READ");
                m.setRead(true);
                m.setReadAt(Instant.now());
                messageRepository.save(m);
                changed = true;
            }
        }

        if (changed && messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/conversations/" + conversationId + "/read",
                        Map.of("conversationId", conversationId, "readerId", reader.getId(), "status", "READ"));
            } catch (Exception ignored) {}
        }
    }

    public void broadcastTyping(String conversationId, User user, boolean isTyping) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        validateParticipant(conversation, user);

        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/conversations/" + conversationId + "/typing",
                        Map.of("conversationId", conversationId, "userId", user.getId(), "userName", user.getName(), "isTyping", isTyping));
            } catch (Exception ignored) {}
        }
    }

    public void updateUserPresence(String userId, boolean online) {
        userRepository.findById(userId).ifPresent(u -> {
            u.setOnline(online);
            u.setLastSeenAt(Instant.now());
            userRepository.save(u);

            if (messagingTemplate != null) {
                try {
                    messagingTemplate.convertAndSend("/topic/presence",
                            Map.of("userId", userId, "online", online, "lastSeenAt", u.getLastSeenAt().toString()));
                } catch (Exception ignored) {}
            }
        });
    }

    public long getUnreadCount(String conversationId, User user) {
        return messageRepository.countByConversationIdAndSenderIdNotAndReadFalse(conversationId, user.getId());
    }
}

