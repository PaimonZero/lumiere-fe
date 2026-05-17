const CP1252_REVERSE = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const MOJIBAKE_MARKERS = [
  "\u00c3",
  "\u00c4",
  "\u00c2",
  "\u00e2\u20ac",
  "\u00e1\u00ba",
  "\u00e1\u00bb",
  "\u00c6",
  "\ufffd",
];

function countOccurrences(value, needle) {
  if (!needle) return 0;
  return String(value || "").split(needle).length - 1;
}

function containsMojibakeMarker(value) {
  const text = String(value || "");
  return MOJIBAKE_MARKERS.some((marker) => text.includes(marker)) || /[\u0080-\u009f]/.test(text);
}

function mojibakeScore(value) {
  const text = String(value || "");
  const markerMatches = MOJIBAKE_MARKERS.reduce((sum, marker) => sum + countOccurrences(text, marker), 0);
  const controlMatches = text.match(/[\u0080-\u009f]/g) || [];
  return markerMatches * 2 + controlMatches.length * 3;
}

function cp1252Bytes(value) {
  const bytes = [];
  for (const char of String(value || "")) {
    const code = char.codePointAt(0);
    if (code <= 0xff) {
      bytes.push(code);
    } else if (CP1252_REVERSE.has(code)) {
      bytes.push(CP1252_REVERSE.get(code));
    } else {
      return null;
    }
  }
  return bytes;
}

function decodeUtf8Bytes(bytes) {
  if (typeof TextDecoder === "undefined") return null;
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
  } catch {
    return null;
  }
}

function repairMojibakeOnce(value) {
  const text = String(value ?? "");
  if (!containsMojibakeMarker(text)) return text;

  const before = mojibakeScore(text);
  if (!before) return text;

  const bytes = cp1252Bytes(text);
  if (!bytes) return text;

  const decoded = decodeUtf8Bytes(bytes);
  if (!decoded) return text;

  const after = mojibakeScore(decoded);
  const replacementPenalty = (decoded.match(/\ufffd/g) || []).length * 4;

  return after + replacementPenalty < before ? decoded : text;
}

export function repairMojibake(value) {
  let current = String(value ?? "");
  for (let i = 0; i < 3; i += 1) {
    const repaired = repairMojibakeOnce(current);
    if (repaired === current) break;
    current = repaired;
  }
  return current;
}

export function safeDownloadFilename(value, fallback = "download") {
  const repaired = repairMojibake(value || fallback);
  return repaired
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || fallback;
}
