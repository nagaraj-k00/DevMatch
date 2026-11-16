package com.devmatch.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public class ProjectCreateRequest {

    public static final Set<String> PREDEFINED_CATEGORIES = Set.of(
        "Web Application",
        "Mobile App (iOS/Android)",
        "AI & Machine Learning",
        "FinTech & Payments",
        "Healthcare & BioTech",
        "E-Commerce & Retail",
        "SaaS & Cloud Services"
    );

    @NotBlank(message = "Project title is required")
    @Size(min = 10, max = 100, message = "Project title must be between 10 and 100 characters")
    private String title;

    @NotBlank(message = "Project description is required")
    @Size(min = 100, max = 5000, message = "Project description must be between 100 and 5,000 characters for AI analysis")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Minimum budget is required")
    @Min(value = 500, message = "Minimum budget must be at least ₹500")
    private Double budgetMin;

    @NotNull(message = "Maximum budget is required")
    @Min(value = 500, message = "Maximum budget must be at least ₹500")
    private Double budgetMax;

    @NotBlank(message = "Timeline is required (1-52 weeks)")
    private String timeline; // e.g. "4 weeks" or "4"

    private Integer timelineWeeks;

    public ProjectCreateRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title != null ? title.trim() : null; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description != null ? description.trim() : null; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category != null ? category.trim() : null; }

    public Double getBudgetMin() { return budgetMin; }
    public void setBudgetMin(Double budgetMin) { this.budgetMin = budgetMin; }

    public Double getBudgetMax() { return budgetMax; }
    public void setBudgetMax(Double budgetMax) { this.budgetMax = budgetMax; }

    public String getTimeline() { return timeline; }
    public void setTimeline(String timeline) { this.timeline = timeline; }

    public Integer getTimelineWeeks() { return timelineWeeks; }
    public void setTimelineWeeks(Integer timelineWeeks) { this.timelineWeeks = timelineWeeks; }
}
