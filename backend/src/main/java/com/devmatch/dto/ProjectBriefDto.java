package com.devmatch.dto;

import com.devmatch.model.ProjectBrief.SuggestedMilestone;
import java.util.ArrayList;
import java.util.List;

public class ProjectBriefDto {
    private String summary;
    private List<String> coreFeatures = new ArrayList<>();
    private List<String> optionalFeatures = new ArrayList<>();
    private List<String> requiredSkills = new ArrayList<>();
    private List<String> suggestedStack = new ArrayList<>();
    private String complexity;
    private List<SuggestedMilestone> suggestedMilestones = new ArrayList<>();
    private List<String> missingInfoQuestions = new ArrayList<>();
    private boolean confirmedByFounder;

    public ProjectBriefDto() {}

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

