package com.devmatch.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "developerProfiles")
public class DeveloperProfile {
    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private List<String> skills = new ArrayList<>();
    private int yearsOfExperience = 0;
    private String bio = "";
    private List<String> portfolioLinks = new ArrayList<>();
    private double expectedRate = 0.0;
    private String availability = "AVAILABLE"; // AVAILABLE, PART_TIME, BUSY
    private double averageRating = 5.0; // new developers start at neutral 5.0
    private int completedProjects = 0;
    private int ratingCount = 0;

    public DeveloperProfile() {}

    public DeveloperProfile(String userId) {
        this.userId = userId;
        this.availability = "AVAILABLE";
        this.averageRating = 5.0;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills != null ? skills : new ArrayList<>(); }

    public int getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(int yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public List<String> getPortfolioLinks() { return portfolioLinks; }
    public void setPortfolioLinks(List<String> portfolioLinks) { this.portfolioLinks = portfolioLinks != null ? portfolioLinks : new ArrayList<>(); }

    public double getExpectedRate() { return expectedRate; }
    public void setExpectedRate(double expectedRate) { this.expectedRate = expectedRate; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }

    public int getCompletedProjects() { return completedProjects; }
    public void setCompletedProjects(int completedProjects) { this.completedProjects = completedProjects; }

    public int getRatingCount() { return ratingCount; }
    public void setRatingCount(int ratingCount) { this.ratingCount = ratingCount; }
}

