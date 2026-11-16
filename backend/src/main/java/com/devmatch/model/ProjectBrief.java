package com.devmatch.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "projectBriefs")
public class ProjectBrief {
    @Id
    private String id;

    @Indexed(unique = true)
    private String projectId;

    private String summary = "";
    private List<String> coreFeatures = new ArrayList<>();
    private List<String> optionalFeatures = new ArrayList<>();
    private List<String> requiredSkills = new ArrayList<>();
    private List<String> suggestedStack = new ArrayList<>();
    private String complexity = "Medium"; // Low, Medium, High
    private List<SuggestedMilestone> suggestedMilestones = new ArrayList<>();
    private List<String> missingInfoQuestions = new ArrayList<>();
    private boolean confirmedByFounder = false;

    public static class SuggestedMilestone {
        private String title;
        private String description;
        private double estimatedAmount;
        private int estimatedDays;

        public SuggestedMilestone() {}

        public SuggestedMilestone(String title, String description, double estimatedAmount, int estimatedDays) {
            this.title = title;
            this.description = description;
            this.estimatedAmount = estimatedAmount;
            this.estimatedDays = estimatedDays;
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public double getEstimatedAmount() { return estimatedAmount; }
        public void setEstimatedAmount(double estimatedAmount) { this.estimatedAmount = estimatedAmount; }

        public int getEstimatedDays() { return estimatedDays; }
        public void setEstimatedDays(int estimatedDays) { this.estimatedDays = estimatedDays; }
    }

    public ProjectBrief() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public List<String> getCoreFeatures() { return coreFeatures; }
    public void setCoreFeatures(List<String> coreFeatures) { this.coreFeatures = coreFeatures != null ? coreFeatures : new ArrayList<>(); }

    public List<String> getOptionalFeatures() { return optionalFeatures; }
    public void setOptionalFeatures(List<String> optionalFeatures) { this.optionalFeatures = optionalFeatures != null ? optionalFeatures : new ArrayList<>(); }

    public List<String> getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(List<String> requiredSkills) { this.requiredSkills = requiredSkills != null ? requiredSkills : new ArrayList<>(); }

    public List<String> getSuggestedStack() { return suggestedStack; }
    public void setSuggestedStack(List<String> suggestedStack) { this.suggestedStack = suggestedStack != null ? suggestedStack : new ArrayList<>(); }

    public String getComplexity() { return complexity; }
    public void setComplexity(String complexity) { this.complexity = complexity; }

    public List<SuggestedMilestone> getSuggestedMilestones() { return suggestedMilestones; }
    public void setSuggestedMilestones(List<SuggestedMilestone> suggestedMilestones) { this.suggestedMilestones = suggestedMilestones != null ? suggestedMilestones : new ArrayList<>(); }

    public List<String> getMissingInfoQuestions() { return missingInfoQuestions; }
    public void setMissingInfoQuestions(List<String> missingInfoQuestions) { this.missingInfoQuestions = missingInfoQuestions != null ? missingInfoQuestions : new ArrayList<>(); }

    public boolean isConfirmedByFounder() { return confirmedByFounder; }
    public void setConfirmedByFounder(boolean confirmedByFounder) { this.confirmedByFounder = confirmedByFounder; }
}

