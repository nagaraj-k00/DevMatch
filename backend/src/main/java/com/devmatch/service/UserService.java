package com.devmatch.service;

import com.devmatch.dto.ChangePasswordRequest;
import com.devmatch.dto.UserProfileDto;
import com.devmatch.model.DeveloperProfile;
import com.devmatch.model.FounderProfile;
import com.devmatch.model.Role;
import com.devmatch.model.User;
import com.devmatch.repository.DeveloperProfileRepository;
import com.devmatch.repository.FounderProfileRepository;
import com.devmatch.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeveloperProfileRepository developerProfileRepository;

    @Autowired
    private FounderProfileRepository founderProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MatchingService matchingService;

    public UserProfileDto getUserProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        UserProfileDto dto = new UserProfileDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setProfileImage(user.getProfileImage());
        dto.setActive(user.isActive());
        dto.setOnline(user.isOnline());
        dto.setLastSeenAt(user.getLastSeenAt());

        if (user.getRole() == Role.DEVELOPER) {
            developerProfileRepository.findByUserId(userId).ifPresent(p -> {
                dto.setSkills(p.getSkills());
                dto.setYearsOfExperience(p.getYearsOfExperience());
                dto.setBio(p.getBio());
                dto.setPortfolioLinks(p.getPortfolioLinks());
                dto.setExpectedRate(p.getExpectedRate());
                dto.setAvailability(p.getAvailability());
                dto.setAverageRating(p.getAverageRating());
                dto.setCompletedProjects(p.getCompletedProjects());
            });
        } else if (user.getRole() == Role.FOUNDER) {
            founderProfileRepository.findByUserId(userId).ifPresent(p -> {
                dto.setOrganisation(p.getOrganisation());
                dto.setAbout(p.getAbout());
            });
        }

        return dto;
    }

    public UserProfileDto updateUserProfile(String userId, UserProfileDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        if (dto.getName() != null && !dto.getName().isBlank()) {
            String trimmedName = dto.getName().trim();
            if (trimmedName.length() < 3 || trimmedName.length() > 50 || !trimmedName.matches("^[A-Za-z]+( [A-Za-z]+)*$")) {
                throw new IllegalArgumentException("Full name must be 3-50 characters, letters and single spaces only");
            }
            user.setName(trimmedName);
        }
        if (dto.getProfileImage() != null && !dto.getProfileImage().isBlank()) {
            String img = dto.getProfileImage();
            // Validate JPG/PNG only and max 2MB
            if (img.startsWith("data:")) {
                if (!img.startsWith("data:image/jpeg") && !img.startsWith("data:image/png") && !img.startsWith("data:image/jpg")) {
                    throw new IllegalArgumentException("Profile photo must be JPG or PNG format only");
                }
                // Base64 size estimation: (length * 3) / 4 bytes
                int approxBytes = (img.length() * 3) / 4;
                if (approxBytes > 2 * 1024 * 1024) {
                    throw new IllegalArgumentException("Profile photo exceeds maximum allowed size of 2 MB");
                }
            } else if (!img.toLowerCase().endsWith(".jpg") && !img.toLowerCase().endsWith(".jpeg") && !img.toLowerCase().endsWith(".png")) {
                if (!img.startsWith("https://")) {
                    throw new IllegalArgumentException("Profile photo must be JPG/PNG image URL or file upload");
                }
            }
            user.setProfileImage(img);
        }
        if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
            if (!dto.getPhone().trim().matches("^[6-9]\\d{9}$")) {
                throw new IllegalArgumentException("Phone must be a valid 10-digit Indian number starting with 6-9");
            }
            user.setPhone(dto.getPhone().trim());
        }
        userRepository.save(user);

        if (user.getRole() == Role.DEVELOPER) {
            DeveloperProfile profile = developerProfileRepository.findByUserId(userId)
                    .orElse(new DeveloperProfile(userId));

            if (dto.getSkills() != null) {
                if (dto.getSkills().isEmpty()) {
                    throw new IllegalArgumentException("Developer must select at least 1 skill from the predefined list");
                }
                if (dto.getSkills().size() > 20) {
                    throw new IllegalArgumentException("Developer cannot select more than 20 skills");
                }
                for (String s : dto.getSkills()) {
                    if (!UserProfileDto.PREDEFINED_SKILLS.contains(s)) {
                        throw new IllegalArgumentException("Skill '" + s + "' is not recognized. Please select from the predefined skill list");
                    }
                }
                profile.setSkills(dto.getSkills());
            }

            if (dto.getYearsOfExperience() < 0 || dto.getYearsOfExperience() > 50) {
                throw new IllegalArgumentException("Years of experience must be a whole number between 0 and 50");
            }
            profile.setYearsOfExperience(dto.getYearsOfExperience());

            if (dto.getExpectedRate() <= 0) {
                throw new IllegalArgumentException("Hourly rate must be greater than 0");
            }
            profile.setExpectedRate(dto.getExpectedRate());

            if (dto.getBio() != null) {
                if (dto.getBio().length() > 500) {
                    throw new IllegalArgumentException("Bio cannot exceed 500 characters (current length: " + dto.getBio().length() + ")");
                }
                profile.setBio(dto.getBio());
            }

            if (dto.getPortfolioLinks() != null) {
                for (String link : dto.getPortfolioLinks()) {
                    if (link != null && !link.isBlank()) {
                        if (!link.trim().startsWith("https://")) {
                            throw new IllegalArgumentException("Portfolio link '" + link + "' must be a secure URL starting with https://");
                        }
                    }
                }
                profile.setPortfolioLinks(dto.getPortfolioLinks());
            }

            if (dto.getAvailability() != null) profile.setAvailability(dto.getAvailability());

            developerProfileRepository.save(profile);

            // Trigger re-matching for projects when developer profile updates (FR-17)
            try {
                matchingService.refreshMatchesForDeveloper(userId);
            } catch (Exception ignored) {}
        } else if (user.getRole() == Role.FOUNDER) {
            FounderProfile profile = founderProfileRepository.findByUserId(userId)
                    .orElse(new FounderProfile(userId, "", ""));

            if (dto.getOrganisation() != null) profile.setOrganisation(dto.getOrganisation());
            if (dto.getAbout() != null) {
                if (dto.getAbout().length() > 500) {
                    throw new IllegalArgumentException("About section cannot exceed 500 characters");
                }
                profile.setAbout(dto.getAbout());
            }

            founderProfileRepository.save(profile);
        }

        return getUserProfile(userId);
    }

    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new IllegalArgumentException("New password must be different from current password");
        }

        String lowerNewPass = request.getNewPassword().toLowerCase();
        if (lowerNewPass.equals(user.getEmail().toLowerCase()) || lowerNewPass.contains(user.getName().toLowerCase().trim())) {
            throw new IllegalArgumentException("New password must not be identical to or contain your name or email");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}

