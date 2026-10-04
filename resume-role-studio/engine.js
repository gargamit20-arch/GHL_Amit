import {
  SECTION_LABELS,
  extractPostTerms,
  getRole,
  groupMatched,
  matchRole,
  textHas,
} from "./roles.js";

const SECTION_ALIASES = [
  { id: "summary", titles: ["professional summary", "summary", "profile", "professional profile", "about", "about me", "objective", "career objective", "professional objective"] },
  { id: "skills", titles: ["skills", "technical skills", "core skills", "core competencies", "competencies", "technologies", "tools", "technical tools", "skills and tools"] },
  { id: "experience", titles: ["professional experience", "work experience", "experience", "employment", "employment history", "work history", "career history", "relevant experience"] },
  { id: "education", titles: ["education", "academic background", "academics", "education and training"] },
  { id: "projects", titles: ["projects", "selected projects", "personal projects", "key projects"] },
  { id: "certifications", titles: ["certifications", "certificates", "licenses", "licences", "certifications and licenses"] },
  { id: "awards", titles: ["awards", "honors", "honours", "achievements", "awards and honors"] },
];

const STANDARD_HEADINGS = {
  summary: ["professional summary", "summary", "profile"],
  skills: ["skills", "core skills", "technical skills", "core competencies"],
  experience: ["professional experience", "work experience", "experience"],
  education: ["education"],
  projects: ["projects"],
  certifications: ["certifications", "certificates"],
  awards: ["awards"],
};

const GERUNDS = {
  leading: "led",
  managing: "managed",
  developing: "developed",
  building: "built",
  creating: "created",
  designing: "designed",
  implementing: "implemented",
  analyzing: "analyzed",
  analysing: "analysed",
  coordinating: "coordinated",
  supporting: "supported",
  maintaining: "maintained",
  improving: "improved",
  driving: "drove",
  delivering: "delivered",
  writing: "wrote",
  testing: "tested",
  collaborating: "collaborated",
  helping: "helped",
  ensuring: "ensured",
  overseeing: "oversaw",
  handling: "handled",
  assisting: "assisted",
  conducting: "conducted",
  performing: "performed",
  providing: "provided",
  monitoring: "monitored",
  optimizing: "optimized",
  optimising: "optimised",
  automating: "automated",
  migrating: "migrated",
  deploying: "deployed",
  integrating: "integrated",
  researching: "researched",
  presenting: "presented",
  training: "trained",
  mentoring: "mentored",
  recruiting: "recruited",
  negotiating: "negotiated",
  forecasting: "forecasted",
  reporting: "reported",
  tracking: "tracked",
  reducing: "reduced",
  increasing: "increased",
  launching: "launched",
  planning: "planned",
  executing: "executed",
  gathering: "gathered",
  defining: "defined",
  documenting: "documented",
  cleaning: "cleaned",
  identifying: "identified",
  streamlining: "streamlined",
  owning: "owned",
  partnering: "partnered",
  facilitating: "facilitated",
  reviewing: "reviewed",
  resolving: "resolved",
  configuring: "configured",
  debugging: "debugged",
  refactoring: "refactored",
  shipping: "shipped",
  measuring: "measured",
  prioritizing: "prioritized",
  prototyping: "prototyped",
  interviewing: "interviewed",
  hiring: "hired",
  onboarding: "onboarded",
  advising: "advised",
  closing: "closed",
  generating: "generated",
  growing: "grew",
  retaining: "retained",
  expanding: "expanded",
  modeling: "modeled",
  modelling: "modelled",
  predicting: "predicted",
  evaluating: "evaluated",
  orchestrating: "orchestrated",
  reconciling: "reconciled",
  validating: "validated",
};

