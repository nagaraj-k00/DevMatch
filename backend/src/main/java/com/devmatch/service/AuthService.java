package com.devmatch.service;

import com.devmatch.dto.AuthRequest;
import com.devmatch.dto.AuthResponse;
import com.devmatch.dto.RegisterRequest;
import com.devmatch.model.DeveloperProfile;
import com.devmatch.model.FounderProfile;
import com.devmatch.model.Role;
import com.devmatch.model.User;
import com.devmatch.repository.DeveloperProfileRepository;
import com.devmatch.repository.FounderProfileRepository;
import com.devmatch.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeveloperProfileRepository developerProfileRepository;

    @Autowired
    private FounderProfileRepository founderProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("Email is already registered: " + cleanEmail);
        }

        if (request.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Cannot self-register as ADMIN");
        }

        if (request.getConfirmPassword() != null && !request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Confirm password does not match password");
        }

        String lowerPass = request.getPassword().toLowerCase();
        String lowerName = request.getName().toLowerCase().trim();
        if (lowerPass.equals(lowerName) || lowerPass.equals(cleanEmail) || lowerPass.contains(lowerName)) {
            throw new IllegalArgumentException("Password must not be the same as or contain your name or email");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(cleanEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setPhone(request.getPhone());
        user.setActive(true);
        user = userRepository.save(user);

        if (user.getRole() == Role.DEVELOPER) {
            DeveloperProfile devProfile = new DeveloperProfile(user.getId());
            developerProfileRepository.save(devProfile);
        } else if (user.getRole() == Role.FOUNDER) {
            FounderProfile founderProfile = new FounderProfile(user.getId(), "", "");
            founderProfileRepository.save(founderProfile);
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getProfileImage());
    }

    public AuthResponse login(AuthRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().toLowerCase());
        if (userOpt.isEmpty()) {
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userOpt.get();
        if (!user.isActive()) {
            throw new BadCredentialsException("Account is deactivated. Please contact administrator.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getProfileImage());
    }

    public User getCurrentAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof User)) {
            throw new IllegalStateException("User not authenticated");
        }
        return (User) auth.getPrincipal();
    }
}

