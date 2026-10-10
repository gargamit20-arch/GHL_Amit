import { docxToText, resumeToDocx } from "./docx.js";
import { optimizeResume } from "./engine.js";
import { ROLES, textHas } from "./roles.js";

const STORE_KEY = "resume-role-studio:v1";

const SAMPLE_RESUME = `ALEX RIVERA
alex.rivera@email.com | (512) 555-0142 | Austin, TX
linkedin.com/in/alexrivera

OBJECTIVE
I am a hardworking professional looking for a challenging role where I can grow. I am passionate about data and teamwork.

WORK HISTORY
Data Specialist
Northwind Markets | Austin, TX | March 2019 - Present
• Responsible for building weekly sales reports in Excel and SQL for regional managers
• Worked on a dashboard that tracked inventory and helped reduce stockouts
• I collaborated with the store ops team to clean product data across 40 locations
• Duties included analyzing customer trends and presenting findings to leadership

Junior Analyst
Brightline Retail | June 2016 – Feb 2019
- Responsible for maintaining spreadsheets and supporting the finance team
- Helped with forecasting for holiday campaigns

EDUCATION
B.A. Economics, University of Texas, 2016

SKILLS
Excel, SQL, Tableau, Python, communication, Microsoft PowerPoint

Page 1 of 1
`;

const form = document.querySelector("#studio-form");
const roleSelect = document.querySelector("#role");
const roleSearch = document.querySelector("#role-search");
const skillFilter = document.querySelector("#skill-filter");
const familyFilters = document.querySelector("#family-filters");
const skillScope = document.querySelector("#skill-scope");
const roleMatchCount = document.querySelector("#role-match-count");
const customField = document.querySelector("#custom-role-field");
const customRole = document.querySelector("#custom-role");
const jobDescription = document.querySelector("#job-description");
const resumeField = document.querySelector("#resume");
const fileInput = document.querySelector("#resume-file");
const status = document.querySelector("#form-status");
const results = document.querySelector("#results");
const printSheet = document.querySelector("#print-sheet");

const roleFilters = {
  query: "",
  families: new Set(),
  skill: "",
  skillScope: "any",
};

const themeFilters = {
  query: "",
  status: "all",
  bucket: "all",
  source: "all",
};

let latest = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character]));
}

function ringColor(score) {
  if (score == null) return "#c8bbaa";
  if (score >= 80) return "#1d4f3a";
  if (score >= 60) return "#8a4e10";
  return "#8d2e2e";
}

function ringStyle(score) {
  const value = score == null ? 0 : score;
  return `background: conic-gradient(${ringColor(score)} ${value * 3.6}deg, #efe4d4 0deg)`;
}

function pageLabel(words) {
  if (words < 220) return "Shorter than a typical page";
  if (words <= 700) return "About one page";
  if (words <= 1100) return "About two pages";
  return "Longer than two pages";
}

function fileName(result) {
  const base = [result.name || "Resume", result.roleTitle, "ATS"].join(" ");
  return `${base.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "")}.docx`;
}

function chip(group) {
  const state = group.matched ? "hit" : "miss";
  const note = group.matched
    ? `Found: ${group.matchedTerm}`
    : `Not yet. Add only if true: ${group.terms.slice(0, 3).join(", ")}`;
  const post = group.fromPost ? `<em class="post">From posting</em>` : "";
  return `<li class="chip ${state}"><span>${escapeHtml(group.label)}</span><small>${escapeHtml(note)}</small>${post}</li>`;
}

