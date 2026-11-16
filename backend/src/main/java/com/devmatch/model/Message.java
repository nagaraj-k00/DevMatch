package com.devmatch.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "messages")
public class Message {
    @Id
    private String id;

    @Indexed
    private String conversationId;

    private String projectId;
    private String senderId;
    private String senderName;
    private String text;
    private String fileUrl;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String type = "TEXT"; // TEXT, IMAGE, FILE
    private String status = "SENT"; // SENT, DELIVERED, READ
    private boolean read = false;
    private Instant sentAt = Instant.now();
    private Instant deliveredAt;
    private Instant readAt;

    public Message() {}

    public Message(String conversationId, String projectId, String senderId, String senderName, String text, String fileUrl, String fileName) {
        this.conversationId = conversationId;
        this.projectId = projectId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.text = text;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
        this.sentAt = Instant.now();
        this.read = false;
        this.status = "SENT";
        if (fileName != null && (fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".gif") || fileName.endsWith(".webp"))) {
            this.type = "IMAGE";
        } else if (fileUrl != null && !fileUrl.isBlank()) {
            this.type = "FILE";
        } else {
            this.type = "TEXT";
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { 
        this.status = status; 
        if ("READ".equalsIgnoreCase(status)) {
            this.read = true;
        }
    }

    public Instant getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(Instant deliveredAt) { this.deliveredAt = deliveredAt; }

    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant readAt) { this.readAt = readAt; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
}

