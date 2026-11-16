package com.devmatch.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class MilestoneDto {

    @NotBlank(message = "Milestone title is required")
    @Size(min = 5, max = 100, message = "Milestone title must be between 5 and 100 characters")
    private String title;

    @NotBlank(message = "Deliverables description is required")
    @Size(min = 20, max = 1000, message = "Deliverables description must be between 20 and 1,000 characters")
    private String description;

    @NotNull(message = "Milestone amount is required")
    @Positive(message = "Milestone amount must be greater than 0")
    private Double amount;

    @NotBlank(message = "Due date is required")
    private String dueDate;

    @Min(value = 0, message = "Revision rounds must be between 0 and 5")
    @Max(value = 5, message = "Revision rounds must be between 0 and 5")
    private Integer freeRevisionRounds = 2;

    public MilestoneDto() {}

    public MilestoneDto(String title, String description, Double amount, String dueDate) {
        this.title = title;
        this.description = description;
        this.amount = amount;
        this.dueDate = dueDate;
        this.freeRevisionRounds = 2;
    }

    public MilestoneDto(String title, String description, Double amount, String dueDate, Integer freeRevisionRounds) {
        this.title = title;
        this.description = description;
        this.amount = amount;
        this.dueDate = dueDate;
        this.freeRevisionRounds = freeRevisionRounds != null ? freeRevisionRounds : 2;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title != null ? title.trim() : null; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description != null ? description.trim() : null; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate != null ? dueDate.trim() : null; }

    public Integer getFreeRevisionRounds() { return freeRevisionRounds != null ? freeRevisionRounds : 2; }
    public void setFreeRevisionRounds(Integer freeRevisionRounds) { this.freeRevisionRounds = freeRevisionRounds != null ? freeRevisionRounds : 2; }
}
