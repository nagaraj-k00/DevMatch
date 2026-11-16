package com.devmatch.controller;

import com.devmatch.dto.ApiResponse;
import com.devmatch.model.DeveloperMatch;
import com.devmatch.model.User;
import com.devmatch.service.AuthService;
import com.devmatch.service.MatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class DeveloperMatchController {

    @Autowired
    private MatchingService matchingService;

    @Autowired
    private AuthService authService;

    @GetMapping("/projects/{id}/matches")
    public ResponseEntity<ApiResponse<List<DeveloperMatch>>> getProjectMatches(@PathVariable String id) {
        List<DeveloperMatch> matches = matchingService.findMatchesForProject(id);
        return ResponseEntity.ok(ApiResponse.ok(matches));
    }

    @GetMapping("/developers/matches")
    public ResponseEntity<ApiResponse<List<DeveloperMatch>>> getDeveloperMatchedProjects() {
        User user = authService.getCurrentAuthenticatedUser();
        List<DeveloperMatch> matches = matchingService.findProjectsForDeveloper(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(matches));
    }
}