function render(result) {
  const fit = result.scores.roleFit;
  const fitLabel = fit == null ? "—" : String(fit);
  const moved = result.scores.atsAfter === result.scores.atsBefore
    ? `ATS score stayed at ${result.scores.atsAfter}. Remaining gaps are content, not formatting.`
    : `ATS score moved from ${result.scores.atsBefore} to ${result.scores.atsAfter} after the rewrite.`;
  const fitDetail = fit == null
    ? "Paste a job description or pick a listed role to score keyword fit."
    : `${result.scores.mustMatched} of ${result.scores.mustTotal} must-have themes found. ${result.scores.niceMatched} of ${result.scores.niceTotal} preferred themes found.`;
  const source = result.basedOn ? ` Closest listed suite: ${result.basedOn}.` : "";
  const posting = result.usedPost ? " Terms from the job post were added to the must-have list." : "";
  const bars = result.scores.atsAfterParts.map((part) => `
    <div class="bar-row">
      <span>${escapeHtml(part.label)}</span>
      <span class="track"><span class="fill" style="width:${Math.round((part.score / part.max) * 100)}%"></span></span>
      <span>${part.score}/${part.max}</span>
    </div>`).join("");
  const issues = result.issues.length
    ? result.issues.map((issue) => `
      <article class="issue ${escapeHtml(issue.tone)}">
        <strong>${escapeHtml(issue.title)}</strong>
        <p>${escapeHtml(issue.detail)}</p>
      </article>`).join("")
    : `<p>No open gaps. Read the rewrite once before you send it.</p>`;

  results.innerHTML = `
    <div class="score-row">
      <article class="score-card">
        <div class="ring" style="${ringStyle(result.scores.atsAfter)}"><span>${result.scores.atsAfter}</span></div>
        <div>
          <h2>ATS readiness</h2>
          <p>${escapeHtml(moved)}</p>
        </div>
      </article>
      <article class="score-card">
        <div class="ring" style="${ringStyle(fit)}"><span>${escapeHtml(fitLabel)}</span></div>
        <div>
          <h2>Role fit</h2>
          <p>${escapeHtml(fitDetail)}</p>
        </div>
      </article>
    </div>
    <div class="bars">${bars}</div>
    <div class="layout">
      <section class="block">
        <p class="eyebrow">Best-fit suite</p>
        <h3>${escapeHtml(result.roleTitle)}</h3>
        <p class="suite-meta">${escapeHtml(result.emphasis)}${escapeHtml(source)}${escapeHtml(posting)}</p>
        <p class="order"><strong>Section order.</strong> ${escapeHtml(result.sectionOrder.join(" → "))}</p>
        <div class="theme-filters">
          <label class="filter-label" for="theme-search">Filter themes</label>
          <input id="theme-search" type="search" placeholder="Skill or theme" autocomplete="off" value="${escapeHtml(themeFilters.query)}" />
          <div class="pill-row" role="group" aria-label="Match">
            ${themePill("status", "all", "All")}${themePill("status", "hit", "Found")}${themePill("status", "miss", "Missing")}
          </div>
          <div class="pill-row" role="group" aria-label="List">
            ${themePill("bucket", "all", "Must and preferred")}${themePill("bucket", "must", "Must-have")}${themePill("bucket", "nice", "Preferred")}
          </div>
          <div class="pill-row" role="group" aria-label="Source">
            ${themePill("source", "all", "Any source")}${themePill("source", "suite", "Role suite")}${themePill("source", "post", "Job posting")}
          </div>
          <div class="filter-meta">
            <p class="hint" id="theme-count" aria-live="polite"></p>
            <button type="button" class="text-btn" id="clear-theme-filters">Clear filters</button>
          </div>
        </div>
        <h4 id="must-heading">Must-have themes</h4>
        <ul id="must-list" class="chip-list"></ul>
        <h4 id="nice-heading">Preferred themes</h4>
        <ul id="nice-list" class="chip-list"></ul>
        <p class="verbs">Verbs this suite favors: ${escapeHtml(result.verbs.join(", "))}.</p>
      </section>
      <section class="block">
        <p class="eyebrow">Review</p>
        <h3>What changed, and what only you can add</h3>
        <h4>Handled in the rewrite</h4>
        <ul class="plain-list">${result.changes.map((change) => `<li>${escapeHtml(change)}</li>`).join("")}</ul>
        <h4>Needs you</h4>
        ${issues}
      </section>
    </div>
    <div class="resume-head">
      <div>
        <p class="eyebrow">ATS resume</p>
        <h3>Edit, then download Word</h3>
      </div>
      <div class="actions">
        <button type="button" class="secondary" data-action="copy">Copy</button>
        <button type="button" class="secondary" data-action="download">Download Word</button>
        <button type="button" class="secondary" data-action="print">Print</button>
      </div>
    </div>
    <textarea id="optimized-resume" class="resume-sheet" aria-label="Optimized resume">${escapeHtml(result.optimizedText)}</textarea>
    <p class="note">${result.wordCount} words. ${pageLabel(result.wordCount)}. Download Word saves this wording, including any edits in the box, as a .docx file. The headline under the name is the role you are applying for, not a past job title.</p>
  `;
  results.dataset.download = fileName(result);
  delete results.dataset.stale;
  printSheet.textContent = result.optimizedText;
  latest = result;
  paintThemes(result);
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function themePill(key, value, label) {
  const pressed = themeFilters[key] === value;
  return `<button type="button" class="pill" data-theme-${key}="${escapeHtml(value)}" aria-pressed="${pressed}">${escapeHtml(label)}</button>`;
}

function roleSkills(role, scope) {
  const groups = scope === "must" ? role.must : scope === "nice" ? role.nice : [...role.must, ...role.nice];
  return groups.flatMap((group) => [group.label, ...group.terms]).join(" ");
}

function roleMatches(role) {
  const query = roleFilters.query.trim().toLowerCase();
  if (query) {
    const haystack = [
      role.title,
      role.family,
      ...(role.aliases || []),
      ...role.must.flatMap((group) => [group.label, ...group.terms]),
      ...role.nice.flatMap((group) => [group.label, ...group.terms]),
    ].join(" ").toLowerCase();
    if (!query.split(/\s+/).every((word) => haystack.includes(word))) return false;
  }
  if (roleFilters.families.size && !roleFilters.families.has(role.family)) return false;
  const skill = roleFilters.skill.trim();
  if (skill && !textHas(roleSkills(role, roleFilters.skillScope), skill)) return false;
  return true;
}

function renderFamilyPills() {
  const families = [...new Set(ROLES.map((role) => role.family))];
  const pills = [{ id: "all", label: "All" }, ...families.map((family) => ({ id: family, label: family }))];
  familyFilters.innerHTML = pills.map((pill) => {
    const pressed = pill.id === "all" ? roleFilters.families.size === 0 : roleFilters.families.has(pill.id);
    return `<button type="button" class="pill" data-family="${escapeHtml(pill.id)}" aria-pressed="${pressed}">${escapeHtml(pill.label)}</button>`;
  }).join("");
}

let renderingRoles = false;

function renderRoleOptions() {
  if (renderingRoles) return;
  renderingRoles = true;
  const current = roleSelect.value;
  const matches = ROLES.filter(roleMatches);
  const families = [];
  for (const role of matches) {
    let group = families.find((item) => item.family === role.family);
    if (!group) {
      group = { family: role.family, roles: [] };
      families.push(group);
    }
    group.roles.push(role);
  }
  const hidden = current && current !== "custom" && !matches.some((role) => role.id === current)
    ? ROLES.find((role) => role.id === current)
    : null;
  const hiddenGroup = hidden
    ? `<optgroup label="Current selection"><option value="${escapeHtml(hidden.id)}">${escapeHtml(hidden.title)} (hidden by filters)</option></optgroup>`
    : "";
  const matchedGroups = families.map((group) => `
    <optgroup label="${escapeHtml(group.family)}">
      ${group.roles.map((role) => `<option value="${escapeHtml(role.id)}">${escapeHtml(role.title)}</option>`).join("")}
    </optgroup>`).join("");
  const empty = matches.length ? "" : `<option value="" disabled>No roles match these filters</option>`;
  roleSelect.innerHTML = `${hiddenGroup}${matchedGroups}${empty}<optgroup label="Other"><option value="custom">Custom role</option></optgroup>`;
  const next = [...roleSelect.options].some((option) => option.value === current && !option.disabled)
    ? current
    : (matches[0]?.id || "custom");
  roleSelect.value = next;
  const hiddenNote = hidden ? " Current selection stays available." : "";
  roleMatchCount.textContent = `${matches.length} of ${ROLES.length} roles match.${hiddenNote}`;
  syncCustomField();
  if (latest && next !== current) markDownloadStale();
  renderingRoles = false;
}

function clearRoleFilters() {
  roleFilters.query = "";
  roleFilters.skill = "";
  roleFilters.skillScope = "any";
  roleFilters.families.clear();
  roleSearch.value = "";
  skillFilter.value = "";
  for (const button of skillScope.querySelectorAll("[data-skill-scope]")) {
    button.setAttribute("aria-pressed", String(button.dataset.skillScope === "any"));
  }
  renderFamilyPills();
  renderRoleOptions();
}

function themeVisible(group, bucket) {
  if (themeFilters.bucket !== "all" && themeFilters.bucket !== bucket) return false;
  if (themeFilters.status === "hit" && !group.matched) return false;
  if (themeFilters.status === "miss" && group.matched) return false;
  if (themeFilters.source === "post" && !group.fromPost) return false;
  if (themeFilters.source === "suite" && group.fromPost) return false;
  const query = themeFilters.query.trim().toLowerCase();
  if (!query) return true;
  const haystack = [group.label, group.matchedTerm || "", ...group.terms].join(" ").toLowerCase();
  return query.split(/\s+/).every((word) => haystack.includes(word));
}

function paintThemeList(list, groups, bucket, emptyLabel) {
  const heading = results.querySelector(bucket === "must" ? "#must-heading" : "#nice-heading");
  const hidden = themeFilters.bucket !== "all" && themeFilters.bucket !== bucket;
  heading.hidden = hidden;
  list.hidden = hidden;
  if (hidden) {
    list.innerHTML = "";
    return 0;
  }
  const visible = groups.filter((group) => themeVisible(group, bucket));
  list.innerHTML = visible.length
    ? visible.map(chip).join("")
    : `<li class="filter-empty">${escapeHtml(emptyLabel)}</li>`;
  return visible.length;
}

function paintThemes(result) {
  const mustList = results.querySelector("#must-list");
  const niceList = results.querySelector("#nice-list");
  const count = results.querySelector("#theme-count");
  if (!mustList || !niceList || !count) return;
  const mustEmpty = result.must.length ? "No must-have themes match these filters." : "No keyword suite yet. Paste a job description.";
  const niceEmpty = result.nice.length ? "No preferred themes match these filters." : "None for this target.";
  const shown = paintThemeList(mustList, result.must, "must", mustEmpty) + paintThemeList(niceList, result.nice, "nice", niceEmpty);
  const total = result.must.length + result.nice.length;
  count.textContent = total ? `Showing ${shown} of ${total} themes.` : "No themes to filter yet.";
}

function clearThemeFilters() {
  themeFilters.query = "";
  themeFilters.status = "all";
  themeFilters.bucket = "all";
  themeFilters.source = "all";
  const search = results.querySelector("#theme-search");
  if (search) search.value = "";
  for (const button of results.querySelectorAll("[data-theme-status], [data-theme-bucket], [data-theme-source]")) {
    const key = button.dataset.themeStatus != null ? "status" : button.dataset.themeBucket != null ? "bucket" : "source";
    const value = button.dataset.themeStatus ?? button.dataset.themeBucket ?? button.dataset.themeSource;
    button.setAttribute("aria-pressed", String(themeFilters[key] === value));
  }
  if (latest) paintThemes(latest);
}

function persist() {
  const payload = {
    roleId: roleSelect.value,
    customRole: customRole.value,
    jobDescription: jobDescription.value,
    resumeText: resumeField.value,
  };
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(payload));
  } catch {
    // Private mode or a full disk should not block the review.
  }
}

