package com.devmatch.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "conversations")
@CompoundIndex(name = "conv_proj_dev_idx", def = "{'projectId': 1, 'developerId': 1}", unique = false)
public class Conversation {
    @Id
    private String id;

    @Indexed
    private String projectId;

    @Indexed
    private String founderId;

    @Indexed
    private String developerId;

    private String lastMessageText;
    private Instant lastMessageAt;
    private Instant createdAt = Instant.now();

    public Conversation() {}

    public Conversation(String projectId, String founderId, String developerId) {
        this.projectId = projectId;
        this.founderId = founderId;
        this.developerId = developerId;
        this.createdAt = Instant.now();
        this.lastMessageAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getFounderId() { return founderId; }
    public void setFounderId(String founderId) { this.founderId = founderId; }

    public String getDeveloperId() { return developerId; }
    public void setDeveloperId(String developerId) { this.developerId = developerId; }

    public String getLastMessageText() { return lastMessageText; }
    public void setLastMessageText(String lastMessageText) { this.lastMessageText = lastMessageText; }

    public Instant getLastMessageAt() { return lastMessageAt; }
    public void setLastMessageAt(Instant lastMessageAt) { this.lastMessageAt = lastMessageAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

