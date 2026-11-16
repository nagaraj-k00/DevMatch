package com.devmatch.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "matches")
@CompoundIndex(name = "proj_dev_idx", def = "{'projectId': 1, 'developerId': 1}", unique = true)
public class DeveloperMatch {
    @Id
    private String id;

    @Indexed
    private String projectId;

    @Indexed
    private String developerId;

    private double totalScore; // out of 100
    private double skillScore; // out of 40
    private double experienceScore; // out of 20
    private double budgetScore; // out of 15
    private double timelineScore; // out of 15
    private double ratingScore; // out of 10

    // Match explanation breakdown details
    private String breakdownReason;
    private Instant generatedAt = Instant.now();

    public DeveloperMatch() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getDeveloperId() { return developerId; }
    public void setDeveloperId(String developerId) { this.developerId = developerId; }

    public double getTotalScore() { return totalScore; }
    public void setTotalScore(double totalScore) { this.totalScore = totalScore; }

    public double getSkillScore() { return skillScore; }
    public void setSkillScore(double skillScore) { this.skillScore = skillScore; }

    public double getExperienceScore() { return experienceScore; }
    public void setExperienceScore(double experienceScore) { this.experienceScore = experienceScore; }

    public double getBudgetScore() { return budgetScore; }
    public void setBudgetScore(double budgetScore) { this.budgetScore = budgetScore; }

    public double getTimelineScore() { return timelineScore; }
    public void setTimelineScore(double timelineScore) { this.timelineScore = timelineScore; }

    public double getRatingScore() { return ratingScore; }
    public void setRatingScore(double ratingScore) { this.ratingScore = ratingScore; }

    public String getBreakdownReason() { return breakdownReason; }
    public void setBreakdownReason(String breakdownReason) { this.breakdownReason = breakdownReason; }

    public Instant getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }
}