function markDownloadStale() {
  const button = results.querySelector("[data-action='download']");
  if (!button) return;
  results.dataset.stale = "true";
  button.disabled = true;
  button.textContent = "Review again to download";
}

function populateRoles() {
  renderFamilyPills();
  renderRoleOptions();
}

function syncCustomField() {
  customField.hidden = roleSelect.value !== "custom";
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("is-error", Boolean(message) && isError);
}

function review() {
  setStatus("");
  const result = optimizeResume({
    roleId: roleSelect.value,
    customRole: customRole.value,
    jobDescription: jobDescription.value,
    resumeText: resumeField.value,
  });
  if (result.error) {
    setStatus(result.error, true);
    markDownloadStale();
    return;
  }
  persist();
  render(result);
}

populateRoles();

try {
  const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
  if (saved && typeof saved === "object") {
    if ([...roleSelect.options].some((option) => option.value === saved.roleId)) roleSelect.value = saved.roleId;
    customRole.value = saved.customRole || "";
    jobDescription.value = saved.jobDescription || "";
    resumeField.value = saved.resumeText || "";
  }
} catch {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // Ignore storage failures while restoring a draft.
  }
}

syncCustomField();

roleSelect.addEventListener("change", () => {
  const hiddenGroup = [...roleSelect.querySelectorAll("optgroup")].find((group) => group.label === "Current selection");
  const stillHidden = hiddenGroup?.querySelector("option")?.value === roleSelect.value;
  if (hiddenGroup && !stillHidden) renderRoleOptions();
  syncCustomField();
  if (roleSelect.value === "custom") customRole.focus();
  markDownloadStale();
});

