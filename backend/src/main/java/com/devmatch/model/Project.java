package com.devmatch.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "projects")
public class Project {
    @Id
    private String id;

    @Indexed
    private String founderId;

    private String title;
    private String description;
    private String category;
    private double budgetMin;
    private double budgetMax;
    private String timeline;
    private ProjectStatus status = ProjectStatus.DRAFT;
    private String selectedDeveloperId;
    private String hiredDeveloperId;
    private boolean aiAnalysisFailed = false;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public Project() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFounderId() { return founderId; }
    public void setFounderId(String founderId) { this.founderId = founderId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public double getBudgetMin() { return budgetMin; }
    public void setBudgetMin(double budgetMin) { this.budgetMin = budgetMin; }

    public double getBudgetMax() { return budgetMax; }
    public void setBudgetMax(double budgetMax) { this.budgetMax = budgetMax; }

    public String getTimeline() { return timeline; }
    public void setTimeline(String timeline) { this.timeline = timeline; }

    public ProjectStatus getStatus() { return status; }
    public void setStatus(ProjectStatus status) { this.status = status; }

    public String getSelectedDeveloperId() { 
        return hiredDeveloperId != null ? hiredDeveloperId : selectedDeveloperId; 
    }
    public void setSelectedDeveloperId(String selectedDeveloperId) { 
        this.selectedDeveloperId = selectedDeveloperId; 
        this.hiredDeveloperId = selectedDeveloperId;
    }

    public String getHiredDeveloperId() { 
        return hiredDeveloperId != null ? hiredDeveloperId : selectedDeveloperId; 
    }
    public void setHiredDeveloperId(String hiredDeveloperId) { 
        this.hiredDeveloperId = hiredDeveloperId; 
        this.selectedDeveloperId = hiredDeveloperId;
    }

    public boolean isAiAnalysisFailed() { return aiAnalysisFailed; }
    public void setAiAnalysisFailed(boolean aiAnalysisFailed) { this.aiAnalysisFailed = aiAnalysisFailed; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

