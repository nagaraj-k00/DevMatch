package com.devmatch.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "proposals")
public class Proposal {
    @Id
    private String id;

    @Indexed
    private String projectId;

    @Indexed
    private String developerId;

    private String developerName;
    private String developerEmail;
    private String developerImage;
    private List<String> developerSkills = new ArrayList<>();
    private double developerRate;
    private double developerRating;

    private String coverLetter;
    private double bidAmount;
    private int estimatedDays;
    private ProposalStatus status = ProposalStatus.PENDING;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public Proposal() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getDeveloperId() { return developerId; }
    public void setDeveloperId(String developerId) { this.developerId = developerId; }

    public String getDeveloperName() { return developerName; }
    public void setDeveloperName(String developerName) { this.developerName = developerName; }

    public String getDeveloperEmail() { return developerEmail; }
    public void setDeveloperEmail(String developerEmail) { this.developerEmail = developerEmail; }

    public String getDeveloperImage() { return developerImage; }
    public void setDeveloperImage(String developerImage) { this.developerImage = developerImage; }

    public List<String> getDeveloperSkills() { return developerSkills; }
    public void setDeveloperSkills(List<String> developerSkills) { this.developerSkills = developerSkills != null ? developerSkills : new ArrayList<>(); }

    public double getDeveloperRate() { return developerRate; }
    public void setDeveloperRate(double developerRate) { this.developerRate = developerRate; }

    public double getDeveloperRating() { return developerRating; }
    public void setDeveloperRating(double developerRating) { this.developerRating = developerRating; }

    public String getCoverLetter() { return coverLetter; }
    public void setCoverLetter(String coverLetter) { this.coverLetter = coverLetter; }

    public double getBidAmount() { return bidAmount; }
    public void setBidAmount(double bidAmount) { this.bidAmount = bidAmount; }

    public int getEstimatedDays() { return estimatedDays; }
    public void setEstimatedDays(int estimatedDays) { this.estimatedDays = estimatedDays; }

    public ProposalStatus getStatus() { return status; }
    public void setStatus(ProposalStatus status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