const ACTION_VERBS = new Set([
  ...Object.values(GERUNDS),
  "led", "built", "made", "ran", "owned", "drove", "wrote", "spoke", "sold", "won",
  "cut", "saved", "raised", "lowered", "taught", "hired", "set", "put", "kept",
  "launched", "shipped", "designed", "developed", "created", "improved", "automated",
  "analyzed", "analysed", "managed", "delivered", "implemented", "coordinated",
  "supported", "maintained", "reduced", "increased", "tested", "documented",
  "presented", "trained", "mentored", "negotiated", "forecasted", "reported",
  "migrated", "deployed", "integrated", "researched", "monitored", "configured",
  "debugged", "refactored", "partnered", "facilitated", "defined", "gathered",
  "identified", "streamlined", "resolved", "reviewed", "measured", "prioritized",
  "prototyped", "advised", "closed", "generated", "grew", "retained", "expanded",
  "modeled", "modelled", "predicted", "evaluated", "orchestrated", "reconciled",
  "validated", "established", "introduced", "produced", "directed", "oversaw",
  "spearheaded", "modernized", "consolidated", "standardized", "simplified",
]);

const WEAK_OPENERS = [
  /^worked on\b/i,
  /^responsible for\b/i,
  /^duties included\b/i,
  /^tasked with\b/i,
  /^helped with\b/i,
  /^assisted with\b/i,
  /^assisted in\b/i,
  /^involved in\b/i,
  /^various tasks\b/i,
  /^participated in\b/i,
];

function normalizeInput(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[•●▪◦►‣]/g, "- ")
    .replace(/\t/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanInline(text) {
  return String(text || "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .trim();
}

function headerId(line) {
  const name = line
    .trim()
    .replace(/:$/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (!name || name.length > 48) return null;
  const found = SECTION_ALIASES.find((section) => section.titles.includes(name));
  return found ? found.id : null;
}

function isStandardHeading(id, line) {
  const name = line.trim().replace(/:$/, "").replace(/\s+/g, " ").toLowerCase();
  return (STANDARD_HEADINGS[id] || []).includes(name);
}

function parseSections(text) {
  const lines = text.split("\n");
  const preamble = [];
  const sections = [];
  let current = null;

  for (const line of lines) {
    const id = headerId(line);
    if (id) {
      current = { id, rawHeading: line.trim(), lines: [], standard: isStandardHeading(id, line) };
      sections.push(current);
      continue;
    }
    if (!current) preamble.push(line);
    else current.lines.push(line);
  }

  return {
    preamble: preamble.join("\n").trim(),
    sections,
  };
}

function findEmail(text) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
}

function findPhone(text) {
  const match = text.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]\d{4}/);
  return match?.[0] || "";
}

