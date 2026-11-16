package com.devmatch.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class ProposalCreateRequest {

    @NotNull(message = "Quoted bid amount is required")
    @Positive(message = "Quoted bid amount must be greater than 0")
    private Double bidAmount;

    @Min(value = 1, message = "Estimated timeline must be between 1 and 52 weeks")
    @Max(value = 52, message = "Estimated timeline must be between 1 and 52 weeks")
    private Integer estimatedWeeks;

    // For backwards compatibility with days
    private Integer estimatedDays;

    @NotBlank(message = "Proposal message is required")
    @Size(min = 50, max = 1000, message = "Proposal message must be between 50 and 1,000 characters")
    private String coverLetter;

    public ProposalCreateRequest() {}

    public Double getBidAmount() { return bidAmount; }
    public void setBidAmount(Double bidAmount) { this.bidAmount = bidAmount; }

    public Integer getEstimatedWeeks() { return estimatedWeeks; }
    public void setEstimatedWeeks(Integer estimatedWeeks) { this.estimatedWeeks = estimatedWeeks; }

    public Integer getEstimatedDays() { return estimatedDays; }
    public void setEstimatedDays(Integer estimatedDays) { this.estimatedDays = estimatedDays; }

    public String getCoverLetter() { return coverLetter; }
    public void setCoverLetter(String coverLetter) { this.coverLetter = coverLetter != null ? coverLetter.trim() : null; }
}

