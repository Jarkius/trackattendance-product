#!/usr/bin/env bun
/**
 * check-contrast.ts — WCAG contrast ratio checker for Tailwind color classes
 *
 * Reads landing/index.html, extracts text/bg color pairs per line,
 * calculates contrast ratios, and reports WCAG AA failures.
 *
 * Usage: bun scripts/check-contrast.ts
 *
 * WCAG AA thresholds:
 *   - Normal text (< 18pt or < 14pt bold): 4.5:1
 *   - Large text (>= 18pt or >= 14pt bold): 3:1
 */

import { readFileSync } from "fs";
import { join } from "path";

// ─── Tailwind Color Map ──────────────────────────────────────────────

const COLORS: Record<string, string> = {
  // White / Black
  white: "#ffffff",
  black: "#000000",

  // Slate
  "slate-50": "#f8fafc",
  "slate-100": "#f1f5f9",
  "slate-200": "#e2e8f0",
  "slate-300": "#cbd5e1",
  "slate-400": "#94a3b8",
  "slate-500": "#64748b",
  "slate-600": "#475569",
  "slate-700": "#334155",
  "slate-800": "#1e293b",
  "slate-900": "#0f172a",
  "slate-950": "#020617",

  // Gray
  "gray-50": "#f9fafb",
  "gray-100": "#f3f4f6",
  "gray-200": "#e5e7eb",
  "gray-300": "#d1d5db",
  "gray-400": "#9ca3af",
  "gray-500": "#6b7280",
  "gray-600": "#4b5563",
  "gray-700": "#374151",
  "gray-800": "#1f2937",
  "gray-900": "#111827",
  "gray-950": "#030712",

  // Zinc
  "zinc-50": "#fafafa",
  "zinc-100": "#f4f4f5",
  "zinc-200": "#e4e4e7",
  "zinc-300": "#d4d4d8",
  "zinc-400": "#a1a1aa",
  "zinc-500": "#71717a",
  "zinc-600": "#52525b",
  "zinc-700": "#3f3f46",
  "zinc-800": "#27272a",
  "zinc-900": "#18181b",
  "zinc-950": "#09090b",

  // Violet
  "violet-50": "#f5f3ff",
  "violet-100": "#ede9fe",
  "violet-200": "#ddd6fe",
  "violet-300": "#c4b5fd",
  "violet-400": "#a78bfa",
  "violet-500": "#8b5cf6",
  "violet-600": "#7c3aed",
  "violet-700": "#6d28d9",
  "violet-800": "#5b21b6",
  "violet-900": "#4c1d95",
  "violet-950": "#2e1065",

  // Purple
  "purple-50": "#faf5ff",
  "purple-100": "#f3e8ff",
  "purple-200": "#e9d5ff",
  "purple-300": "#d8b4fe",
  "purple-400": "#c084fc",
  "purple-500": "#a855f7",
  "purple-600": "#9333ea",
  "purple-700": "#7e22ce",
  "purple-800": "#6b21a8",
  "purple-900": "#581c87",
  "purple-950": "#3b0764",

  // Fuchsia
  "fuchsia-50": "#fdf4ff",
  "fuchsia-100": "#fae8ff",
  "fuchsia-200": "#f5d0fe",
  "fuchsia-300": "#f0abfc",
  "fuchsia-400": "#e879f9",
  "fuchsia-500": "#d946ef",
  "fuchsia-600": "#c026d3",
  "fuchsia-700": "#a21caf",
  "fuchsia-800": "#86198f",
  "fuchsia-900": "#701a75",
  "fuchsia-950": "#4a044e",

  // Red
  "red-50": "#fef2f2",
  "red-100": "#fee2e2",
  "red-200": "#fecaca",
  "red-300": "#fca5a5",
  "red-400": "#f87171",
  "red-500": "#ef4444",
  "red-600": "#dc2626",
  "red-700": "#b91c1c",
  "red-800": "#991b1b",
  "red-900": "#7f1d1d",
  "red-950": "#450a0a",

  // Orange
  "orange-50": "#fff7ed",
  "orange-100": "#ffedd5",
  "orange-200": "#fed7aa",
  "orange-300": "#fdba74",
  "orange-400": "#fb923c",
  "orange-500": "#f97316",
  "orange-600": "#ea580c",
  "orange-700": "#c2410c",
  "orange-800": "#9a3412",
  "orange-900": "#7c2d12",
  "orange-950": "#431407",

  // Amber
  "amber-50": "#fffbeb",
  "amber-100": "#fef3c7",
  "amber-200": "#fde68a",
  "amber-300": "#fcd34d",
  "amber-400": "#fbbf24",
  "amber-500": "#f59e0b",
  "amber-600": "#d97706",
  "amber-700": "#b45309",
  "amber-800": "#92400e",
  "amber-900": "#78350f",
  "amber-950": "#451a03",

  // Yellow
  "yellow-50": "#fefce8",
  "yellow-100": "#fef9c3",
  "yellow-200": "#fef08a",
  "yellow-300": "#fde047",
  "yellow-400": "#facc15",
  "yellow-500": "#eab308",
  "yellow-600": "#ca8a04",
  "yellow-700": "#a16207",
  "yellow-800": "#854d0e",
  "yellow-900": "#713f12",
  "yellow-950": "#422006",

  // Green
  "green-50": "#f0fdf4",
  "green-100": "#dcfce7",
  "green-200": "#bbf7d0",
  "green-300": "#86efac",
  "green-400": "#4ade80",
  "green-500": "#22c55e",
  "green-600": "#16a34a",
  "green-700": "#15803d",
  "green-800": "#166534",
  "green-900": "#14532d",
  "green-950": "#052e16",

  // Emerald
  "emerald-50": "#ecfdf5",
  "emerald-100": "#d1fae5",
  "emerald-200": "#a7f3d0",
  "emerald-300": "#6ee7b7",
  "emerald-400": "#34d399",
  "emerald-500": "#10b981",
  "emerald-600": "#059669",
  "emerald-700": "#047857",
  "emerald-800": "#065f46",
  "emerald-900": "#064e3b",
  "emerald-950": "#022c22",

  // Teal
  "teal-50": "#f0fdfa",
  "teal-100": "#ccfbf1",
  "teal-200": "#99f6e4",
  "teal-300": "#5eead4",
  "teal-400": "#2dd4bf",
  "teal-500": "#14b8a6",
  "teal-600": "#0d9488",
  "teal-700": "#0f766e",
  "teal-800": "#115e59",
  "teal-900": "#134e4a",
  "teal-950": "#042f2e",

  // Cyan
  "cyan-50": "#ecfeff",
  "cyan-100": "#cffafe",
  "cyan-200": "#a5f3fc",
  "cyan-300": "#67e8f9",
  "cyan-400": "#22d3ee",
  "cyan-500": "#06b6d4",
  "cyan-600": "#0891b2",
  "cyan-700": "#0e7490",
  "cyan-800": "#155e75",
  "cyan-900": "#164e63",
  "cyan-950": "#083344",

  // Sky
  "sky-50": "#f0f9ff",
  "sky-100": "#e0f2fe",
  "sky-200": "#bae6fd",
  "sky-300": "#7dd3fc",
  "sky-400": "#38bdf8",
  "sky-500": "#0ea5e9",
  "sky-600": "#0284c7",
  "sky-700": "#0369a1",
  "sky-800": "#075985",
  "sky-900": "#0c4a6e",
  "sky-950": "#082f49",

  // Blue
  "blue-50": "#eff6ff",
  "blue-100": "#dbeafe",
  "blue-200": "#bfdbfe",
  "blue-300": "#93c5fd",
  "blue-400": "#60a5fa",
  "blue-500": "#3b82f6",
  "blue-600": "#2563eb",
  "blue-700": "#1d4ed8",
  "blue-800": "#1e40af",
  "blue-900": "#1e3a8a",
  "blue-950": "#172554",

  // Indigo
  "indigo-50": "#eef2ff",
  "indigo-100": "#e0e7ff",
  "indigo-200": "#c7d2fe",
  "indigo-300": "#a5b4fc",
  "indigo-400": "#818cf8",
  "indigo-500": "#6366f1",
  "indigo-600": "#4f46e5",
  "indigo-700": "#4338ca",
  "indigo-800": "#3730a3",
  "indigo-900": "#312e81",
  "indigo-950": "#1e1b4b",

  // Rose
  "rose-50": "#fff1f2",
  "rose-100": "#ffe4e6",
  "rose-200": "#fecdd3",
  "rose-300": "#fda4af",
  "rose-400": "#fb7185",
  "rose-500": "#f43f5e",
  "rose-600": "#e11d48",
  "rose-700": "#be123c",
  "rose-800": "#9f1239",
  "rose-900": "#881337",
  "rose-950": "#4c0519",

  // Custom / Navy (common dark theme)
  "navy-900": "#0f172a",
  "navy-950": "#0a0e1a",
};

