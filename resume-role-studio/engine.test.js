import assert from "node:assert/strict";
import test from "node:test";
import { buildDocxBytes, docxToText } from "./docx.js";
import { optimizeResume } from "./engine.js";
import { getRole, matchRole, textHas } from "./roles.js";

function resume(body) {
  return optimizeResume({
    roleId: "software-engineer",
    customRole: "",
    jobDescription: "",
    resumeText: body,
  });
}

test("keyword matching ignores lookalikes and keeps real skills", () => {
  assert.equal(textHas("Alex R Rivera led R&D and R & D work", "R"), false);
  assert.equal(textHas("Python, R, SQL", "R"), true);
  assert.equal(textHas("I excel at presenting findings", "Excel"), false);
  assert.equal(textHas("Excel, SQL, Tableau", "Excel"), true);
  assert.equal(textHas("MySQL warehouse", "SQL"), false);
  assert.equal(textHas("SQL and MySQL", "SQL"), true);
});

test("a custom title needs more than one shared word", () => {
  assert.equal(matchRole("Technical Writer"), null);
  assert.equal(matchRole("Data Analyst").role.id, "data-analyst");
});

test("roadmap is counted once in the product manager suite", () => {
  const role = getRole("product-manager");
  const hits = [...role.must, ...role.nice].flatMap((group) => group.terms).filter((term) => term.toLowerCase() === "roadmap");
  assert.equal(hits.length, 1);
});

test("rewrite keeps facts, merges sections, and does not invent a title", () => {
  const result = resume(`Jamie Cole
jamie@example.com | +91 98765 43210 | Bengaluru, India
https://priya.dev/work

Secret clearance and open to relocation.

SUMMARY OF QUALIFICATIONS
Cashier who likes helping customers.

WORK HISTORY
DATA SPECIALIST
Northwind Markets | Austin, TX | 03/2019 - 05/2021
- Responsible for checkout and customer service
- Reporting to the VP of Stores
- Training programs for new hires
- Reporting weekly drawer totals to the manager
- Removed the headshot requirement from the vendor form

RELEVANT EXPERIENCE
Junior Analyst
Brightline Retail | June 2016 - Feb 2019
- Maintained spreadsheets for the finance team

CAREER HIGHLIGHTS
- Named employee of the month in 2020

SKILLS
javascript, communication

headshot
Page 1 of 1
`);

  assert.equal(result.error, undefined);
  assert.match(result.optimizedText, /Secret clearance and open to relocation/);
  assert.match(result.optimizedText, /Cashier who likes helping customers/);
  assert.doesNotMatch(result.optimizedText, /Software Engineer profile/);
  assert.match(result.optimizedText, /Bengaluru, India/);
  assert.match(result.optimizedText, /\+91 98765 43210/);
  assert.match(result.optimizedText, /priya\.dev\/work/);
  assert.match(result.optimizedText, /DATA SPECIALIST/);
  assert.match(result.optimizedText, /Junior Analyst/);
  assert.match(result.optimizedText, /Maintained spreadsheets/);
  assert.match(result.optimizedText, /Responsible for checkout and customer service/);
  assert.match(result.optimizedText, /Reporting to the VP of Stores/);
  assert.match(result.optimizedText, /Training programs for new hires/);
  assert.match(result.optimizedText, /Reported weekly drawer totals/);
  assert.match(result.optimizedText, /Removed the headshot requirement/);
  assert.match(result.optimizedText, /CAREER HIGHLIGHTS/);
  assert.match(result.optimizedText, /Named employee of the month/);
  assert.match(result.optimizedText, /JavaScript/);
  assert.match(result.optimizedText, /communication/);
  assert.doesNotMatch(result.optimizedText, /^Javascript/m);
  assert.doesNotMatch(result.optimizedText, /^headshot$/m);
  assert.doesNotMatch(result.optimizedText, /Page 1/);
  assert.equal(result.issues.some((issue) => issue.title === "No phone number found"), false);
  assert.match(result.changes.join(" "), /about 5 years/);
});

test("short lookalike words are not written into skills", () => {
  const result = optimizeResume({
    roleId: "data-scientist",
    customRole: "",
    jobDescription: "",
    resumeText: `Alex R Rivera
alex.r@example.com | (512) 555-0142 | Austin, Texas

EXPERIENCE
Researcher
Lab | Austin, TX | 2018 - 2022
- Led R&D for the forecasting workflow and I excel at presenting findings to the team every quarter
`,
  });
  assert.equal(result.error, undefined);
  assert.match(result.optimizedText, /Austin, Texas/);
  assert.doesNotMatch(result.optimizedText, /CORE SKILLS/);
  assert.doesNotMatch(result.optimizedText, /\bExcel\b/);
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function u32(value) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
}

function concat(parts) {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function storeZip(files) {
  const encoder = new TextEncoder();
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const data = encoder.encode(file.data);
    const local = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc32(data)),
      u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes, data,
    ]);
    const central = concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc32(data)),
      u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(offset), nameBytes,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const directory = concat(centrals);
  const end = concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(directory.length), u32(offset), u16(0),
  ]);
  return concat([...locals, directory, end]);
}

test("word import uses the body name and skips deleted letterhead", async () => {
  const paragraph = (text) => `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;
  const bytes = storeZip([
    {
      name: "word/header1.xml",
      data: `<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${paragraph("ACME LETTERHEAD")}${paragraph("jordan@lee.test")}</w:hdr>`,
    },
    {
      name: "word/document.xml",
      data: `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraph("Jordan Lee")}<w:p><w:r><w:del><w:r><w:t>OLD TITLE</w:t></w:r></w:del><w:t>Engineer</w:t></w:r></w:p></w:body></w:document>`,
    },
  ]);
  const text = await docxToText(bytes);
  assert.match(text, /^Jordan Lee/);
  assert.match(text, /jordan@lee\.test/);
  assert.match(text, /Engineer/);
  assert.doesNotMatch(text, /ACME LETTERHEAD/);
  assert.doesNotMatch(text, /OLD TITLE/);
});

test("word download round-trips the edited resume", async () => {
  const source = "Jordan Lee\njordan@lee.test\nData Analyst\n\nPROFESSIONAL EXPERIENCE\n- Built weekly sales reports.\n";
  const text = await docxToText(await buildDocxBytes(source));
  assert.match(text, /Jordan Lee/);
  assert.match(text, /Built weekly sales reports/);
  assert.match(text, /PROFESSIONAL EXPERIENCE/);
});
