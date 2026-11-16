package com.devmatch.dto;

import com.devmatch.model.TaskStatus;
import jakarta.validation.constraints.NotBlank;

public class TaskDto {
    private String milestoneId;

    @NotBlank
    private String title;

    private String description;
    private String assignedTo;
    private TaskStatus status = TaskStatus.TODO;
    private String dueDate;

    public TaskDto() {}

    public String getMilestoneId() { return milestoneId; }
    public void setMilestoneId(String milestoneId) { this.milestoneId = milestoneId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
}

