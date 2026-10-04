const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const SECTION_RE = /^(PROFESSIONAL SUMMARY|CORE SKILLS|PROFESSIONAL EXPERIENCE|PROJECTS|EDUCATION|CERTIFICATIONS|AWARDS)$/;

function concat(parts) {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
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

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function deflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function zipFiles(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const compressed = await deflateRaw(file.data);
    const crc = crc32(file.data);
    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(8),
      u16(0),
      u16(0),
      u32(crc),
      u32(compressed.length),
      u32(file.data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      compressed,
    ]);
    const central = concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(8),
      u16(0),
      u16(0),
      u32(crc),
      u32(compressed.length),
      u32(file.data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralDirectory = concat(centrals);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDirectory.length),
    u32(offset),
    u16(0),
  ]);
  return concat([...locals, centralDirectory, end]);
}

function findEndOfDirectory(bytes) {
  const start = Math.max(0, bytes.length - 22 - 65535);
  for (let index = bytes.length - 22; index >= start; index -= 1) {
    if (bytes[index] === 0x50 && bytes[index + 1] === 0x4b && bytes[index + 2] === 0x05 && bytes[index + 3] === 0x06) {
      return index;
    }
  }
  return -1;
}

async function unzip(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error("This file is not a Word .docx document.");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = findEndOfDirectory(bytes);
  if (end < 0) throw new Error("This Word file could not be opened.");
  const count = view.getUint16(end + 10, true);
  let cursor = view.getUint32(end + 16, true);
  const files = new Map();
  for (let index = 0; index < count; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    cursor += 46 + nameLength + extraLength + commentLength;
    if (name.endsWith("/")) continue;
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
    let data;
    if (method === 0) data = compressed;
    else if (method === 8) data = await inflateRaw(compressed);
    else throw new Error("This Word file uses a compression method that cannot be read here.");
    files.set(name.replace(/^\/+/, ""), data);
  }
  return files;
}

function decodeXml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, digits) => String.fromCodePoint(Number(digits)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function textFromParagraph(chunk) {
  const end = chunk.indexOf("</w:p>");
  const body = end === -1 ? chunk : chunk.slice(0, end);
  const bullet = /<w:numPr[\s/>]/.test(body);
  let text = "";
  const pattern = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>|<w:cr\b[^>]*\/>/g;
  for (const match of body.matchAll(pattern)) {
    if (match[0].startsWith("<w:tab")) text += "\t";
    else if (match[0].startsWith("<w:br") || match[0].startsWith("<w:cr")) text += "\n";
    else text += decodeXml(match[1]);
  }
  text = text.replace(/[ \t]+\n/g, "\n").trim();
  if (!text) return "";
  return bullet && !/^[-*•]/.test(text) ? `- ${text}` : text;
}

function xmlPartToLines(xml) {
  const lines = [];
  const parts = xml.split(/<w:p(?:\s[^>]*)?>/);
  for (const part of parts.slice(1)) {
    const text = textFromParagraph(part);
    if (!text) {
      if (lines.length && lines[lines.length - 1] !== "") lines.push("");
      continue;
    }
    for (const line of text.split("\n")) lines.push(line.trim());
  }
  return lines;
}

export async function docxToText(buffer) {
  const files = await unzip(buffer);
  const names = [...files.keys()].filter((name) => /word\/(document|header\d*|footer\d*)\.xml$/i.test(name));
  names.sort((left, right) => Number(left.endsWith("document.xml")) - Number(right.endsWith("document.xml")));
  if (!names.some((name) => name.endsWith("document.xml"))) {
    throw new Error("This Word file has no document text.");
  }
  const lines = [];
  for (const name of names) {
    const xml = new TextDecoder("utf-8").decode(files.get(name));
    lines.push(...xmlPartToLines(xml));
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function xmlText(value) {
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function paragraphXml(kind, line) {
  const text = kind === "bullet" ? line.replace(/^[-*•]\s+/, "") : line;
  const styles = {
    name: { size: 32, bold: true, before: 0, after: 40 },
    contact: { size: 21, bold: false, before: 0, after: 40 },
    role: { size: 24, bold: true, before: 0, after: 200 },
    section: { size: 24, bold: true, before: 240, after: 60 },
    job: { size: 22, bold: true, before: 120, after: 0 },
    bullet: { size: 22, bold: false, before: 40, after: 40, indent: 360 },
    body: { size: 22, bold: false, before: 0, after: 40 },
  }[kind];
  const indent = styles.indent ? `<w:ind w:left="${styles.indent}" w:hanging="180"/>` : "";
  const bold = styles.bold ? "<w:b/><w:bCs/>" : "";
  const bulletPrefix = kind === "bullet" ? "- " : "";
  return `<w:p>
    <w:pPr>
      <w:spacing w:before="${styles.before}" w:after="${styles.after}" w:line="276" w:lineRule="auto"/>
      ${indent}
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        ${bold}
        <w:sz w:val="${styles.size}"/>
        <w:szCs w:val="${styles.size}"/>
      </w:rPr>
      <w:t xml:space="preserve">${xmlText(`${bulletPrefix}${text}`)}</w:t>
    </w:r>
  </w:p>`;
}

function isJobMeta(line) {
  return /\b(?:19|20)\d{2}\b/.test(line) && /[|-]|\bPresent\b/i.test(line);
}

function kindOf(line, index, next) {
  if (SECTION_RE.test(line)) return "section";
  if (/^[-*•]\s+/.test(line)) return "bullet";
  if (index === 0) return "name";
  if (index === 1 && /@|\|/.test(line)) return "contact";
  if (index === 2 && line.length <= 80) return "role";
  if (next && isJobMeta(next) && line.length <= 80 && !line.includes("|")) return "job";
  return "body";
}

function documentXml(text) {
  const source = String(text || "").replace(/\r\n/g, "\n").split("\n").map((line) => line.trim()).filter((line, index, all) => line || (all[index - 1] && all[index + 1]));
  const content = source.filter(Boolean);
  const paragraphs = content.map((line, index) => paragraphXml(kindOf(line, index, content[index + 1]), line));
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.join("")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="864" w:right="864" w:bottom="864" w:left="864" w:header="0" w:footer="0" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function packageFiles(text) {
  const encoder = new TextEncoder();
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    "word/_rels/document.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`,
    "word/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
</w:styles>`,
    "word/settings.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:compat>
    <w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>
  </w:compat>
</w:settings>`,
    "word/document.xml": documentXml(text),
  };
  return Object.entries(files).map(([name, contents]) => ({ name, data: encoder.encode(contents) }));
}

export async function buildDocxBytes(text) {
  return zipFiles(packageFiles(text));
}

export async function resumeToDocx(text) {
  const bytes = await buildDocxBytes(text);
  return new Blob([bytes], { type: DOCX_MIME });
}
