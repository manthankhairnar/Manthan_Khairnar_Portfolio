/* =====================================================================
   TABLE CONFIG — metadata that drives the generic CRUD engine (crud.js)
   so every content table gets a full Add/Edit/Save/Cancel/Delete/
   Reorder UI without hand-writing 15 separate forms.
   ===================================================================== */
window.TABLES = {
  site_settings: { label: "Settings", icon: "settings", singleton: true, fields: [
    { name: "site_title", label: "Site Title", type: "text" },
    { name: "seo_title", label: "SEO Title", type: "text" },
    { name: "seo_description", label: "SEO Description", type: "textarea" },
    { name: "og_image_url", label: "Open Graph Image", type: "image" },
    { name: "footer_quote", label: "Footer Quote", type: "text" },
    { name: "favicon_url", label: "Favicon", type: "image" },
    { name: "status", label: "Status", type: "status" }
  ]},
  appearance: { label: "Appearance", icon: "palette", singleton: true, fields: [
    { name: "primary_color", label: "Primary Color", type: "color" },
    { name: "accent_color", label: "Accent Color", type: "color" },
    { name: "background_color", label: "Background Color", type: "color" },
    { name: "text_color", label: "Text Color", type: "color" },
    { name: "card_color", label: "Card Color", type: "color" },
    { name: "font_heading", label: "Heading Font", type: "text" },
    { name: "font_body", label: "Body Font", type: "text" },
    { name: "border_radius", label: "Border Radius (CSS value)", type: "text" },
    { name: "button_style", label: "Button Style", type: "select", options: ["pill", "rounded", "square"] },
    { name: "theme_mode", label: "Theme Mode", type: "select", options: ["light", "dark", "auto"] },
    { name: "section_spacing", label: "Section Spacing", type: "select", options: ["compact", "comfortable", "spacious"] }
  ]},
  hero: { label: "Hero", icon: "home", singleton: true, fields: [
    { name: "eyebrow", label: "Eyebrow", type: "text" },
    { name: "headline", label: "Headline", type: "textarea" },
    { name: "subtitle", label: "Subtitle", type: "textarea" },
    { name: "photo_url", label: "Profile Photo", type: "image" },
    { name: "intro_video_url", label: "Intro Video", type: "video" },
    { name: "resume_url", label: "Resume PDF", type: "pdf" },
    { name: "tag1", label: "Tag 1", type: "text" },
    { name: "tag2", label: "Tag 2", type: "text" },
    { name: "tag3", label: "Tag 3", type: "text" },
    { name: "cta_primary_label", label: "CTA Label", type: "text" },
    { name: "cta_primary_link", label: "CTA Link", type: "text" },
    { name: "status", label: "Status", type: "status" }
  ]},
  about: { label: "About", icon: "user", singleton: true, fields: [
    { name: "badge_text", label: "Section Label", type: "text" },
    { name: "body_html", label: "Body (wrap paragraphs in <p>...</p>)", type: "textarea" },
    { name: "fact1_title", label: "Fact 1 Title", type: "text" }, { name: "fact1_sub", label: "Fact 1 Subtitle", type: "text" },
    { name: "fact2_title", label: "Fact 2 Title", type: "text" }, { name: "fact2_sub", label: "Fact 2 Subtitle", type: "text" },
    { name: "fact3_title", label: "Fact 3 Title", type: "text" }, { name: "fact3_sub", label: "Fact 3 Subtitle", type: "text" },
    { name: "fact4_title", label: "Fact 4 Title", type: "text" }, { name: "fact4_sub", label: "Fact 4 Subtitle", type: "text" },
    { name: "status", label: "Status", type: "status" }
  ]},
   
   journey: { label: "Journey", icon: "map", singleton: false, listCols: ["role_group", "entry_date", "title", "status"], fields: [
    { name: "role_group", label: "Tab / Role", type: "text" },
    { name: "entry_date", label: "Date", type: "text" },
    { name: "category", label: "Category", type: "select", options: ["environment", "health", "civic", "camp"] },
    { name: "badge", label: "Badge", type: "text" },
    { name: "title", label: "Title", type: "text", required: true },
    { name: "venue", label: "Venue", type: "text" },
    { name: "participants", label: "Participants", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "learning", label: "Personal Learning", type: "textarea" },
    { name: "status", label: "Status", type: "status" }
  ]},
  camp_days: { label: "Camp Days", icon: "tent", singleton: false, listCols: ["day_label", "title", "status"], fields: [
    { name: "day_label", label: "Day Label", type: "text", required: true },
    { name: "title", label: "Title", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "status", label: "Status", type: "status" }
  ]},
  education: { label: "Education", icon: "book", singleton: false, listCols: ["degree", "institution", "status"], fields: [
    { name: "degree", label: "Degree", type: "text", required: true },
    { name: "institution", label: "Institution", type: "text" },
    { name: "location", label: "Location", type: "text" },
    { name: "start_date", label: "Start Date", type: "text" },
    { name: "end_date", label: "End Date", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "status", label: "Status", type: "status" }
  ]},
  experience: { label: "Experience", icon: "briefcase", singleton: false, listCols: ["role", "organization", "status"], fields: [
    { name: "role", label: "Role", type: "text", required: true },
    { name: "organization", label: "Organization", type: "text" },
    { name: "location", label: "Location", type: "text" },
    { name: "start_date", label: "Start Date", type: "text" },
    { name: "end_date", label: "End Date", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "status", label: "Status", type: "status" }
  ]},
  projects: { label: "Projects", icon: "code", singleton: false, listCols: ["title", "tag", "status"], fields: [
    { name: "tag", label: "Tag", type: "text" },
    { name: "title", label: "Title", type: "text", required: true },
    { name: "problem", label: "Problem Statement", type: "textarea" },
    { name: "objective", label: "Objective", type: "textarea" },
    { name: "approach", label: "Approach", type: "textarea" },
    { name: "technologies", label: "Technologies Used", type: "text" },
    { name: "outcome", label: "Outcome", type: "textarea" },
    { name: "image_url", label: "Image", type: "image" },
    { name: "project_link", label: "Project Link", type: "text" },
    { name: "github_link", label: "GitHub Link", type: "text" },
    { name: "status", label: "Status", type: "status" }
  ]},
  gallery: { label: "Gallery", icon: "image", singleton: false, listCols: ["caption", "category", "status"], fields: [
    { name: "image_url", label: "Image", type: "image", required: true },
    { name: "caption", label: "Caption", type: "text" },
    { name: "category", label: "Category", type: "select", options: ["environment", "health", "civic", "camp"] },
    { name: "status", label: "Status", type: "status" }
  ]},
  skills: { label: "Skills", icon: "star", singleton: false, listCols: ["group_name", "skill_name", "status"], fields: [
    { name: "group_name", label: "Group", type: "text", required: true },
    { name: "skill_name", label: "Skill", type: "text", required: true },
    { name: "level", label: "Level (0-100, optional)", type: "number" },
    { name: "status", label: "Status", type: "status" }
  ]},
  certificates: { label: "Certificates", icon: "award", singleton: false, listCols: ["title", "issuer", "status"], fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "issuer", label: "Issuer", type: "text" },
    { name: "issue_date", label: "Issue Date", type: "text" },
    { name: "image_url", label: "Image", type: "image" },
    { name: "pdf_url", label: "PDF", type: "pdf" },
    { name: "status", label: "Status", type: "status" }
  ]},
  achievements: { label: "Achievements", icon: "trophy", singleton: false, listCols: ["title", "stat_number", "status"], fields: [
    { name: "stat_number", label: "Stat Number", type: "text" },
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "status", label: "Status", type: "status" }
  ]},
  impact_stats: { label: "Impact Stats", icon: "trending-up", singleton: false, listCols: ["value", "label", "status"], fields: [
    { name: "value", label: "Value", type: "number", required: true },
    { name: "label", label: "Label", type: "text", required: true },
    { name: "status", label: "Status", type: "status" }
  ]},
  blog: { label: "Blog", icon: "edit", singleton: false, listCols: ["title", "category", "status"], fields: [
    { name: "category", label: "Category", type: "text" },
    { name: "title", label: "Title", type: "text", required: true },
    { name: "excerpt", label: "Excerpt", type: "textarea" },
    { name: "content", label: "Content", type: "textarea" },
    { name: "cover_image_url", label: "Cover Image", type: "image" },
    { name: "status", label: "Status", type: "status" }
  ]},
  social_links: { label: "Social Links", icon: "link", singleton: false, listCols: ["platform", "label", "status"], fields: [
    { name: "platform", label: "Platform", type: "select", options: ["linkedin", "github", "email", "instagram", "twitter", "other"] },
    { name: "label", label: "Label", type: "text" },
    { name: "url", label: "URL", type: "text", required: true },
    { name: "status", label: "Status", type: "status" }
  ]},
  contact: { label: "Contact", icon: "mail", singleton: true, fields: [
    { name: "email", label: "Email", type: "text" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "location", label: "Location", type: "text" },
    { name: "form_recipient_email", label: "Contact Form Recipient Email", type: "text" },
    { name: "status", label: "Status", type: "status" }
  ]}
};

// Dashboard nav order (Media handled separately by media.js)
window.NAV_ORDER = [
  "hero", "about", "journey", "camp_days", "education", "experience",
  "projects", "gallery", "skills", "certificates", "achievements", "impact_stats",
  "blog", "social_links", "contact"
];
