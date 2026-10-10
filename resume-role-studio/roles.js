/** Best-fit suites: keywords, section order, and emphasis for a target role. */

export const SECTION_LABELS = {
  summary: "Professional Summary",
  skills: "Core Skills",
  experience: "Professional Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
  awards: "Awards",
};

const ORDER = ["summary", "skills", "experience", "projects", "education", "certifications", "awards"];
const EXPERIENCE_FIRST = ["summary", "experience", "skills", "projects", "education", "certifications", "awards"];

function role(entry) {
  return {
    sectionOrder: ORDER,
    verbs: ["Led", "Built", "Improved", "Delivered", "Launched", "Designed"],
    ...entry,
  };
}

export const ROLES = [
  role({
    id: "software-engineer",
    title: "Software Engineer",
    family: "Engineering",
    aliases: ["software developer", "programmer", "swe"],
    emphasis: "Lead with languages, systems, and shipped results. Name the stack in the skills list and again inside bullets.",
    verbs: ["Built", "Shipped", "Designed", "Refactored", "Automated", "Debugged"],
    must: [
      { label: "Programming language", terms: ["JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Golang", "Ruby"] },
      { label: "Version control", terms: ["Git", "GitHub", "GitLab"] },
      { label: "APIs", terms: ["REST", "GraphQL", "API"] },
      { label: "Testing", terms: ["unit testing", "integration testing", "testing", "Jest", "JUnit", "pytest"] },
      { label: "Data store", terms: ["SQL", "PostgreSQL", "MySQL", "MongoDB"] },
    ],
    nice: [
      { label: "Cloud", terms: ["AWS", "Azure", "GCP"] },
      { label: "CI/CD", terms: ["CI/CD", "GitHub Actions", "Jenkins"] },
      { label: "Containers", terms: ["Docker", "Kubernetes"] },
      { label: "System design", terms: ["system design", "distributed systems", "microservices"] },
    ],
  }),
  role({
    id: "frontend-engineer",
    title: "Frontend Engineer",
    family: "Engineering",
    aliases: ["front-end engineer", "front end developer", "ui engineer"],
    emphasis: "Show interface craft: framework, accessibility, and a user-facing result in the same bullet.",
    verbs: ["Built", "Shipped", "Designed", "Improved", "Implemented", "Simplified"],
    must: [
      { label: "HTML and CSS", terms: ["HTML", "CSS", "Sass"] },
      { label: "JavaScript", terms: ["JavaScript", "TypeScript"] },
      { label: "UI framework", terms: ["React", "Angular", "Vue", "Next.js"] },
      { label: "Responsive or accessible UI", terms: ["accessibility", "WCAG", "responsive", "cross-browser"] },
      { label: "Version control", terms: ["Git", "GitHub", "GitLab"] },
    ],
    nice: [
      { label: "Testing", terms: ["Jest", "Testing Library", "Cypress", "unit testing"] },
      { label: "Performance", terms: ["performance", "Core Web Vitals", "Lighthouse"] },
      { label: "Design systems", terms: ["design system", "component library", "Storybook"] },
    ],
  }),
  role({
    id: "backend-engineer",
    title: "Backend Engineer",
    family: "Engineering",
    aliases: ["back-end engineer", "server engineer", "api engineer"],
    emphasis: "Emphasize services, data, and reliability. Pair each API or job with what improved for users or operators.",
    verbs: ["Built", "Designed", "Scaled", "Automated", "Reduced", "Integrated"],
    must: [
      { label: "Server language", terms: ["Java", "Python", "C#", "Golang", "Node.js", "Ruby", "Kotlin"] },
      { label: "APIs", terms: ["REST", "GraphQL", "gRPC", "API"] },
      { label: "Database", terms: ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis"] },
      { label: "Testing", terms: ["unit testing", "integration testing", "testing", "JUnit", "pytest"] },
      { label: "Version control", terms: ["Git", "GitHub", "GitLab"] },
    ],
    nice: [
      { label: "Cloud", terms: ["AWS", "Azure", "GCP"] },
      { label: "Containers", terms: ["Docker", "Kubernetes"] },
      { label: "Messaging", terms: ["Kafka", "RabbitMQ", "SQS", "queues"] },
      { label: "Observability", terms: ["monitoring", "logging", "tracing", "Datadog"] },
    ],
  }),
  role({
    id: "fullstack-engineer",
    title: "Full Stack Engineer",
    family: "Engineering",
    aliases: ["full-stack engineer", "fullstack developer", "full stack developer"],
    emphasis: "Prove both sides: a user interface and the service or data behind it.",
    verbs: ["Built", "Shipped", "Designed", "Integrated", "Launched", "Improved"],
    must: [
      { label: "Frontend", terms: ["React", "Angular", "Vue", "HTML", "CSS", "JavaScript", "TypeScript"] },
      { label: "Backend", terms: ["Node.js", "Java", "Python", "Django", "Spring", "API", "REST"] },
      { label: "Database", terms: ["SQL", "PostgreSQL", "MySQL", "MongoDB"] },
      { label: "Version control", terms: ["Git", "GitHub", "GitLab"] },
    ],
    nice: [
      { label: "Testing", terms: ["Jest", "pytest", "unit testing", "Cypress"] },
      { label: "Cloud or containers", terms: ["AWS", "Docker", "Kubernetes", "CI/CD"] },
      { label: "Auth", terms: ["authentication", "OAuth", "JWT"] },
    ],
  }),
  role({
    id: "devops-engineer",
    title: "DevOps Engineer",
    family: "Engineering",
    aliases: ["sre", "site reliability engineer", "platform engineer", "infrastructure engineer"],
    emphasis: "Lead with automation, environments, and operational outcomes such as deploy time or incident load.",
    verbs: ["Automated", "Reduced", "Deployed", "Standardized", "Migrated", "Monitored"],
    must: [
      { label: "CI/CD", terms: ["CI/CD", "GitHub Actions", "Jenkins", "GitLab CI"] },
      { label: "Cloud", terms: ["AWS", "Azure", "GCP"] },
      { label: "Containers", terms: ["Docker", "Kubernetes"] },
      { label: "Linux", terms: ["Linux", "Bash", "shell scripting"] },
      { label: "Infrastructure as code", terms: ["Terraform", "CloudFormation", "Ansible", "infrastructure as code"] },
    ],
    nice: [
      { label: "Observability", terms: ["Prometheus", "Grafana", "Datadog", "monitoring"] },
      { label: "Scripting", terms: ["Python", "Bash"] },
      { label: "Reliability", terms: ["SRE", "incident response", "on-call", "SLO"] },
    ],
  }),
  role({
    id: "qa-engineer",
    title: "QA Engineer",
    family: "Engineering",
    aliases: ["quality assurance engineer", "test engineer", "sdet", "qa analyst"],
    emphasis: "Show how you find risk early: test design, automation, and bugs prevented or caught.",
    verbs: ["Tested", "Automated", "Identified", "Reduced", "Documented", "Validated"],
    must: [
      { label: "Test design", terms: ["test cases", "test plan", "QA", "quality assurance"] },
      { label: "Defect tracking", terms: ["Jira", "bug", "defect"] },
      { label: "Automation", terms: ["Selenium", "Cypress", "Playwright", "test automation"] },
      { label: "API or regression coverage", terms: ["API testing", "regression", "Postman"] },
    ],
    nice: [
      { label: "Programming", terms: ["Python", "Java", "JavaScript"] },
      { label: "CI", terms: ["CI/CD", "GitHub Actions", "Jenkins"] },
      { label: "Agile", terms: ["Agile", "Scrum"] },
    ],
  }),
  role({
    id: "data-analyst",
    title: "Data Analyst",
    family: "Data",
    aliases: ["business data analyst", "analytics analyst", "bi analyst"],
    emphasis: "Put tools in a simple skills line, then use bullets for the decision each analysis supported.",
    verbs: ["Analyzed", "Built", "Reported", "Modeled", "Identified", "Automated"],
    must: [
      { label: "Spreadsheets", terms: ["Excel", "Google Sheets"] },
      { label: "SQL", terms: ["SQL"] },
      { label: "Dashboards", terms: ["Tableau", "Power BI", "Looker", "dashboard"] },
      { label: "Analysis", terms: ["data analysis", "analytics", "analysis", "analyzing", "analysing"] },
      { label: "Reporting", terms: ["reporting", "reports", "KPI", "stakeholders"] },
    ],
    nice: [
      { label: "Python", terms: ["Python", "pandas"] },
      { label: "Statistics", terms: ["statistics", "A/B testing", "experimentation"] },
      { label: "Data prep", terms: ["ETL", "data cleaning", "data quality"] },
      { label: "Forecasting", terms: ["forecasting", "forecast"] },
    ],
  }),
  role({
    id: "data-scientist",
    title: "Data Scientist",
    family: "Data",
    aliases: ["applied scientist", "decision scientist"],
    emphasis: "Connect a method to a measured outcome. Name the model or experiment and what changed.",
    verbs: ["Modeled", "Predicted", "Evaluated", "Designed", "Analyzed", "Deployed"],
    must: [
      { label: "Python or R", terms: ["Python", "R", "pandas"] },
      { label: "Statistics", terms: ["statistics", "hypothesis testing", "experimentation", "A/B testing"] },
      { label: "Machine learning", terms: ["machine learning", "scikit-learn", "regression", "classification"] },
      { label: "SQL", terms: ["SQL"] },
    ],
    nice: [
      { label: "Visualization", terms: ["Tableau", "matplotlib", "visualization"] },
      { label: "Notebooks", terms: ["Jupyter", "notebook"] },
      { label: "Feature work", terms: ["feature engineering", "model evaluation"] },
    ],
  }),
  role({
    id: "data-engineer",
    title: "Data Engineer",
    family: "Data",
    aliases: ["analytics engineer", "etl developer"],
    emphasis: "Show pipelines, warehouses, and the reliability or freshness of the data other people use.",
    verbs: ["Built", "Automated", "Modeled", "Migrated", "Orchestrated", "Improved"],
    must: [
      { label: "SQL", terms: ["SQL"] },
      { label: "Python or Spark", terms: ["Python", "Spark", "PySpark"] },
      { label: "Pipelines", terms: ["ETL", "ELT", "pipeline", "data pipeline"] },
      { label: "Warehouse", terms: ["Snowflake", "BigQuery", "Redshift", "data warehouse"] },
    ],
    nice: [
      { label: "Orchestration", terms: ["Airflow", "dbt", "Dagster"] },
      { label: "Cloud", terms: ["AWS", "Azure", "GCP"] },
      { label: "Modeling", terms: ["dimensional model", "star schema", "data modeling"] },
    ],
  }),
  role({
    id: "ml-engineer",
    title: "Machine Learning Engineer",
    family: "Data",
    aliases: ["ml engineer", "mle", "ai engineer"],
    emphasis: "Balance model quality with how the model is shipped, monitored, and kept reliable.",
    verbs: ["Trained", "Deployed", "Evaluated", "Automated", "Built", "Monitored"],
    must: [
      { label: "Python", terms: ["Python"] },
      { label: "Machine learning", terms: ["machine learning", "deep learning", "PyTorch", "TensorFlow", "scikit-learn"] },
      { label: "Model delivery", terms: ["MLOps", "model deployment", "Docker", "inference"] },
      { label: "Data access", terms: ["SQL", "Spark", "feature store"] },
    ],
    nice: [
      { label: "Cloud", terms: ["AWS", "SageMaker", "GCP", "Azure"] },
      { label: "Experiment tracking", terms: ["MLflow", "experiment tracking"] },
      { label: "APIs", terms: ["API", "FastAPI", "REST"] },
    ],
  }),
  role({
    id: "product-manager",
    title: "Product Manager",
    family: "Product",
    aliases: ["product owner", "technical product manager", "tpm"],
    emphasis: "Lead with outcomes, users, and decisions. Tools are secondary to shipped product results.",
    sectionOrder: EXPERIENCE_FIRST,
    verbs: ["Launched", "Defined", "Prioritized", "Shipped", "Partnered", "Measured"],
    must: [
      { label: "Product direction", terms: ["roadmap", "product strategy", "prioritization"] },
      { label: "Stakeholders", terms: ["stakeholders", "cross-functional"] },
      { label: "Outcomes", terms: ["KPI", "OKR", "product metrics", "adoption"] },
      { label: "Delivery", terms: ["Agile", "Scrum", "backlog", "sprint"] },
    ],
    nice: [
      { label: "Discovery", terms: ["user research", "discovery", "customer interviews"] },
      { label: "Experimentation", terms: ["A/B testing", "experimentation"] },
      { label: "Delivery tools", terms: ["Jira", "Confluence"] },
      { label: "Data", terms: ["SQL", "analytics"] },
    ],
  }),
  role({
    id: "project-manager",
    title: "Project Manager",
    family: "Product",
    aliases: ["program manager", "delivery manager", "pmp"],
    emphasis: "Make scope, timeline, and delivery visible. Mention the plan, the people, and what landed on time.",
    sectionOrder: EXPERIENCE_FIRST,
    verbs: ["Delivered", "Coordinated", "Planned", "Mitigated", "Facilitated", "Tracked"],
    must: [
      { label: "Planning", terms: ["project plan", "project planning", "scope management"] },
      { label: "Schedule", terms: ["timeline", "milestone", "project schedule"] },
      { label: "Stakeholders", terms: ["stakeholders", "status report", "steering committee"] },
      { label: "Delivery method", terms: ["Agile", "Scrum", "Waterfall", "PMP"] },
    ],
    nice: [
      { label: "Risk and budget", terms: ["risk", "budget", "RAID"] },
      { label: "Tools", terms: ["Jira", "MS Project", "Smartsheet", "Confluence"] },
      { label: "Change control", terms: ["change management", "dependencies"] },
    ],
  }),
  role({
    id: "business-analyst",
    title: "Business Analyst",
    family: "Product",
    aliases: ["ba", "systems analyst", "business systems analyst"],
    emphasis: "Show the path from a business question to a requirement, a process change, or a measured result.",
    verbs: ["Gathered", "Documented", "Analyzed", "Facilitated", "Defined", "Improved"],
    must: [
      { label: "Requirements", terms: ["requirements", "user stories", "BRD", "use cases"] },
      { label: "Stakeholders", terms: ["stakeholders", "workshops", "elicitation"] },
      { label: "Process", terms: ["process improvement", "process mapping", "workflow", "BPMN"] },
      { label: "Analysis tools", terms: ["SQL", "Excel", "Visio"] },
    ],
    nice: [
      { label: "Agile", terms: ["Agile", "Scrum", "Jira"] },
      { label: "Reporting", terms: ["dashboard", "KPI", "reporting"] },
      { label: "UAT", terms: ["UAT", "acceptance criteria"] },
    ],
  }),
  role({
    id: "ux-designer",
    title: "UX Designer",
    family: "Design",
    aliases: ["product designer", "ui ux designer", "interaction designer"],
    emphasis: "Pair research with the design artifact and what changed for users after it shipped.",
    verbs: ["Designed", "Researched", "Prototyped", "Tested", "Simplified", "Partnered"],
    must: [
      { label: "Research", terms: ["user research", "usability", "interviews"] },
      { label: "Design artifacts", terms: ["Figma", "wireframes", "prototype", "prototyping"] },
      { label: "Interface design", terms: ["UI", "visual design", "interaction design"] },
      { label: "Accessibility", terms: ["accessibility", "WCAG", "inclusive design"] },
    ],
    nice: [
      { label: "Design systems", terms: ["design system", "component library"] },
      { label: "Testing", terms: ["usability testing", "A/B testing"] },
      { label: "Handoff", terms: ["design QA", "developer handoff", "specs"] },
    ],
  }),
  role({
    id: "marketing-manager",
    title: "Marketing Manager",
    family: "Business",
    aliases: ["growth marketer", "demand generation manager", "digital marketing manager"],
    emphasis: "Campaigns need a channel, a tool, and a result. Put metrics on pipeline, revenue, or engagement.",
    sectionOrder: EXPERIENCE_FIRST,
    verbs: ["Launched", "Grew", "Optimized", "Positioned", "Managed", "Measured"],
    must: [
      { label: "Campaigns", terms: ["campaign", "campaigns", "go-to-market"] },
      { label: "Analytics", terms: ["Google Analytics", "marketing analytics", "analytics"] },
      { label: "Channels", terms: ["email marketing", "SEO", "paid media", "social media", "content marketing"] },
      { label: "Results", terms: ["pipeline", "leads", "ROI", "conversion"] },
    ],
    nice: [
      { label: "Automation", terms: ["HubSpot", "Marketo", "marketing automation"] },
      { label: "Experimentation", terms: ["A/B testing", "experimentation"] },
      { label: "Positioning", terms: ["messaging", "brand", "positioning"] },
    ],
  }),
  role({
    id: "financial-analyst",
    title: "Financial Analyst",
    family: "Business",
    aliases: ["fp&a analyst", "finance analyst", "investment analyst"],
    emphasis: "Lead with models, forecasts, and the business decision the numbers supported.",
    verbs: ["Forecasted", "Modeled", "Analyzed", "Reported", "Reconciled", "Identified"],
    must: [
      { label: "Excel", terms: ["Excel", "financial modeling"] },
      { label: "Forecasting", terms: ["forecasting", "forecast", "budget"] },
      { label: "Reporting", terms: ["variance analysis", "financial reporting", "reporting"] },
      { label: "Statements", terms: ["financial statements", "P&L", "GAAP", "balance sheet"] },
    ],
    nice: [
      { label: "SQL or BI", terms: ["SQL", "Power BI", "Tableau"] },
      { label: "Planning systems", terms: ["Anaplan", "NetSuite", "Hyperion"] },
      { label: "Valuation", terms: ["valuation", "DCF", "ROI"] },
    ],
  }),
  role({
    id: "sales-representative",
    title: "Sales Representative",
    family: "Go-to-market",
    aliases: ["account executive", "sdr", "bdr", "business development representative"],
    emphasis: "Quota, pipeline, and logo or revenue outcomes belong in the first screen of the resume.",
    sectionOrder: EXPERIENCE_FIRST,
    verbs: ["Closed", "Generated", "Negotiated", "Grew", "Prospected", "Retained"],
    must: [
      { label: "Pipeline or quota", terms: ["quota", "pipeline", "quota attainment"] },
      { label: "CRM", terms: ["Salesforce", "HubSpot", "CRM"] },
      { label: "Prospecting", terms: ["prospecting", "outbound", "cold calling", "lead generation"] },
      { label: "Closing", terms: ["closed", "closing", "negotiation", "won"] },
    ],
    nice: [
      { label: "Account management", terms: ["account management", "book of business", "renewals"] },
      { label: "Demo", terms: ["demo", "discovery calls"] },
      { label: "Forecast", terms: ["sales forecast", "MEDDIC", "BANT"] },
    ],
  }),
  role({
    id: "customer-success",
    title: "Customer Success Manager",
    family: "Go-to-market",
    aliases: ["csm", "client success manager", "customer success"],
    emphasis: "Show retention, adoption, and the customers you grew. Name the motion: onboarding, QBR, or renewal.",
    sectionOrder: EXPERIENCE_FIRST,
    verbs: ["Retained", "Onboarded", "Expanded", "Advised", "Reduced", "Renewed"],
    must: [
      { label: "Retention", terms: ["retention", "churn", "renewal", "NRR"] },
      { label: "Adoption", terms: ["onboarding", "adoption", "enablement"] },
      { label: "Customer leadership", terms: ["QBR", "executive sponsor", "customer success", "book of business"] },
      { label: "CRM or success platform", terms: ["Salesforce", "Gainsight", "CRM"] },
    ],
    nice: [
      { label: "Expansion", terms: ["upsell", "cross-sell", "expansion"] },
      { label: "Health metrics", terms: ["health score", "NPS", "CSAT"] },
      { label: "Product feedback", terms: ["voice of customer", "product feedback"] },
    ],
  }),
  role({
    id: "hr-generalist",
    title: "HR Generalist",
    family: "People",
    aliases: ["human resources generalist", "people operations generalist", "hr coordinator"],
    emphasis: "Cover the employee lifecycle you actually ran: hiring, onboarding, relations, and the system of record.",
    sectionOrder: EXPERIENCE_FIRST,
    verbs: ["Hired", "Onboarded", "Advised", "Coordinated", "Improved", "Supported"],
    must: [
      { label: "Recruiting", terms: ["recruiting", "recruitment", "talent acquisition", "interviews"] },
      { label: "Employee relations", terms: ["employee relations", "ER", "coaching"] },
      { label: "Onboarding", terms: ["onboarding", "orientation"] },
      { label: "HR systems or policy", terms: ["Workday", "BambooHR", "HRIS", "policy", "compliance"] },
    ],
    nice: [
      { label: "Performance", terms: ["performance management", "reviews"] },
      { label: "Benefits", terms: ["benefits", "payroll"] },
      { label: "Training", terms: ["training", "L&D"] },
    ],
  }),
];

/** Extra phrases a pasted job post can promote into the suite. */
export const EXTRA_TERMS = [
  "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Golang", "Ruby", "Kotlin", "PHP",
  "React", "Angular", "Vue", "Next.js", "Node.js", "Django", "Flask", "Spring", "FastAPI",
  "HTML", "CSS", "Sass", "Tailwind", "REST", "GraphQL", "gRPC", "API",
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Snowflake", "BigQuery", "Redshift",
  "Excel", "Google Sheets", "Tableau", "Power BI", "Looker", "dbt", "Airflow", "Spark",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Ansible", "CI/CD",
  "Git", "GitHub", "GitLab", "Jenkins", "GitHub Actions", "Linux",
  "machine learning", "deep learning", "PyTorch", "TensorFlow", "scikit-learn", "MLOps",
  "statistics", "A/B testing", "experimentation", "ETL", "data warehouse", "data modeling",
  "Figma", "wireframes", "prototyping", "user research", "usability testing", "accessibility", "WCAG",
  "roadmap", "OKR", "KPI", "Agile", "Scrum", "Jira", "Confluence", "stakeholder management",
  "Salesforce", "HubSpot", "Gainsight", "CRM", "quota", "pipeline", "renewals",
  "Google Analytics", "SEO", "SEM", "email marketing", "content marketing",
  "financial modeling", "forecasting", "variance analysis", "GAAP", "P&L", "budgeting",
  "Workday", "BambooHR", "HRIS", "recruiting", "employee relations", "onboarding",
  "Selenium", "Cypress", "Playwright", "test automation",
  "project management", "risk management", "change management", "requirements gathering",
  "customer success", "product management", "business analysis",
];

const SOFT_TERMS = new Set([
  "communication",
  "teamwork",
  "leadership",
  "problem solving",
  "collaboration",
  "time management",
]);

const AMBIGUOUS_TOOLS = new Set(["excel", "react", "spark", "rest", "express", "java", "go"]);

function escapeTerm(term) {
  return String(term).trim().split(/\s+/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
}

function bounded(term) {
  const body = escapeTerm(term);
  return new RegExp(`(?<![A-Za-z0-9+#.&/])${body}(?![A-Za-z0-9+#.&/])`);
}

function isMiddleInitial(text, term) {
  if (!/^[A-Za-z]$/.test(term)) return false;
  return new RegExp(`\\b[A-Z][A-Za-z.'-]+\\s+${term}\\.?\\s+[A-Z][A-Za-z.'-]+`).test(text);
}

function isAmpersandPair(text, term) {
  if (!/^[A-Za-z]{1,2}$/.test(term)) return false;
  return new RegExp(`(?:^|[^A-Za-z0-9])${term}\\s*&\\s*[A-Za-z]`).test(text);
}

function skillListHas(text, term) {
  return String(text).split(/[\n,;|]/).some((item) => item.trim().toLowerCase() === term.toLowerCase());
}

export function textHas(text, term) {
  if (!text || !term) return false;
  const raw = String(term).trim();
  if (!raw) return false;
  if (/^[A-Za-z]{1,2}$/.test(raw)) {
    if (isMiddleInitial(text, raw) || isAmpersandPair(text, raw)) return false;
    const cased = raw.toUpperCase() === raw ? raw : raw.toUpperCase();
    return bounded(raw).test(text) || (cased !== raw && bounded(cased).test(text));
  }
  if (AMBIGUOUS_TOOLS.has(raw.toLowerCase())) {
    if (bounded(raw).test(text)) return true;
    const canonical = raw.slice(0, 1).toUpperCase() + raw.slice(1);
    if (canonical !== raw && bounded(canonical).test(text)) return true;
    return skillListHas(text, raw);
  }
  return new RegExp(`(?<![A-Za-z0-9+#.&/])${escapeTerm(raw)}(?![A-Za-z0-9+#.&/])`, "i").test(text);
}

export function groupMatched(text, group) {
  return group.terms.find((term) => textHas(text, term)) || null;
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pick a suite from a typed title.
 * Exact or contained titles win. Otherwise a unique overlap of at least two tokens wins.
 * A tie returns null so a custom title is not forced onto the wrong suite.
 */
export function matchRole(title) {
  const normalized = normalizeTitle(title);
  if (!normalized) return null;

  let bestPhrase = null;
  let bestLength = 0;
  for (const candidate of ROLES) {
    const phrases = [candidate.title, ...(candidate.aliases || [])];
    for (const phrase of phrases) {
      if (textHas(normalized, normalizeTitle(phrase)) && phrase.length > bestLength) {
        bestPhrase = candidate;
        bestLength = phrase.length;
      }
    }
  }
  if (bestPhrase) return { role: bestPhrase, reason: "title" };

  const ignore = new Set(["and", "the", "of", "for", "senior", "junior", "lead", "principal", "staff", "associate", "intern", "entry", "level", "i", "ii", "iii"]);
  const tokens = normalized.split(" ").filter((token) => token.length > 2 && !ignore.has(token));
  let winner = null;
  let runner = 0;
  for (const candidate of ROLES) {
    const hay = normalizeTitle([candidate.title, ...(candidate.aliases || [])].join(" "));
    const score = tokens.reduce((total, token) => total + (textHas(hay, token) ? 1 : 0), 0);
    if (score > (winner?.score || 0)) {
      runner = winner?.score || 0;
      winner = { role: candidate, score };
    } else if (winner && score === winner.score) {
      runner = score;
    }
  }
  if (!winner || winner.score < 2 || winner.score === runner) return null;
  return { role: winner.role, reason: "overlap" };
}

export function extractPostTerms(jobDescription, existingTerms) {
  const jd = String(jobDescription || "").slice(0, 15000);
  if (jd.trim().length < 40) return [];
  const known = new Set(existingTerms.map((term) => term.toLowerCase()));
  const dictionary = [...new Set([...EXTRA_TERMS, ...existingTerms])].sort((a, b) => b.length - a.length);
  const found = [];
  for (const term of dictionary) {
    if (known.has(term.toLowerCase())) continue;
    if (!textHas(jd, term)) continue;
    if (SOFT_TERMS.has(term.toLowerCase())) continue;
    const index = jd.toLowerCase().indexOf(term.toLowerCase());
    found.push({ term, index });
  }
  found.sort((a, b) => a.index - b.index || b.term.length - a.term.length);
  const unique = [];
  for (const hit of found) {
    if (unique.some((item) => textHas(item, hit.term) || textHas(hit.term, item))) continue;
    unique.push(hit.term);
    if (unique.length === 8) break;
  }
  return unique;
}

export function getRole(roleId) {
  return ROLES.find((item) => item.id === roleId) || null;
}