function findLinks(text) {
  const links = [];
  const linkedin = text.match(/linkedin\.com\/in\/[A-Za-z0-9_-]+/i)?.[0];
  const github = text.match(/github\.com\/[A-Za-z0-9_-]+/i)?.[0];
  if (linkedin) links.push(linkedin.replace(/^https?:\/\//i, ""));
  if (github) links.push(github.replace(/^https?:\/\//i, ""));
  return links;
}

function findLocation(lines) {
  for (const line of lines) {
    const match = line.match(/\b[A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+)*,\s*[A-Z]{2}\b/);
    if (match && match[0].length < 40) return match[0].trim();
  }
  return "";
}

function tidyName(name) {
  const trimmed = name.trim();
  if (trimmed === trimmed.toUpperCase()) {
    return trimmed
      .toLowerCase()
      .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
  }
  return trimmed;
}

function detectName(preamble) {
  const lines = preamble.split("\n").map((line) => line.trim()).filter(Boolean);
  for (const line of lines.slice(0, 4)) {
    if (line.length > 48 || /@|https?:|linkedin|github|\d{3}/i.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 5 && words.every((word) => /^[A-Za-z][A-Za-z.'-]*$/.test(word))) {
      return tidyName(line);
    }
  }
  return "";
}

function estimateYears(experienceText) {
  const now = new Date().getFullYear();
  const rangeRe = /\b((?:19|20)\d{2})\b\s*(?:-|to)\s*(?:[A-Za-z.]+\s+){0,2}((?:19|20)\d{2}|present|current|now)\b/gi;
  let sum = 0;
  let minStart = Infinity;
  let maxEnd = 0;
  let count = 0;
  for (const match of experienceText.matchAll(rangeRe)) {
    const start = Number(match[1]);
    const endWord = match[2].toLowerCase();
    const end = /present|current|now/.test(endWord) ? now : Number(endWord);
    if (end < start || start < 1970 || end > now + 1) continue;
    const span = end - start;
    sum += span === 0 ? 1 : span;
    minStart = Math.min(minStart, start);
    maxEnd = Math.max(maxEnd, end);
    count += 1;
  }
  if (!count) return null;
  const calendar = maxEnd - minStart;
  const years = Math.min(sum, calendar || sum);
  if (years < 1 || years > 50) return null;
  return years;
}

function polishGerunds(sentence) {
  let next = sentence.trim();
  next = next.replace(/^(\w+)/, (word) => (GERUNDS[word.toLowerCase()] ? GERUNDS[word.toLowerCase()] : word));
  next = next.replace(/\band\s+(\w+)\b/gi, (full, word) => {
    const past = GERUNDS[word.toLowerCase()];
    return past ? `and ${past}` : full;
  });
  return next;
}

function rewriteBullet(raw) {
  let text = cleanInline(raw.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, ""));
  const original = text;
  text = text.replace(/^(?:i am|i'm|i)\s+/i, "");
  text = text.replace(/^(?:i was responsible for|i am responsible for|responsible for|duties included|duties include|tasked with|my duties included)\s+/i, "");
  text = text.replace(/^(?:helped with|assisted with|assisted in)\s+/i, "supported ");
  text = polishGerunds(text);
  text = text.replace(/\s+/g, " ").trim();
  if (!text) return { text: original, changed: false, weak: false };
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!/[.!?]$/.test(text)) text += ".";
  const weak = WEAK_OPENERS.some((pattern) => pattern.test(text));
  return { text, changed: text.replace(/\.$/, "") !== original.replace(/\.$/, ""), weak };
}

function isBullet(line) {
  return /^\s*(?:[-*•]|\d+[.)])\s+\S/.test(line);
}

function cleanMetadataLine(line) {
  return cleanInline(line).replace(/\b((?:19|20)\d{2})\s*-\s*((?:19|20)\d{2}|present|current|now)\b/gi, (_, start, end) => {
    const prettyEnd = /present|current|now/i.test(end) ? "Present" : end;
    return `${start} - ${prettyEnd}`;
  });
}

function processBody(sectionId, lines) {
  const bulletChanges = [];
  const output = [];
  let weakLeft = 0;
  let bulletCount = 0;
  let metricCount = 0;

  for (const line of lines) {
    if (!line.trim()) {
      if (output.length && output[output.length - 1] !== "") output.push("");
      continue;
    }
    if ((sectionId === "experience" || sectionId === "projects") && isBullet(line)) {
      const rewritten = rewriteBullet(line);
      bulletCount += 1;
      if (/\d/.test(rewritten.text)) metricCount += 1;
      if (rewritten.weak) weakLeft += 1;
      if (rewritten.changed) bulletChanges.push(rewritten.text);
      output.push(`- ${rewritten.text}`);
      continue;
    }
    output.push(cleanMetadataLine(line));
  }

  while (output[0] === "") output.shift();
  while (output[output.length - 1] === "") output.pop();
  return {
    text: output.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    bulletChanges,
    weakLeft,
    bulletCount,
    metricCount,
  };
}

function splitSkills(text) {
  const chunks = text
    .split(/\n|•|\||,|;|\/(?![a-z])/i)
    .map((part) => cleanInline(part).replace(/^- /, "").replace(/\.$/, ""))
    .filter((part) => part.length >= 2 && part.length <= 40 && part.split(" ").length <= 5);
  const unique = [];
  for (const skill of chunks) {
    const tidy = skill === skill.toLowerCase() && skill.length > 3
      ? skill.charAt(0).toUpperCase() + skill.slice(1)
      : skill;
    if (unique.some((item) => item.toLowerCase() === tidy.toLowerCase())) continue;
    unique.push(tidy);
  }
  return unique.filter((skill, index) => !unique.some((other, otherIndex) => otherIndex !== index && other.length > skill.length && textHas(other, skill)));
}

function orderSkills(skills, suite, sourceText) {
  const pool = skills.length ? skills : inferSkills(sourceText, suite);
  const rank = (skill) => {
    const mustIndex = suite.must.findIndex((group) => group.terms.some((term) => textHas(skill, term) || textHas(term, skill)));
    if (mustIndex >= 0) return mustIndex;
    const niceIndex = suite.nice.findIndex((group) => group.terms.some((term) => textHas(skill, term) || textHas(term, skill)));
    if (niceIndex >= 0) return 100 + niceIndex;
    return 1000;
  };
  return [...pool].sort((a, b) => rank(a) - rank(b));
}

function inferSkills(sourceText, suite) {
  const terms = [];
  for (const group of [...suite.must, ...suite.nice]) {
    for (const term of group.terms) {
      if (textHas(sourceText, term) && !terms.some((item) => item.toLowerCase() === term.toLowerCase())) {
        terms.push(term);
      }
    }
  }
  return terms.slice(0, 16);
}

function formatSkills(skills) {
  const lines = [];
  for (let index = 0; index < skills.length; index += 6) {
    lines.push(skills.slice(index, index + 6).join(", "));
  }
  return lines.join("\n");
}

function joinList(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function buildSummary(roleTitle, years, matchedTerms, evidence) {
  const yearClause = years ? ` with about ${years} years of experience shown in the roles below` : "";
  const skillClause = matchedTerms.length ? `, grounded in ${joinList(matchedTerms.slice(0, 3))}` : "";
  let summary = `${roleTitle} profile${yearClause}${skillClause}.`;
  if (evidence) {
    const sentence = evidence.length > 220 ? `${evidence.slice(0, 217).replace(/\s+\S*$/, "")}.` : evidence;
    if (!summary.toLowerCase().includes(sentence.slice(0, 40).toLowerCase())) {
      summary = `${summary} ${sentence}`;
    }
  }
  return summary;
}

function bestEvidence(experienceText) {
  const bullets = experienceText
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^- /, "").trim());
  if (!bullets.length) return "";
  const ranked = [...bullets].sort((a, b) => (b.match(/\d/g) || []).length - (a.match(/\d/g) || []).length);
  return ranked[0];
}

function resolveSuite(roleId, customTitle, jobDescription) {
  const selected = roleId && roleId !== "custom" ? getRole(roleId) : null;
  const typed = (customTitle || "").trim();
  const matched = !selected && typed ? matchRole(typed) : null;
  const base = selected || matched?.role || null;
  const title = selected?.title || typed || base?.title || "Target role";
  const must = (base?.must || []).map((group) => ({ ...group, terms: [...group.terms], fromPost: false }));
  const nice = (base?.nice || []).map((group) => ({ ...group, terms: [...group.terms], fromPost: false }));
  const existing = [...must, ...nice].flatMap((group) => group.terms);
  const postTerms = extractPostTerms(jobDescription, existing);
  for (const term of postTerms) {
    if (must.some((group) => group.terms.some((item) => item.toLowerCase() === term.toLowerCase()))) continue;
    must.push({ label: term, terms: [term], fromPost: true });
  }
  return {
    title,
    emphasis: base?.emphasis || "Built from the job post you pasted. Themes below are skills the posting names.",
    sectionOrder: base?.sectionOrder || ["summary", "skills", "experience", "projects", "education", "certifications", "awards"],
    verbs: base?.verbs || ["Led", "Built", "Improved", "Delivered", "Managed", "Created"],
    must,
    nice,
    basedOn: base?.title && title.toLowerCase() !== base.title.toLowerCase() ? base.title : "",
    usedPost: postTerms.length > 0,
  };
}

function annotateGroups(text, groups) {
  return groups.map((group) => {
    const matchedTerm = groupMatched(text, group);
    return { ...group, matched: Boolean(matchedTerm), matchedTerm };
  });
}

function countWords(text) {
  return (text.match(/[A-Za-z0-9][A-Za-z0-9+#'./-]*/g) || []).length;
}

function assess(text) {
  const parsed = parseSections(normalizeInput(text));
  const email = findEmail(text);
  const phone = findPhone(text);
  const links = findLinks(text);
  const location = findLocation(text.split("\n"));
  const emoji = (text.match(/\p{Extended_Pictographic}/gu) || []).length;
  const tableLikely = text.split("\n").some((line) => (line.match(/\|/g) || []).length >= 4 && !line.includes("@"));
  const firstPerson = text.split("\n").filter((line) => isBullet(line) && /\b(I|my|me|mine|I'm)\b/.test(line)).length;
  const noise = /\[(?:photo|image|picture|chart|table)\]|profile photo|headshot|^page \d+/im.test(text);

  let bulletCount = 0;
  let strongCount = 0;
  let metricCount = 0;
  let weakCount = 0;
  for (const line of text.split("\n")) {
    if (!isBullet(line)) continue;
    bulletCount += 1;
    const body = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "");
    const first = body.replace(/^(?:I\s+)/i, "").split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") || "";
    if (ACTION_VERBS.has(first)) strongCount += 1;
    if (WEAK_OPENERS.some((pattern) => pattern.test(body))) weakCount += 1;
    if (/\d/.test(body)) metricCount += 1;
  }

  const found = {};
  for (const section of parsed.sections) {
    found[section.id] = section.standard ? "standard" : "alias";
  }

  return {
    email: Boolean(email),
    phone: Boolean(phone),
    link: links.length > 0,
    location: Boolean(location),
    emoji,
    tableLikely,
    firstPerson,
    noise,
    bulletCount,
    strongCount,
    metricCount,
    weakCount,
    wordCount: countWords(text),
    found,
  };
}

function pointsFor(features) {
  let contact = 0;
  if (features.email) contact += 10;
  if (features.phone) contact += 6;
  if (features.location || features.link) contact += 4;

  const headingScore = (id, standardPoints, aliasPoints) => {
    if (features.found[id] === "standard") return standardPoints;
    if (features.found[id] === "alias") return aliasPoints;
    return 0;
  };
  const headings = headingScore("experience", 8, 4) + headingScore("education", 4, 3) + headingScore("skills", 4, 2) + headingScore("summary", 4, 2);

  let parser = 25;
  if (features.emoji) parser -= 8;
  if (features.tableLikely) parser -= 8;
  if (features.noise) parser -= 4;
  parser -= Math.min(8, features.firstPerson * 2);
  parser = Math.max(0, parser);

  let bullets = 6;
  if (features.bulletCount > 0) {
    const strongRatio = features.strongCount / features.bulletCount;
    const metricRatio = features.metricCount / features.bulletCount;
    bullets = Math.round(strongRatio * 12 + metricRatio * 8);
  }

  let length = 5;
  if (features.wordCount >= 250 && features.wordCount <= 800) length = 15;
  else if (features.wordCount >= 150 && features.wordCount <= 1100) length = 10;

  const total = Math.max(0, Math.min(100, contact + headings + parser + bullets + length));
  return {
    total,
    parts: [
      { label: "Contact details", score: contact, max: 20 },
      { label: "Section headings", score: headings, max: 20 },
      { label: "Parser-safe formatting", score: parser, max: 25 },
      { label: "Bullet strength", score: bullets, max: 20 },
      { label: "Length", score: length, max: 15 },
    ],
  };
}

function roleFit(must, nice) {
  if (!must.length && !nice.length) return { score: null, mustMatched: 0, mustTotal: 0, niceMatched: 0, niceTotal: 0 };
  const mustMatched = must.filter((group) => group.matched).length;
  const niceMatched = nice.filter((group) => group.matched).length;
  const mustScore = must.length ? mustMatched / must.length : 0;
  const niceScore = nice.length ? niceMatched / nice.length : mustScore;
  const score = Math.round(100 * (must.length ? 0.75 * mustScore + 0.25 * niceScore : niceScore));
  return { score, mustMatched, mustTotal: must.length, niceMatched, niceTotal: nice.length };
}

function dropNoise(text) {
  const kept = [];
  let photos = 0;
  let pages = 0;
  for (const line of text.split("\n")) {
    if (/^page \d+\b/i.test(line.trim())) {
      pages += 1;
      continue;
    }
    if (/\[(?:photo|image|picture|chart|table)\]|profile photo|headshot/i.test(line)) {
      photos += 1;
      continue;
    }
    kept.push(line);
  }
  return { text: kept.join("\n"), photos, pages };
}

export function optimizeResume({ roleId, customRole, jobDescription, resumeText }) {
  const raw = String(resumeText || "").replace(/\r\n/g, "\n").trim();
  if (raw.replace(/\s/g, "").length < 40) {
    return { error: "Paste a fuller resume. A few lines is not enough to review." };
  }
  if ((!roleId || roleId === "custom") && !(customRole || "").trim()) {
    return { error: "Enter the target role, or pick one from the list." };
  }

  const suite = resolveSuite(roleId, customRole, jobDescription);
  const before = pointsFor(assess(raw));
  const { text: denoised, photos, pages } = dropNoise(raw);
  const normalized = normalizeInput(denoised).replace(/\p{Extended_Pictographic}/gu, "");
  const parsed = parseSections(normalized);
  const sourceText = normalized;

  const name = detectName(parsed.preamble);
  const email = findEmail(sourceText);
  const phone = findPhone(sourceText);
  const links = findLinks(sourceText);
  const location = findLocation(sourceText.split("\n"));
  const contact = [location, email, phone, ...links].filter(Boolean).join(" | ");

  const processed = new Map();
  let bulletRewrites = 0;
  let weakLeft = 0;
  let bulletCount = 0;
  let metricCount = 0;
  const headingRenames = [];

  for (const section of parsed.sections) {
    const body = processBody(section.id, section.lines);
    processed.set(section.id, body);
    bulletRewrites += body.bulletChanges.length;
    weakLeft += body.weakLeft;
    bulletCount += body.bulletCount;
    metricCount += body.metricCount;
    const label = SECTION_LABELS[section.id];
    if (label && section.rawHeading.replace(/:$/, "").trim().toLowerCase() !== label.toLowerCase()) {
      headingRenames.push(section.rawHeading.replace(/:$/, ""));
    }
  }

  const experienceBody = processed.get("experience")?.text || "";
  const years = estimateYears(experienceBody);
  const skillsSource = processed.get("skills")?.text || "";
  const listedSkills = splitSkills(skillsSource);
  const skills = orderSkills(listedSkills, suite, sourceText);
  const skillsCreated = !processed.has("skills") && skills.length > 0;

  const resumeForMatch = [sourceText, skills.join(" ")].join("\n");
  const must = annotateGroups(resumeForMatch, suite.must);
  const nice = annotateGroups(resumeForMatch, suite.nice);
  const matchedTerms = must.filter((group) => group.matched).map((group) => {
    const skill = skills.find((item) => group.terms.some((term) => textHas(item, term) || textHas(term, item)));
    return skill || group.matchedTerm;
  });
  const evidence = bestEvidence(experienceBody);
  const hadSummary = processed.has("summary");
  const summary = buildSummary(suite.title, years, matchedTerms, evidence);

  const blocks = [];
  if (name) blocks.push(name);
  if (contact) blocks.push(contact);
  blocks.push(suite.title.slice(0, 80));
  blocks.push("");

  const emitted = new Set();
  const pushSection = (id, body) => {
    if (!body) return;
    emitted.add(id);
    blocks.push(SECTION_LABELS[id].toUpperCase());
    blocks.push(body);
    blocks.push("");
  };

  for (const id of suite.sectionOrder) {
    if (id === "summary") {
      pushSection("summary", summary);
      continue;
    }
    if (id === "skills") {
      pushSection("skills", formatSkills(skills));
      continue;
    }
    pushSection(id, processed.get(id)?.text || "");
  }

  for (const section of parsed.sections) {
    if (emitted.has(section.id) || SECTION_LABELS[section.id]) continue;
    const body = processed.get(section.id)?.text || "";
    if (!body) continue;
    blocks.push(section.rawHeading.replace(/:$/, "").toUpperCase());
    blocks.push(body);
    blocks.push("");
  }

  const optimizedText = blocks.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  const after = pointsFor(assess(optimizedText));
  const fit = roleFit(must, nice);

  const changes = [];
  if (!hadSummary) changes.push("Added a professional summary from facts already in the resume.");
  else changes.push("Replaced the opening profile with a summary aimed at this role, using only facts already in the resume.");
  changes.push(`Added “${suite.title.slice(0, 80)}” as the target-role headline under your name.`);
  if (headingRenames.length) {
    changes.push(`Renamed ${headingRenames.length} section heading${headingRenames.length === 1 ? "" : "s"} to standard labels parsers expect.`);
  }
  if (bulletRewrites) {
    changes.push(`Rewrote ${bulletRewrites} bullet${bulletRewrites === 1 ? "" : "s"} that started with “I”, “Responsible for”, or a gerund.`);
  }
  if (skills.length) {
    changes.push(skillsCreated
      ? "Created a skills section from tools and themes already mentioned in the resume, with role matches first."
      : "Reordered skills so themes in this suite appear first.");
  }
  const removedBits = [];
  if (/\p{Extended_Pictographic}/u.test(raw)) removedBits.push("emoji");
  if (photos) removedBits.push("photo markers");
  if (pages) removedBits.push("page numbers");
  if (removedBits.length) {
    changes.push(`Removed ${removedBits.join(" and ")} that parsers skip or misread.`);
  }
  if (suite.must.length || suite.nice.length) {
    changes.push("Set the section order this suite uses for the target role.");
  }

  const issues = [];
  if (!email) {
    issues.push({ tone: "blocker", title: "No email address found", detail: "Put a plain email in the contact line. Submitting without one often drops the application." });
  }
  if (!phone) {
    issues.push({ tone: "needs-you", title: "No phone number found", detail: "Add a phone number if you want recruiters to call. It was left blank because none was in the resume." });
  }
  if (weakLeft) {
    issues.push({ tone: "needs-you", title: "Some bullets still open weakly", detail: "Phrases like “Worked on” stayed in place so the meaning would not be upgraded for you. Start those bullets with what you produced and, if you can, a result." });
  }
  if (bulletCount >= 3 && metricCount / bulletCount < 0.4) {
    issues.push({ tone: "needs-you", title: "Few bullets show a number", detail: "Add a scale you can stand behind: volume, time, money, frequency, or team size. Numbers were not invented." });
  }
  const missingMust = must.filter((group) => !group.matched);
  if (missingMust.length) {
    const preview = missingMust.slice(0, 6).map((group) => group.label).join(", ");
    issues.push({
      tone: "needs-you",
      title: `${missingMust.length} suite theme${missingMust.length === 1 ? "" : "s"} still missing`,
      detail: `${preview}. These were not written into the resume. Add one only when you have done that work, using the words in the suite list.`,
    });
  }
  if (!skills.length) {
    issues.push({ tone: "needs-you", title: "No skills could be listed", detail: "Add a short list of tools you use. None were detected, so a skills section was not invented." });
  }
  if (!processed.has("education")) {
    issues.push({ tone: "needs-you", title: "No education section detected", detail: "Add a school, credential, or note that education is intentionally omitted." });
  }
  if (countWords(optimizedText) < 220) {
    issues.push({ tone: "needs-you", title: "Shorter than most one-page resumes", detail: "The rewrite did not pad it. Add earlier roles or results you left out, if they support this target." });
  } else if (countWords(optimizedText) > 800) {
    issues.push({ tone: "needs-you", title: "Still long for one page", detail: "The rewrite kept your roles. Cut older or less relevant bullets yourself before you submit a one-page version." });
  }
  if (fit.score === null) {
    issues.push({ tone: "needs-you", title: "Role fit needs a clearer target", detail: "Choose a listed role or paste a job description. A title alone did not match a suite, so keyword fit was not scored." });
  }

  return {
    name,
    roleTitle: suite.title,
    basedOn: suite.basedOn,
    usedPost: suite.usedPost,
    emphasis: suite.emphasis,
    verbs: suite.verbs,
    sectionOrder: suite.sectionOrder.map((id) => SECTION_LABELS[id]).filter(Boolean),
    must,
    nice,
    scores: {
      atsBefore: before.total,
      atsAfter: after.total,
      atsBeforeParts: before.parts,
      atsAfterParts: after.parts,
      roleFit: fit.score,
      mustMatched: fit.mustMatched,
      mustTotal: fit.mustTotal,
      niceMatched: fit.niceMatched,
      niceTotal: fit.niceTotal,
    },
    issues,
    changes,
    optimizedText,
    wordCount: countWords(optimizedText),
  };
}
