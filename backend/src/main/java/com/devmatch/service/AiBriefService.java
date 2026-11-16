package com.devmatch.service;

import com.devmatch.dto.ProjectBriefDto;
import com.devmatch.model.Project;
import com.devmatch.model.ProjectBrief;
import com.devmatch.model.ProjectBrief.SuggestedMilestone;
import com.devmatch.model.ProjectStatus;
import com.devmatch.repository.ProjectBriefRepository;
import com.devmatch.repository.ProjectRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class AiBriefService {

    private static final Logger logger = LoggerFactory.getLogger(AiBriefService.class);

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    @Value("${openai.api.key:}")
    private String openAiApiKey;

    @Value("${openai.model:gpt-3.5-turbo}")
    private String openAiModel;

    @Autowired
    private ProjectBriefRepository projectBriefRepository;

    @Autowired
    private ProjectRepository projectRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public ProjectBrief generateOrGetBrief(String projectId) {
        Optional<ProjectBrief> existing = projectBriefRepository.findByProjectId(projectId);
        if (existing.isPresent()) {
            return existing.get();
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        ProjectBrief brief = generateBrief(project);
        brief.setProjectId(projectId);
        return projectBriefRepository.save(brief);
    }

    public ProjectBrief quickAnalyseIdea(String ideaText) {
        Project dummy = new Project();
        dummy.setTitle(ideaText.length() > 50 ? ideaText.substring(0, 47) + "..." : ideaText);
        dummy.setDescription(ideaText);
        dummy.setCategory("Web & Mobile Application");
        dummy.setBudgetMin(15000.0);
        dummy.setBudgetMax(50000.0);
        dummy.setTimeline("3-4 weeks");
        return generateBrief(dummy);
    }

    public ProjectBrief generateBrief(Project project) {
        // Priority 1: Google Gemini (Gemini 2.5 Flash)
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty() && !geminiApiKey.startsWith("placeholder")) {
            try {
                logger.info("Generating project brief with Google Gemini ({})", geminiModel);
                return callGeminiForBrief(project);
            } catch (Exception e) {
                logger.warn("Google Gemini API call failed: {}. Falling back...", e.getMessage());
            }
        }

        // Priority 2: OpenAI API
        if (openAiApiKey != null && !openAiApiKey.trim().isEmpty() && !openAiApiKey.startsWith("sk-placeholder")) {
            try {
                logger.info("Generating project brief with OpenAI ({})", openAiModel);
                return callOpenAiForBrief(project);
            } catch (Exception e) {
                logger.warn("OpenAI API call failed, falling back to built-in NLP extractor: {}", e.getMessage());
            }
        }

        // Priority 3: Rule-based NLP Extractor
        return generateRuleBasedBrief(project);
    }

    private ProjectBrief callGeminiForBrief(Project project) throws Exception {
        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey.trim();
        URL url = URI.create(endpoint).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setConnectTimeout(12000);
        conn.setReadTimeout(20000);
        conn.setDoOutput(true);

        String prompt = "You are an expert technical architect and software consultant. Analyze the following project idea submitted by a founder and convert it into a structured technical project brief.\n" +
                "Output MUST be strictly valid JSON without any markdown code fences or conversational text:\n" +
                "{\n" +
                "  \"summary\": \"One concise paragraph technical summary explaining architecture and scope\",\n" +
                "  \"coreFeatures\": [\"feature 1\", \"feature 2\", \"feature 3\"],\n" +
                "  \"optionalFeatures\": [\"optional feature 1\", \"optional feature 2\"],\n" +
                "  \"requiredSkills\": [\"Skill1\", \"Skill2\", \"Skill3\"],\n" +
                "  \"suggestedStack\": [\"Tech1\", \"Tech2\", \"Tech3\"],\n" +
                "  \"complexity\": \"Low\" | \"Medium\" | \"High\",\n" +
                "  \"suggestedMilestones\": [\n" +
                "    {\"title\": \"Milestone 1: ...\", \"description\": \"...\", \"estimatedAmount\": 15000, \"estimatedDays\": 10},\n" +
                "    {\"title\": \"Milestone 2: ...\", \"description\": \"...\", \"estimatedAmount\": 20000, \"estimatedDays\": 14}\n" +
                "  ],\n" +
                "  \"missingInfoQuestions\": [\"question 1\", \"question 2\"]\n" +
                "}\n\n" +
                "Project Title: " + project.getTitle() + "\n" +
                "Description: " + project.getDescription() + "\n" +
                "Category: " + (project.getCategory() != null ? project.getCategory() : "Software Development") + "\n" +
                "Budget Range: ₹" + project.getBudgetMin() + " - ₹" + project.getBudgetMax() + "\n" +
                "Timeline: " + (project.getTimeline() != null ? project.getTimeline() : "4-6 weeks");

        Map<String, Object> reqBody = new HashMap<>();
        reqBody.put("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));

        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("temperature", 0.3);
        genConfig.put("responseMimeType", "application/json");
        reqBody.put("generationConfig", genConfig);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(objectMapper.writeValueAsBytes(reqBody));
        }

        int responseCode = conn.getResponseCode();
        if (responseCode != 200) {
            StringBuilder errBuilder = new StringBuilder();
            try (BufferedReader errBr = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = errBr.readLine()) != null) errBuilder.append(line);
            }
            throw new RuntimeException("Gemini HTTP error " + responseCode + ": " + errBuilder);
        }

        StringBuilder responseBuilder = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) responseBuilder.append(line);
        }

        JsonNode root = objectMapper.readTree(responseBuilder.toString());
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new RuntimeException("Gemini returned empty candidate list");
        }

        String jsonText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        return parseBriefJson(jsonText, project);
    }

    private ProjectBrief callOpenAiForBrief(Project project) throws Exception {
        URL url = URI.create("https://api.openai.com/v1/chat/completions").toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Authorization", "Bearer " + openAiApiKey);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setConnectTimeout(8000);
        conn.setReadTimeout(15000);
        conn.setDoOutput(true);

        String systemPrompt = "You are an expert software technical architect. Convert the user's project idea into a structured JSON technical brief. Output MUST be strictly valid JSON without markdown wrapping: {" +
                "\"summary\": \"One paragraph clear technical summary\"," +
                "\"coreFeatures\": [\"feature 1\", \"feature 2\"]," +
                "\"optionalFeatures\": [\"feature 1\"]," +
                "\"requiredSkills\": [\"Skill1\", \"Skill2\"]," +
                "\"suggestedStack\": [\"Tech1\", \"Tech2\"]," +
                "\"complexity\": \"Low\" | \"Medium\" | \"High\"," +
                "\"suggestedMilestones\": [{\"title\": \"M1\", \"description\": \"desc\", \"estimatedAmount\": 0, \"estimatedDays\": 7}]," +
                "\"missingInfoQuestions\": [\"question 1\", \"question 2\"]" +
                "}";

        String userPrompt = "Project Title: " + project.getTitle() + "\n" +
                "Description: " + project.getDescription() + "\n" +
                "Category: " + project.getCategory() + "\n" +
                "Budget Range: $" + project.getBudgetMin() + " - $" + project.getBudgetMax() + "\n" +
                "Timeline: " + project.getTimeline();

        Map<String, Object> reqBody = new HashMap<>();
        reqBody.put("model", openAiModel);
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userPrompt));
        reqBody.put("messages", messages);
        reqBody.put("temperature", 0.4);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(objectMapper.writeValueAsBytes(reqBody));
        }

        if (conn.getResponseCode() != 200) {
            throw new RuntimeException("OpenAI HTTP error: " + conn.getResponseCode());
        }

        StringBuilder responseBuilder = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) responseBuilder.append(line);
        }

        JsonNode root = objectMapper.readTree(responseBuilder.toString());
        String content = root.path("choices").get(0).path("message").path("content").asText();
        return parseBriefJson(content, project);
    }

    private ProjectBrief parseBriefJson(String rawContent, Project project) throws Exception {
        String content = rawContent.trim();
        if (content.contains("```json")) {
            content = content.substring(content.indexOf("```json") + 7);
            if (content.contains("```")) content = content.substring(0, content.indexOf("```"));
        } else if (content.contains("```")) {
            content = content.substring(content.indexOf("```") + 3);
            if (content.contains("```")) content = content.substring(0, content.indexOf("```"));
        }

        JsonNode briefJson = objectMapper.readTree(content.trim());
        ProjectBrief brief = new ProjectBrief();
        brief.setSummary(briefJson.path("summary").asText("Technical specification architected by Gemini AI."));

        List<String> core = new ArrayList<>();
        JsonNode coreNode = briefJson.path("coreFeatures");
        if (coreNode.isArray()) {
            coreNode.forEach(f -> core.add(f.asText()));
        }
        if (core.isEmpty()) {
            core.addAll(List.of("User authentication & JWT security", "Responsive web/mobile UI", "RESTful API endpoints", "Escrow payment protection"));
        }
        brief.setCoreFeatures(core);

        List<String> optional = new ArrayList<>();
        JsonNode optNode = briefJson.path("optionalFeatures");
        if (optNode.isArray()) {
            optNode.forEach(f -> optional.add(f.asText()));
        }
        brief.setOptionalFeatures(optional);

        List<String> skills = new ArrayList<>();
        JsonNode skillsNode = briefJson.path("requiredSkills");
        if (skillsNode.isArray()) {
            skillsNode.forEach(s -> skills.add(s.asText()));
        }
        if (skills.isEmpty()) {
            skills.addAll(List.of("React", "Spring Boot", "Java", "MongoDB"));
        }
        brief.setRequiredSkills(skills);

        List<String> stack = new ArrayList<>();
        JsonNode stackNode = briefJson.path("suggestedStack");
        if (stackNode.isArray()) {
            stackNode.forEach(s -> stack.add(s.asText()));
        } else if (stackNode.isObject()) {
            Iterator<String> fieldNames = stackNode.fieldNames();
            while (fieldNames.hasNext()) {
                String key = fieldNames.next();
                stack.add(key + ": " + stackNode.get(key).asText());
            }
        }
        if (stack.isEmpty()) {
            stack.addAll(List.of("React 18", "Spring Boot 3", "MongoDB Atlas", "Razorpay Escrow"));
        }
        brief.setSuggestedStack(stack);

        String complexity = briefJson.path("complexity").asText("Medium");
        if (complexity.toLowerCase().contains("high")) complexity = "High";
        else if (complexity.toLowerCase().contains("low")) complexity = "Low";
        else complexity = "Medium";
        brief.setComplexity(complexity);

        List<String> questions = new ArrayList<>();
        JsonNode qNode = briefJson.path("missingInfoQuestions");
        if (qNode.isArray()) {
            qNode.forEach(q -> questions.add(q.asText()));
        }
        if (questions.isEmpty()) {
            questions.add("Do you have existing wireframes or design guidelines?");
            questions.add("Are there specific third-party APIs or infrastructure preferences?");
        }
        brief.setMissingInfoQuestions(questions);

        double totalBudget = project.getBudgetMax() > 0 ? project.getBudgetMax() : 45000.0;
        List<SuggestedMilestone> milestones = new ArrayList<>();
        JsonNode msNode = briefJson.path("suggestedMilestones");
        if (msNode.isArray() && !msNode.isEmpty()) {
            msNode.forEach(m -> {
                String title = m.path("title").asText(m.path("phase").asText("Milestone Phase"));
                String desc = m.path("description").asText("Key phase deliverables");
                double amount = m.path("estimatedAmount").asDouble(totalBudget / Math.max(1, msNode.size()));
                int days = m.path("estimatedDays").asInt(14);
                milestones.add(new SuggestedMilestone(title, desc, amount, days));
            });
        }

        if (milestones.isEmpty()) {
            milestones.add(new SuggestedMilestone("Milestone 1: Project Setup & Core Architecture", "Environment setup, database schema, authentication & basic dashboard", Math.round(totalBudget * 0.3), 10));
            milestones.add(new SuggestedMilestone("Milestone 2: Core Feature Implementation", "Main functional modules, business logic, integrations and UI components", Math.round(totalBudget * 0.4), 15));
            milestones.add(new SuggestedMilestone("Milestone 3: Final Delivery, Polish & Review", "End-to-end testing, security audits, deployment and final handover", Math.round(totalBudget * 0.3), 7));
        }
        brief.setSuggestedMilestones(milestones);

        return brief;
    }

    public ProjectBrief generateRuleBasedBrief(Project project) {
        ProjectBrief brief = new ProjectBrief();
        String desc = (project.getDescription() + " " + project.getTitle()).toLowerCase();
        double budget = project.getBudgetMax() > 0 ? project.getBudgetMax() : 2000.0;

        Set<String> skills = new LinkedHashSet<>();
        Set<String> stack = new LinkedHashSet<>();

        if (desc.contains("java") || desc.contains("spring") || desc.contains("boot") || desc.contains("backend") || desc.contains("api")) {
            skills.add("Java");
            skills.add("Spring Boot");
            stack.add("Spring Boot 3 REST");
        }
        if (desc.contains("react") || desc.contains("frontend") || desc.contains("web") || desc.contains("ui") || desc.contains("dashboard")) {
            skills.add("React");
            skills.add("Tailwind CSS");
            stack.add("React.js SPA");
        }
        if (desc.contains("mongo") || desc.contains("database") || desc.contains("nosql")) {
            skills.add("MongoDB");
            stack.add("MongoDB Atlas");
        }
        if (desc.contains("payment") || desc.contains("razorpay") || desc.contains("escrow") || desc.contains("stripe")) {
            skills.add("Payment Gateway");
            stack.add("Razorpay API");
        }
        if (desc.contains("chat") || desc.contains("message") || desc.contains("real-time") || desc.contains("websocket")) {
            skills.add("WebSocket");
            skills.add("STOMP");
            stack.add("Spring WebSocket");
        }
        if (desc.contains("ai") || desc.contains("nlp") || desc.contains("openai") || desc.contains("gemini") || desc.contains("gpt") || desc.contains("match")) {
            skills.add("NLP");
            skills.add("AI Integration");
            stack.add("Gemini 2.5 Flash API");
        }
        if (desc.contains("mobile") || desc.contains("app") || desc.contains("ios") || desc.contains("android") || desc.contains("react native")) {
            skills.add("React Native");
            stack.add("Mobile App");
        }

        if (skills.isEmpty()) {
            skills.addAll(List.of("Java", "Spring Boot", "React", "MongoDB"));
            stack.addAll(List.of("Spring Boot 3", "React.js", "MongoDB", "Tailwind CSS"));
        } else if (skills.size() < 3) {
            skills.add("REST APIs");
            skills.add("Git");
        }

        brief.setRequiredSkills(new ArrayList<>(skills));
        brief.setSuggestedStack(new ArrayList<>(stack));

        if (skills.size() > 5 || desc.contains("scale") || desc.contains("complex") || desc.contains("microservices") || budget >= 50000) {
            brief.setComplexity("High");
        } else if (skills.size() <= 2 && budget <= 10000) {
            brief.setComplexity("Low");
        } else {
            brief.setComplexity("Medium");
        }

        brief.setSummary(String.format("Technical specification for '%s': A scalable %s solution focused on robust architecture, role-based workflows, and intuitive user experiences built with %s.",
                project.getTitle(), project.getCategory(), String.join(", ", skills)));

        List<String> core = new ArrayList<>();
        core.add("User authentication, role-based authorization, and JWT security");
        core.add("Responsive UI architecture for desktop and mobile clients");
        core.add("Secure data persistence with MongoDB document models");
        if (skills.contains("Payment Gateway") || desc.contains("pay")) {
            core.add("Escrow-style milestone payments and transaction verification via Razorpay");
        }
        if (skills.contains("WebSocket") || desc.contains("chat")) {
            core.add("Real-time collaborative chat and document exchange");
        }
        brief.setCoreFeatures(core);

        List<String> optional = new ArrayList<>();
        optional.add("Advanced analytics dashboard & PDF audit export");
        optional.add("Automated email notifications and event webhooks");
        optional.add("Multi-factor authentication (MFA)");
        brief.setOptionalFeatures(optional);

        List<SuggestedMilestone> milestones = new ArrayList<>();
        milestones.add(new SuggestedMilestone("Milestone 1: Project Setup & Core Architecture", "Environment setup, database schema, authentication & basic dashboard", Math.round(budget * 0.3), 10));
        milestones.add(new SuggestedMilestone("Milestone 2: Core Feature Implementation", "Main functional modules, business logic, integrations and UI components", Math.round(budget * 0.4), 15));
        milestones.add(new SuggestedMilestone("Milestone 3: Final Delivery, Polish & Review", "End-to-end testing, security audits, deployment and final handover", Math.round(budget * 0.3), 7));
        brief.setSuggestedMilestones(milestones);

        List<String> questions = new ArrayList<>();
        questions.add("Do you already have Figma designs, brand assets, or wireframes for this project?");
        questions.add("Are there specific third-party integrations (e.g. Google Auth, custom APIs) required?");
        if (budget < 15000) {
            questions.add("Your budget is on the leaner side: should we prioritize a core MVP for Phase 1?");
        } else {
            questions.add("Are there regulatory requirements (e.g. GDPR, HIPAA, PCI-DSS compliance) to follow?");
        }
        brief.setMissingInfoQuestions(questions);

        return brief;
    }

    public ProjectBrief updateAndConfirmBrief(String projectId, ProjectBriefDto dto) {
        ProjectBrief brief = projectBriefRepository.findByProjectId(projectId)
                .orElse(new ProjectBrief());

        brief.setProjectId(projectId);
        if (dto.getSummary() != null) brief.setSummary(dto.getSummary());
        if (dto.getCoreFeatures() != null) brief.setCoreFeatures(dto.getCoreFeatures());
        if (dto.getOptionalFeatures() != null) brief.setOptionalFeatures(dto.getOptionalFeatures());
        if (dto.getRequiredSkills() != null) brief.setRequiredSkills(dto.getRequiredSkills());
        if (dto.getSuggestedStack() != null) brief.setSuggestedStack(dto.getSuggestedStack());
        if (dto.getComplexity() != null) brief.setComplexity(dto.getComplexity());
        if (dto.getSuggestedMilestones() != null) brief.setSuggestedMilestones(dto.getSuggestedMilestones());
        if (dto.getMissingInfoQuestions() != null && !dto.getMissingInfoQuestions().isEmpty()) {
            brief.setMissingInfoQuestions(dto.getMissingInfoQuestions());
        }
        brief.setConfirmedByFounder(true);

        ProjectBrief saved = projectBriefRepository.save(brief);

        projectRepository.findById(projectId).ifPresent(p -> {
            if (p.getStatus() == ProjectStatus.DRAFT) {
                p.setStatus(ProjectStatus.OPEN);
                projectRepository.save(p);
            }
        });

        return saved;
    }
}