// ─── CSS Class → Background Color Map ────────────────────────────────
// For custom CSS classes that set background via stylesheets, not Tailwind.
// These get treated as bg colors when found in a class attribute.

const CSS_BG_CLASSES: Record<string, string> = {
  "btn-glow": "#7c3aed", // linear-gradient(135deg, #7c3aed, #8B5CF6) — use darker end
  "hero-gradient": "#ffffff", // light theme hero section
};

// ─── Hex Color Parsing ───────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16),
  ];
}

// ─── WCAG Luminance & Contrast ───────────────────────────────────────

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── Class Extraction ────────────────────────────────────────────────

interface ColorInfo {
  className: string;
  hex: string;
}

/**
 * Resolve a Tailwind color class (text-X or bg-X) to a hex value.
 * Handles:
 *  - text-white, bg-white, text-black, bg-black
 *  - text-slate-500, bg-violet-600, etc.
 *  - text-[#8B5CF6], bg-[#0f172a] (arbitrary values)
 *  - Classes with opacity modifiers like bg-white/95, bg-red-500/10
 */
function resolveColor(cls: string): ColorInfo | null {
  // Strip the text- or bg- prefix
  const prefix = cls.startsWith("text-") ? "text-" : "bg-";
  let colorPart = cls.slice(prefix.length);

  // Strip opacity modifier (e.g., /95, /10, /[0.06])
  colorPart = colorPart.replace(/\/\[?[\d.]+\]?$/, "");

  // Arbitrary hex value: [#xxxxxx]
  const arbMatch = colorPart.match(/^\[#([a-fA-F0-9]{3,8})\]$/);
  if (arbMatch) {
    const hex = `#${arbMatch[1]}`;
    return { className: cls, hex };
  }

  // Named color lookup
  if (COLORS[colorPart]) {
    return { className: cls, hex: COLORS[colorPart] };
  }

  return null;
}

/**
 * Extract all text-* and bg-* color classes from a single class attribute string.
 * Ignores dark: prefixed classes (separate theme), hover:, focus:, etc.
 */
function extractColors(classStr: string): {
  textColors: ColorInfo[];
  bgColors: ColorInfo[];
  isIconElement: boolean;
  hasGradientBg: boolean;
  gradientFromColor: ColorInfo | null;
} {
  const classes = classStr.split(/\s+/);
  const textColors: ColorInfo[] = [];
  const bgColors: ColorInfo[] = [];

  // Detect icon-only elements (Lucide icons, SVG containers) — these are decorative
  const isIconElement =
    classes.includes("lucide") ||
    classStr.includes("data-lucide");

  // Detect gradient backgrounds — extract the `from-` color as the effective bg
  let hasGradientBg = false;
  let gradientFromColor: ColorInfo | null = null;
  for (const cls of classes) {
    if (cls.startsWith("bg-gradient")) {
      hasGradientBg = true;
    }
    const fromMatch = cls.match(/^from-(.+)$/);
    if (fromMatch) {
      const colorName = fromMatch[1];
      if (COLORS[colorName]) {
        gradientFromColor = { className: `from-${colorName}`, hex: COLORS[colorName] };
      }
    }
  }

  for (const cls of classes) {
    // Skip responsive, state, dark mode variants
    if (
      cls.includes("dark:") ||
      cls.includes("hover:") ||
      cls.includes("focus:") ||
      cls.includes("active:") ||
      cls.includes("group-hover:") ||
      cls.includes("placeholder-") ||
      cls.includes("supports-") ||
      cls.includes("border-") ||
      cls.includes("shadow-") ||
      cls.includes("ring-") ||
      cls.includes("divide-") ||
      cls.includes("outline-") ||
      cls.includes("accent-") ||
      cls.includes("caret-") ||
      cls.includes("decoration-") ||
      cls.includes("from-") ||
      cls.includes("via-") ||
      cls.includes("to-")
    ) {
      continue;
    }

    // Check for CSS-defined background classes
    if (CSS_BG_CLASSES[cls]) {
      bgColors.push({ className: cls, hex: CSS_BG_CLASSES[cls] });
      continue;
    }

    if (cls.startsWith("text-")) {
      // Skip non-color text utilities
      if (
        cls.startsWith("text-xs") ||
        cls.startsWith("text-sm") ||
        cls.startsWith("text-base") ||
        cls.startsWith("text-lg") ||
        cls.startsWith("text-xl") ||
        cls.startsWith("text-2xl") ||
        cls.startsWith("text-3xl") ||
        cls.startsWith("text-4xl") ||
        cls.startsWith("text-5xl") ||
        cls.startsWith("text-6xl") ||
        cls.startsWith("text-7xl") ||
        cls.startsWith("text-8xl") ||
        cls.startsWith("text-9xl") ||
        cls.startsWith("text-left") ||
        cls.startsWith("text-center") ||
        cls.startsWith("text-right") ||
        cls.startsWith("text-justify") ||
        cls.startsWith("text-start") ||
        cls.startsWith("text-end") ||
        cls.startsWith("text-wrap") ||
        cls.startsWith("text-nowrap") ||
        cls.startsWith("text-balance") ||
        cls.startsWith("text-pretty") ||
        cls.startsWith("text-ellipsis") ||
        cls.startsWith("text-clip") ||
        cls.startsWith("text-truncate") ||
        cls === "text-gradient"
      ) {
        continue;
      }
      const resolved = resolveColor(cls);
      if (resolved) textColors.push(resolved);
    } else if (cls.startsWith("bg-")) {
      // Skip non-color bg utilities
      if (
        cls.startsWith("bg-gradient") ||
        cls.startsWith("bg-grid") ||
        cls.startsWith("bg-clip") ||
        cls.startsWith("bg-none") ||
        cls.startsWith("bg-fixed") ||
        cls.startsWith("bg-local") ||
        cls.startsWith("bg-scroll") ||
        cls.startsWith("bg-center") ||
        cls.startsWith("bg-cover") ||
        cls.startsWith("bg-contain") ||
        cls.startsWith("bg-repeat") ||
        cls.startsWith("bg-no-repeat") ||
        cls.startsWith("bg-origin")
      ) {
        continue;
      }
      const resolved = resolveColor(cls);
      if (resolved) bgColors.push(resolved);
    }
  }

  return { textColors, bgColors, isIconElement, hasGradientBg, gradientFromColor };
}

/**
 * Determine if this is likely "large text" based on Tailwind size classes.
 * Large text = >= 18pt (24px) normal weight, or >= 14pt (18.66px ~19px) bold
 */
function isLargeText(classStr: string): boolean {
  const classes = classStr.split(/\s+/);
  const isBold =
    classes.includes("font-bold") ||
    classes.includes("font-extrabold") ||
    classes.includes("font-black") ||
    classes.includes("font-semibold");

  // Tailwind size -> approximate px
  const sizeMap: Record<string, number> = {
    "text-xs": 12,
    "text-sm": 14,
    "text-base": 16,
    "text-lg": 18,
    "text-xl": 20,
    "text-2xl": 24,
    "text-3xl": 30,
    "text-4xl": 36,
    "text-5xl": 48,
    "text-6xl": 60,
    "text-7xl": 72,
    "text-8xl": 96,
    "text-9xl": 128,
  };

  let fontSize = 16; // default
  for (const cls of classes) {
    if (sizeMap[cls]) fontSize = sizeMap[cls];
    // Check responsive variants too (use largest)
    const responsiveMatch = cls.match(/^(?:sm|md|lg|xl|2xl):(.+)$/);
    if (responsiveMatch && sizeMap[responsiveMatch[1]]) {
      fontSize = Math.max(fontSize, sizeMap[responsiveMatch[1]]);
    }
  }

  // Large text: >= 24px normal, or >= 18.66px bold
  if (isBold) return fontSize >= 19;
  return fontSize >= 24;
}

// ─── Ancestor Background Tracking ────────────────────────────────────

/**
 * Walk through lines, tracking open/close tags to infer the nearest
 * ancestor background color for each element.
 *
 * This is a simplified heuristic — not a full HTML parser — but works
 * well for well-formatted Tailwind HTML.
 */

interface CheckResult {
  line: number;
  textClass: string;
  textHex: string;
  bgClass: string;
  bgHex: string;
  ratio: number;
  threshold: number;
  pass: boolean;
  large: boolean;
}

function checkFile(filePath: string): CheckResult[] {
  const html = readFileSync(filePath, "utf-8");
  const lines = html.split("\n");
  const results: CheckResult[] = [];

  // Stack of background colors from ancestor elements
  const bgStack: ColorInfo[] = [{ className: "bg-white", hex: "#ffffff" }];
  // Track tag depth for bg stack management
  const tagDepthStack: number[] = [0];
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Count opening and self-closing tags to track depth
    const openTags = line.match(/<[a-zA-Z][^>]*(?<!\/)>/g) || [];
    const closeTags = line.match(/<\/[a-zA-Z][^>]*>/g) || [];
    const selfClosing = line.match(/<[a-zA-Z][^>]*\/>/g) || [];

    // Extract all class attributes on this line
    const classMatches = [...line.matchAll(/class="([^"]*)"/g)];

    for (const match of classMatches) {
      const classStr = match[1];
      const { textColors, bgColors, isIconElement, hasGradientBg, gradientFromColor } =
        extractColors(classStr);

      // Detect icon elements from surrounding HTML context
      // e.g., <i data-lucide="..." class="..."> or <svg class="...">
      const matchIndex = match.index || 0;
      const before = line.substring(Math.max(0, matchIndex - 80), matchIndex);
      const isIcon =
        isIconElement ||
        /data-lucide/.test(before) ||
        /<svg[^>]*$/.test(before) ||
        /<i[^>]*data-lucide/.test(line);

      // If this element has a gradient bg, use the from-color as effective bg
      if (hasGradientBg && gradientFromColor) {
        bgStack.push(gradientFromColor);
        tagDepthStack.push(depth);
      }
      // If this element has a solid bg color, push it
      else if (bgColors.length > 0) {
        // Use the last bg color (most specific)
        const bg = bgColors[bgColors.length - 1];
        // Only push solid backgrounds (skip low-opacity overlays)
        const originalClass = classStr.split(/\s+/).find(
          (c) =>
            (c.startsWith("bg-") || CSS_BG_CLASSES[c]) &&
            !c.includes("dark:") &&
            !c.includes("hover:")
        );
        if (originalClass && !originalClass.match(/\/(?:5|10|15|20|25|30|40)$/)) {
          bgStack.push(bg);
          tagDepthStack.push(depth);
        }
      }

      // Check text colors against nearest ancestor bg
      // Skip icon/SVG elements — they are decorative, not readable text
      if (textColors.length > 0 && !isIcon) {
        const currentBg = bgStack[bgStack.length - 1];
        const large = isLargeText(classStr);
        const threshold = large ? 3.0 : 4.5;

        for (const tc of textColors) {
          const ratio = contrastRatio(tc.hex, currentBg.hex);
          results.push({
            line: lineNum,
            textClass: tc.className,
            textHex: tc.hex,
            bgClass: currentBg.className,
            bgHex: currentBg.hex,
            ratio: Math.round(ratio * 100) / 100,
            threshold,
            pass: ratio >= threshold,
            large,
          });
        }
      }
    }

    // Adjust depth
    depth += openTags.length - selfClosing.length;
    depth -= closeTags.length;

    // Pop bg stack when we exit the element that set it
    while (tagDepthStack.length > 1 && depth <= tagDepthStack[tagDepthStack.length - 1]) {
      bgStack.pop();
      tagDepthStack.pop();
    }
  }

  return results;
}

// ─── Main ────────────────────────────────────────────────────────────

const projectRoot = join(import.meta.dir, "..");
const htmlPath = join(projectRoot, "landing", "index.html");

console.log(`\n  WCAG AA Contrast Checker — ${htmlPath}\n`);
console.log("  Checking light theme (non-dark: classes)...\n");

const results = checkFile(htmlPath);

const failures = results.filter((r) => !r.pass);
const passes = results.filter((r) => r.pass);

// Group failures by unique combination to reduce noise
const seen = new Set<string>();
const uniqueFailures: CheckResult[] = [];
const uniquePasses: CheckResult[] = [];

for (const r of failures) {
  const key = `${r.textClass}|${r.bgClass}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueFailures.push(r);
  }
}

const passSeen = new Set<string>();
for (const r of passes) {
  const key = `${r.textClass}|${r.bgClass}`;
  if (!passSeen.has(key)) {
    passSeen.add(key);
    uniquePasses.push(r);
  }
}

// Print failures first
if (uniqueFailures.length > 0) {
  console.log("  ── FAILURES ─────────────────────────────────────────\n");
  for (const r of uniqueFailures.sort((a, b) => a.line - b.line)) {
    const sizeLabel = r.large ? "large text" : "normal text";
    console.log(
      `  FAIL: line ${r.line} — ${r.textClass} (${r.textHex}) on ${r.bgClass} (${r.bgHex}) = ${r.ratio}:1 (needs ${r.threshold}:1, ${sizeLabel})`
    );
  }
}

// Print passes
if (uniquePasses.length > 0) {
  console.log("\n  ── PASSES ───────────────────────────────────────────\n");
  for (const r of uniquePasses.sort((a, b) => a.line - b.line)) {
    const sizeLabel = r.large ? "large text" : "normal text";
    console.log(
      `  PASS: line ${r.line} — ${r.textClass} (${r.textHex}) on ${r.bgClass} (${r.bgHex}) = ${r.ratio}:1 (${sizeLabel})`
    );
  }
}

// Summary
console.log("\n  ── SUMMARY ──────────────────────────────────────────\n");
console.log(`  Total checks:   ${results.length}`);
console.log(`  Unique combos:  ${uniqueFailures.length + uniquePasses.length}`);
console.log(`  Failures:       ${uniqueFailures.length}`);
console.log(`  Passes:         ${uniquePasses.length}`);

if (uniqueFailures.length > 0) {
  console.log(`\n  ⚠ ${uniqueFailures.length} contrast issue(s) found. Fix before deploying.\n`);
  process.exit(1);
} else {
  console.log(`\n  All checks passed.\n`);
  process.exit(0);
}
