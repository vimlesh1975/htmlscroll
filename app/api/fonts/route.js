import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

const FONT_REGISTRY_KEYS = [
  "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts",
  "HKCU\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts"
];

function cleanFontName(name) {
  return name
    .replace(/\s*\((TrueType|OpenType|Type 1|All res)\)\s*/gi, "")
    .replace(/\s*&\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

async function queryRegistryFonts(key) {
  try {
    const { stdout } = await execFileAsync("reg", ["query", key], {
      windowsHide: true
    });

    return stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.includes("REG_"))
      .map((line) => cleanFontName(line.split(/\s+REG_\w+\s+/)[0] || ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function GET() {
  const fontLists = await Promise.all(FONT_REGISTRY_KEYS.map(queryRegistryFonts));
  const fonts = [...new Set(fontLists.flat())].sort((a, b) =>
    a.localeCompare(b)
  );

  return Response.json({
    fonts:
      fonts.length > 0
        ? fonts
        : ["Arial", "Mangal", "Noto Sans Devanagari", "Times New Roman"]
  });
}