roleSearch.addEventListener("input", () => {
  roleFilters.query = roleSearch.value;
  renderRoleOptions();
});

skillFilter.addEventListener("input", () => {
  roleFilters.skill = skillFilter.value;
  renderRoleOptions();
});

familyFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-family]");
  if (!button) return;
  const family = button.dataset.family;
  if (family === "all") roleFilters.families.clear();
  else if (roleFilters.families.has(family)) roleFilters.families.delete(family);
  else roleFilters.families.add(family);
  renderFamilyPills();
  renderRoleOptions();
});

skillScope.addEventListener("click", (event) => {
  const button = event.target.closest("[data-skill-scope]");
  if (!button) return;
  roleFilters.skillScope = button.dataset.skillScope;
  for (const pill of skillScope.querySelectorAll("[data-skill-scope]")) {
    pill.setAttribute("aria-pressed", String(pill === button));
  }
  renderRoleOptions();
});

document.querySelector("#clear-role-filters").addEventListener("click", clearRoleFilters);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  review();
});

form.addEventListener("input", (event) => {
  if (event.target === roleSearch || event.target === skillFilter) return;
  markDownloadStale();
});

resumeField.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") form.requestSubmit();
});

document.querySelector("#load-example").addEventListener("click", () => {
  clearRoleFilters();
  roleSelect.value = "data-analyst";
  customRole.value = "";
  jobDescription.value = "";
  resumeField.value = SAMPLE_RESUME;
  syncCustomField();
  review();
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  fileInput.value = "";
  if (!file) return;
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith(".docx")) {
      resumeField.value = await docxToText(await file.arrayBuffer());
      setStatus(`Loaded ${file.name}. Review it, then download the Word file.`);
      markDownloadStale();
      return;
    }
    if (name.endsWith(".doc")) {
      setStatus("Save the file as .docx in Word, then upload that. Older .doc files cannot be read here.", true);
      return;
    }
    if (name.endsWith(".pdf")) {
      setStatus("Upload a .docx file. PDF text cannot be read here.", true);
      return;
    }
    if (!name.endsWith(".txt") && !name.endsWith(".md")) {
      setStatus("Upload a .docx, .txt, or .md file.", true);
      return;
    }
    resumeField.value = await file.text();
    setStatus(`Loaded ${file.name}. Review it, then download the Word file.`);
    markDownloadStale();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "That Word file could not be read.", true);
  }
});

