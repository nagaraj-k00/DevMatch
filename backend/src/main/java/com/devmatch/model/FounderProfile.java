package com.devmatch.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "founderProfiles")
public class FounderProfile {
    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private String organisation = "";
    private String about = "";

    public FounderProfile() {}

    public FounderProfile(String userId, String organisation, String about) {
        this.userId = userId;
        this.organisation = organisation;
        this.about = about;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getOrganisation() { return organisation; }
    public void setOrganisation(String organisation) { this.organisation = organisation; }

    public String getAbout() { return about; }
    public void setAbout(String about) { this.about = about; }
}

