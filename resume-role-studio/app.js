import { docxToText, resumeToDocx } from "./docx.js";
import { optimizeResume } from "./engine.js";
import { ROLES } from "./roles.js";

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
const customField = document.querySelector("#custom-role-field");
const customRole = document.querySelector("#custom-role");
const jobDescription = document.querySelector("#job-description");
const resumeField = document.querySelector("#resume");
const fileInput = document.querySelector("#resume-file");
const status = document.querySelector("#form-status");
const results = document.querySelector("#results");
const printSheet = document.querySelector("#print-sheet");

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
        <h4>Must-have themes</h4>
        <ul class="chip-list">${result.must.length ? result.must.map(chip).join("") : "<li>No keyword suite yet. Paste a job description.</li>"}</ul>
        <h4>Preferred themes</h4>
        <ul class="chip-list">${result.nice.length ? result.nice.map(chip).join("") : "<li>None for this target.</li>"}</ul>
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
  printSheet.textContent = result.optimizedText;
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function persist() {
  const payload = {
    roleId: roleSelect.value,
    customRole: customRole.value,
    jobDescription: jobDescription.value,
    resumeText: resumeField.value,
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(payload));
}

function populateRoles() {
  const families = [];
  for (const role of ROLES) {
    let group = families.find((item) => item.family === role.family);
    if (!group) {
      group = { family: role.family, roles: [] };
      families.push(group);
    }
    group.roles.push(role);
  }
  roleSelect.innerHTML = families.map((group) => `
    <optgroup label="${escapeHtml(group.family)}">
      ${group.roles.map((role) => `<option value="${escapeHtml(role.id)}">${escapeHtml(role.title)}</option>`).join("")}
    </optgroup>`).join("") + `<optgroup label="Other"><option value="custom">Custom role</option></optgroup>`;
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
  localStorage.removeItem(STORE_KEY);
}

syncCustomField();

roleSelect.addEventListener("change", () => {
  syncCustomField();
  if (roleSelect.value === "custom") customRole.focus();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  review();
});

resumeField.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") form.requestSubmit();
});

document.querySelector("#load-example").addEventListener("click", () => {
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
    resumeField.value = await file.text();
    setStatus(`Loaded ${file.name}. Review it, then download the Word file.`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "That Word file could not be read.", true);
  }
});

results.addEventListener("input", (event) => {
  if (event.target.id === "optimized-resume") printSheet.textContent = event.target.value;
});

results.addEventListener("click", async (event) => {
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
    return;
  }
  if (button.dataset.action === "download") {
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = "Preparing Word…";
    try {
      const blob = await resumeToDocx(text);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = results.dataset.download || "Resume_ATS.docx";
      link.click();
      URL.revokeObjectURL(link.href);
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