results.addEventListener("input", (event) => {
  if (event.target.id === "optimized-resume") printSheet.textContent = event.target.value;
  if (event.target.id === "theme-search") {
    themeFilters.query = event.target.value;
    if (latest) paintThemes(latest);
  }
});

results.addEventListener("click", async (event) => {
  const themeButton = event.target.closest("[data-theme-status], [data-theme-bucket], [data-theme-source]");
  if (themeButton) {
    if (themeButton.dataset.themeStatus) themeFilters.status = themeButton.dataset.themeStatus;
    if (themeButton.dataset.themeBucket) themeFilters.bucket = themeButton.dataset.themeBucket;
    if (themeButton.dataset.themeSource) themeFilters.source = themeButton.dataset.themeSource;
    const group = themeButton.parentElement;
    for (const pill of group.querySelectorAll(".pill")) {
      pill.setAttribute("aria-pressed", String(pill === themeButton));
    }
    if (latest) paintThemes(latest);
    return;
  }
  if (event.target.closest("#clear-theme-filters")) {
    clearThemeFilters();
    return;
  }
  const button = event.target.closest("button[data-action]");
  const resumeBox = results.querySelector("#optimized-resume");
  if (!button || !resumeBox) return;
  const text = resumeBox.value;
  if (button.dataset.action === "copy") {
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
    } catch {
      resumeBox.focus();
      resumeBox.select();
      button.textContent = "Select and copy";
    }
    window.setTimeout(() => {
      button.textContent = "Copy";
    }, 1600);
    return;
  }
  if (button.dataset.action === "download") {
    if (button.disabled || results.dataset.stale === "true") return;
    button.disabled = true;
    button.textContent = "Preparing Word…";
    try {
      const blob = await resumeToDocx(text);
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = results.dataset.download || "Resume_ATS.docx";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 15000);
      button.textContent = "Downloaded";
      window.setTimeout(() => {
        button.textContent = "Download Word";
        button.disabled = false;
      }, 1600);
    } catch (error) {
      button.textContent = "Download Word";
      button.disabled = false;
      setStatus(error instanceof Error ? error.message : "The Word file could not be created.", true);
    }
    return;
  }
  if (button.dataset.action === "print") {
    printSheet.textContent = text;
    window.print();
  }
});
