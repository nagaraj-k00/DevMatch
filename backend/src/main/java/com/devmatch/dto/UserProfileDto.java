package com.devmatch.dto;

import com.devmatch.model.Role;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class UserProfileDto {

    public static final Set<String> PREDEFINED_SKILLS = Set.of(
        "React", "Vue", "Angular", "Node.js", "Express", "Spring Boot", "Java",
        "Python", "Django", "FastAPI", "Go", "Rust", "C#", ".NET", "Flutter",
        "React Native", "Swift", "Kotlin", "PostgreSQL", "MongoDB", "Redis",
        "Docker", "Kubernetes", "AWS", "GCP", "Azure", "GraphQL", "Tailwind CSS",
        "TypeScript", "Next.js", "Microservices", "Machine Learning", "TensorFlow", "PyTorch"
    );

    private String id;
    private String name;
    private String email;
    private Role role;
    private String profileImage;
    private String phone;
    private boolean active;
    private boolean online;
    private java.time.Instant lastSeenAt;

    // Founder fields
    @Size(max = 100, message = "Organisation name must not exceed 100 characters")
    private String organisation;

    @Size(max = 500, message = "About text must not exceed 500 characters")
    private String about;

    // Developer fields
    private List<String> skills = new ArrayList<>();

    @Min(value = 0, message = "Experience must be between 0 and 50 years")
    @Max(value = 50, message = "Experience must be between 0 and 50 years")
    private int yearsOfExperience;

    @Size(max = 500, message = "Bio must not exceed 500 characters")
    private String bio;

    private List<String> portfolioLinks = new ArrayList<>();

    @Positive(message = "Hourly rate must be greater than 0")
    private double expectedRate;

    private String availability;
    private double averageRating;
    private int completedProjects;

    public UserProfileDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isOnline() { return online; }
    public void setOnline(boolean online) { this.online = online; }

    public java.time.Instant getLastSeenAt() { return lastSeenAt; }
    public void setLastSeenAt(java.time.Instant lastSeenAt) { this.lastSeenAt = lastSeenAt; }

    public String getOrganisation() { return organisation; }
    public void setOrganisation(String organisation) { this.organisation = organisation; }

    public String getAbout() { return about; }
    public void setAbout(String about) { this.about = about; }

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
}
