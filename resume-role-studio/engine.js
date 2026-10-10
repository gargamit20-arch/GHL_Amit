import {
  SECTION_LABELS,
  extractPostTerms,
  getRole,
  groupMatched,
  matchRole,
  textHas,
} from "./roles.js";

const SECTION_ALIASES = [
  { id: "summary", titles: ["professional summary", "summary", "profile", "professional profile", "about", "about me", "objective", "career objective", "professional objective", "summary of qualifications", "qualifications summary", "career summary", "executive summary"] },
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

const SECTION_WORD = /summary|skill|experience|education|project|certif|award|qualif|objective|profile|employment|competenc|highlight|publication|volunteer|activit|affiliat|language|interest|reference|training|leadership|achievement/i;

function looksLikeCustomHeading(line, next) {
  const raw = line.trim();
  if (raw.length < 3 || raw.length > 48) return false;
  if (/^[-*•]|\d+[.)]\s|,|;|@|https?:|\|/.test(raw)) return false;
  const name = raw.replace(/:$/, "").trim();
  if (/[.!?]|\d/.test(name)) return false;
  const letters = name.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return false;
  const words = name.split(/\s+/);
  if (words.length > 6) return false;
  const caps = letters === letters.toUpperCase();
  const sectionShaped = SECTION_WORD.test(name) || raw.endsWith(":");
  if (!caps && !sectionShaped) return false;
  const personShaped = words.length >= 2 && words.every((word) => /^[A-Za-z][A-Za-z.'-]*$/.test(word));
  if (personShaped && !sectionShaped) return false;
  if (/\b(?:19|20)\d{2}\b|\||@/.test(next || "")) return false;
  if (!next) return sectionShaped;
  if (/^(?:[-*•]|\d+[.)])\s/.test(next) || headerId(next)) return true;
  if (sectionShaped) return true;
  return /[.!?]/.test(next) || next.split(/\s+/).length > 8;
}

function customId(line) {
  const slug = line.trim().replace(/:$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `custom:${slug || "section"}`;
}

function parseSections(text) {
  const lines = text.split("\n");
  const preamble = [];
  const sections = [];
  let current = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const next = lines.slice(index + 1).find((item) => item.trim())?.trim() || "";
    const id = headerId(line);
    const custom = !id && looksLikeCustomHeading(line, next);
    if (id || custom) {
      current = {
        id: id || customId(line),
        rawHeading: line.trim().replace(/:$/, ""),
        lines: [],
        standard: id ? isStandardHeading(id, line) : false,
        custom,
      };
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
  const matches = String(text).match(/\+?\d[\d\s().-]{8,}\d/g) || [];
  for (const match of matches) {
    const groups = match.match(/\d+/g) || [];
    const digits = groups.join("");
    if (digits.length < 10 || digits.length > 15) continue;
    const dateLike = groups.every((group) => /^(?:19|20)\d{2}$/.test(group) || /^(?:0?[1-9]|1[0-2])$/.test(group));
    if (dateLike) continue;
    return match.trim();
  }
  return "";
}

function findLinks(text) {
  const found = [];
  const pattern = /(?:https?:\/\/[^\s|,]+|www\.[^\s|,]+|(?:[a-z0-9-]+\.)+(?:com|io|dev|me|org|net|co)\/[^\s|,]+)/gi;
  for (const match of String(text).matchAll(pattern)) {
    const url = match[0].replace(/^https?:\/\//i, "").replace(/[),.;]+$/g, "");
    if (url && !found.some((item) => item.toLowerCase() === url.toLowerCase())) found.push(url);
    if (found.length === 4) break;
  }
  return found;
}

function matchLocation(lines) {
  const pattern = /\b([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,2}),\s*(?!Present\b|Current\b)([A-Z]{2}|[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,2})\b/g;
  for (const line of lines) {
    if (/university|college|school|bachelor|master|\bb\.a\b|\bb\.s\b|\bm\.a\b|\bph\.d\b/i.test(line) && !/@|\|/.test(line)) continue;
    for (const match of line.matchAll(pattern)) {
      if (match[0].length > 48 || /\d/.test(match[0])) continue;
      if (/^(?:present|current|january|february|march|april|may|june|july|august|september|october|november|december)$/i.test(match[2])) continue;
      return match[0].trim();
    }
  }
  return "";
}

function findLocation(text) {
  const lines = String(text).split("\n");
  const preferred = lines.filter((line, index) => index < 8 || /@|\|/.test(line));
  return matchLocation(preferred) || matchLocation(lines);
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
  const rangeRe = /\b(?:(?:0?[1-9]|1[0-2])[\/.-])?((?:19|20)\d{2})\b\s*(?:-|to)\s*(?:[A-Za-z.]+\s+){0,2}(?:(?:0?[1-9]|1[0-2])[\/.-])?((?:19|20)\d{2}|present|current|now)\b/gi;
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

const NOUN_AFTER_GERUND = new Set([
  "indicator", "indicators", "program", "programs", "material", "materials",
  "session", "sessions", "course", "courses", "manual", "manuals", "guide", "guides",
  "document", "documents", "curriculum", "module", "modules",
]);

const TO_ROLE_GERUNDS = new Set(["reporting", "leading", "assisting", "helping"]);

function gerundPast(word) {
  return GERUNDS[String(word || "").toLowerCase().replace(/[^a-z]/g, "")] || "";
}

function gerundIsVerb(first, second) {
  const verb = first.toLowerCase().replace(/[^a-z]/g, "");
  if (!GERUNDS[verb]) return false;
  const next = String(second || "").toLowerCase().replace(/[^a-z]/g, "");
  if (NOUN_AFTER_GERUND.has(next)) return false;
  if (next === "to" && TO_ROLE_GERUNDS.has(verb)) return false;
  return true;
}

function polishGerunds(sentence) {
  const words = sentence.trim().split(/\s+/);
  if (words.length && gerundIsVerb(words[0], words[1])) {
    const past = gerundPast(words[0]);
    if (past) words[0] = past;
  }
  for (let index = 0; index < words.length - 1; index += 1) {
    if (!/^and$/i.test(words[index])) continue;
    if (!gerundIsVerb(words[index + 1], words[index + 2])) continue;
    const past = gerundPast(words[index + 1]);
    if (past) words[index + 1] = past;
  }
  return words.join(" ");
}

function startsWithAction(text) {
  const first = String(text).trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") || "";
  return Boolean(GERUNDS[first] || ACTION_VERBS.has(first));
}

function rewriteBullet(raw) {
  let text = cleanInline(raw.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, ""));
  const original = text;
  text = text.replace(/^(?:i am|i'm|i)\s+/i, "");
  const duty = text.match(/^(?:i was responsible for|i am responsible for|responsible for|duties included|duties include|tasked with|my duties included)\s+/i);
  if (duty) {
    const rest = text.slice(duty[0].length);
    if (startsWithAction(rest)) text = rest;
  }
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
    if (sectionId !== "education" && isBullet(line)) {
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

function displaySkill(skill, suite) {
  const terms = [...(suite?.must || []), ...(suite?.nice || [])].flatMap((group) => group.terms);
  return terms.find((term) => term.toLowerCase() === skill.toLowerCase()) || skill;
}

function splitSkills(text, suite) {
  const chunks = text
    .split(/\n|•|\||,|;|\/(?![a-z])/i)
    .map((part) => cleanInline(part).replace(/^- /, "").replace(/\.$/, ""))
    .filter((part) => part.length >= 2 && part.length <= 40 && part.split(" ").length <= 5);
  const unique = [];
  for (const skill of chunks) {
    const tidy = displaySkill(skill, suite);
    if (unique.some((item) => item.toLowerCase() === tidy.toLowerCase())) continue;
    unique.push(tidy);
  }
  return unique.filter((skill, index) => !unique.some((other, otherIndex) => otherIndex !== index && other.length > skill.length && textHas(other, skill)));
}

function orderSkills(skills, suite, sourceText) {
  const pool = skills.length ? skills : inferSkills(sourceText, suite).map((skill) => displaySkill(skill, suite));
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

function cleanProse(text) {
  return String(text || "")
    .split(/\n+/)
    .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+/))
    .map((sentence) => {
      let next = cleanInline(sentence).replace(/^(?:i am|i'm|i)\s+/i, "");
      if (!next) return "";
      next = next.charAt(0).toUpperCase() + next.slice(1);
      if (!/[.!?]$/.test(next)) next += ".";
      return next;
    })
    .filter(Boolean)
    .join(" ");
}

function buildSummary(original, evidence) {
  const cleaned = cleanProse(original);
  if (cleaned) return cleaned;
  if (!evidence) return "";
  const sentence = evidence.length > 220 ? `${evidence.slice(0, 217).replace(/\s+\S*$/, "")}` : evidence.replace(/\.$/, "");
  return `${sentence}.`;
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
  const location = findLocation(text);
  const emoji = (text.match(/\p{Extended_Pictographic}/gu) || []).length;
  const tableLikely = text.split("\n").some((line) => (line.match(/\|/g) || []).length >= 4 && !line.includes("@"));
  const firstPerson = text.split("\n").filter((line) => isBullet(line) && /\b(I|my|me|mine|I'm)\b/.test(line)).length;
  const noise = text.split("\n").some((line) => isNoiseLine(line));

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

function isNoiseLine(line) {
  const trimmed = line.trim();
  if (/^page \d+\b/i.test(trimmed)) return "page";
  if (/^\[(?:photo|image|picture|chart|table)\]$/i.test(trimmed)) return "photo";
  if (/^(?:profile photo|headshot)\b[:\s-]*$/i.test(trimmed)) return "photo";
  return "";
}

function dropNoise(text) {
  const kept = [];
  let photos = 0;
  let pages = 0;
  for (const line of text.split("\n")) {
    const kind = isNoiseLine(line);
    if (kind === "page") {
      pages += 1;
      continue;
    }
    if (kind === "photo") {
      photos += 1;
      continue;
    }
    kept.push(line);
  }
  return { text: kept.join("\n"), photos, pages };
}

function samePerson(line, name) {
  return Boolean(name) && tidyName(line).toLowerCase() === name.toLowerCase();
}

function isContactLine(line) {
  if (/@|https?:\/\/|www\.|(?:[a-z0-9-]+\.)+(?:com|io|dev|me|org|net|co)\b|\+\d|\(\d{2,4}\)|\|/i.test(line)) return true;
  return Boolean(matchLocation([line]));
}

function contactFromPreamble(preamble, name) {
  const lines = String(preamble || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const kept = [];
  const prose = [];
  for (const line of lines) {
    if (samePerson(line, name)) continue;
    if (isContactLine(line)) kept.push(cleanInline(line));
    else prose.push(line);
  }
  const contact = [];
  for (const line of kept) {
    if (!contact.some((item) => item.toLowerCase() === line.toLowerCase())) contact.push(line);
  }
  return { contact: contact.join(" | "), prose: prose.join("\n") };
}

function looksLikeLooseRole(text) {
  return /\b(?:19|20)\d{2}\b/.test(text) || /^\s*(?:[-*•]|\d+[.)])\s+/m.test(text);
}

function mergeBody(previous, next) {
  if (!previous) return next;
  return {
    text: [previous.text, next.text].filter(Boolean).join("\n\n"),
    bulletChanges: [...previous.bulletChanges, ...next.bulletChanges],
    weakLeft: previous.weakLeft + next.weakLeft,
    bulletCount: previous.bulletCount + next.bulletCount,
    metricCount: previous.metricCount + next.metricCount,
  };
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
  const identity = contactFromPreamble(parsed.preamble, name);
  const contactExtras = [];
  if (email && !identity.contact.toLowerCase().includes(email.toLowerCase())) contactExtras.push(email);
  if (phone && !identity.contact.includes(phone)) contactExtras.push(phone);
  for (const link of links) {
    if (!identity.contact.toLowerCase().includes(link.toLowerCase())) contactExtras.push(link);
  }
  const fallbackContact = [findLocation(sourceText), email, phone, ...links].filter(Boolean).join(" | ");
  const contact = identity.contact
    ? [identity.contact, ...contactExtras].filter(Boolean).join(" | ")
    : fallbackContact;

  const processed = new Map();
  const extras = [];
  let bulletRewrites = 0;
  let weakLeft = 0;
  let bulletCount = 0;
  let metricCount = 0;
  const headingRenames = [];

  const absorb = (body) => {
    bulletRewrites += body.bulletChanges.length;
    weakLeft += body.weakLeft;
    bulletCount += body.bulletCount;
    metricCount += body.metricCount;
  };

  for (const section of parsed.sections) {
    const body = processBody(section.id, section.lines);
    absorb(body);
    if (section.custom) {
      const existing = extras.find((item) => item.id === section.id);
      if (existing) existing.body = mergeBody(existing.body, body);
      else extras.push({ id: section.id, heading: section.rawHeading, body });
      continue;
    }
    processed.set(section.id, mergeBody(processed.get(section.id), body));
    const label = SECTION_LABELS[section.id];
    if (label && section.rawHeading.replace(/:$/, "").trim().toLowerCase() !== label.toLowerCase()) {
      headingRenames.push(section.rawHeading.replace(/:$/, ""));
    }
  }

  let originalSummary = processed.get("summary")?.text || "";
  const hadSummary = Boolean(originalSummary) || Boolean(identity.prose && !looksLikeLooseRole(identity.prose));
  if (identity.prose && looksLikeLooseRole(identity.prose)) {
    const body = processBody("experience", identity.prose.split("\n"));
    absorb(body);
    extras.unshift({ id: "custom:preamble", heading: "Additional details", body });
  } else if (identity.prose) {
    originalSummary = [identity.prose, originalSummary].filter(Boolean).join("\n");
  }

  const experienceBody = [processed.get("experience")?.text || "", ...extras.map((item) => item.body.text)].filter(Boolean).join("\n");
  const years = estimateYears(experienceBody);
  const skillsSource = processed.get("skills")?.text || "";
  const listedSkills = splitSkills(skillsSource, suite);
  const skills = orderSkills(listedSkills, suite, sourceText);
  const skillsCreated = !processed.has("skills") && skills.length > 0;

  const resumeForMatch = [sourceText, skills.join(" ")].join("\n");
  const must = annotateGroups(resumeForMatch, suite.must);
  const nice = annotateGroups(resumeForMatch, suite.nice);
  const evidence = bestEvidence(experienceBody);
  const summary = buildSummary(originalSummary, evidence);

  const blocks = [];
  if (name) blocks.push(name);
  if (contact) blocks.push(contact);
  blocks.push(suite.title.slice(0, 80));
  blocks.push("");

  const pushSection = (id, body) => {
    if (!body) return;
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

  for (const extra of extras) {
    const body = extra.body?.text || "";
    if (!body) continue;
    blocks.push(extra.heading.replace(/:$/, "").toUpperCase());
    blocks.push(body);
    blocks.push("");
  }

  const optimizedText = blocks.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  const after = pointsFor(assess(optimizedText));
  const fit = roleFit(must, nice);

  const changes = [];
  if (summary && hadSummary) changes.push("Kept your summary and removed first-person openers. It does not rename you to the target role.");
  else if (summary) changes.push("Added a summary from a result already written in the resume. It does not assign the target title.");
  changes.push(`Placed “${suite.title.slice(0, 80)}” under your name as the role you are applying for. It is not taken from a past job.`);
  if (years) changes.push(`Experience dates span about ${years} years.`);
  if (extras.length) {
    changes.push(`Kept ${extras.length} section${extras.length === 1 ? "" : "s"} that did not use a standard heading.`);
  }
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
