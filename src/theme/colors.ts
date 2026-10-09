// STRIX color tokens.
//
// Every screen that has been migrated to the theme engine takes its palette from
// React context (see src/context/ThemeContext.tsx + src/theme/useStyles.ts) and
// rebuilds its StyleSheet when the palette changes.
//
// `colors` below is the legacy singleton kept only for screens that have not been
// migrated yet. It is intentionally frozen on the dark palette so those screens
// keep rendering the dark design they were built against, instead of ending up
// half-themed (light text on dark card surfaces).

const darkPalette = {
  background: "#071621",
  surface: "#0F2535",
  surfaceAlt: "#12324A",
  border: "#1A4B65",
  text: "#E2EFF7",
  textMuted: "#8FAFC7",
  textFaint: "#5B6478",
  primaryTeal: "#20E4BA",
  secondaryBlue: "#3B82F6",
  accentTeal: "#20E4BA",
  accentBlue: "#3B82F6",
  accentPurple: "#8B5CF6",
  accentPink: "#EC4899",
  accentOrange: "#F59E0B",
  accentRed: "#EF4444",
  success: "#2FD9A8",

  // --- semantic surfaces -------------------------------------------------
  /** Elevated card (AI planner, topic picker, summary cards). */
  cardStrong: "#082946",
  /** Text fields, search bars, the timer dial's inner disc. */
  input: "#061B2E",
  /** Unselected segment / preset / stat chip. */
  chip: "#07233C",
  /** Selected segment / preset. */
  chipActive: "#063A48",
  /** Selected row highlight (settings choice, active picker row). */
  highlight: "#0B4151",
  /** Accent-tinted icon well. */
  iconWell: "#094D61",
  /** Teal callout (AI recommendation). */
  callout: "#062F46",
  /** Informational note card. */
  note: "#092A47",
  /** Text sitting on a note/callout surface. */
  noteText: "#A7CDEB",
  /** Borders on elevated cards. */
  borderStrong: "#15547A",

  // --- semantic text -----------------------------------------------------
  /** Secondary blue-tinted copy (hints, meta, supporting text). */
  subtleText: "#9CC9EC",
  /** Pale blue used for chevrons and info icons. */
  linkBlue: "#82C8FA",
  /** Accent color tuned for text on a surface (readable in both themes). */
  accentText: "#20E4BA",
  /** Accent fill that must carry white text (accept button). */
  accentSolid: "#0D6C72",
  /** Text/icon drawn on top of an accent or gradient fill. */
  onAccent: "#05151F",
  /** Warning banner surface (missing API key). */
  warnSurface: "#2B2210",
  warnBorder: "#4A3A14",
};

export type Colors = typeof darkPalette;

const lightPalette: Colors = {
  background: "#F2F9FD",
  surface: "#FFFFFF",
  surfaceAlt: "#E5F3FA",
  border: "#C5DFEA",
  text: "#102A3D",
  textMuted: "#55748A",
  textFaint: "#7895A9",
  primaryTeal: "#0AAE9A",
  secondaryBlue: "#2878D6",
  accentTeal: "#0AAE9A",
  accentBlue: "#2878D6",
  accentPurple: "#7357D8",
  accentPink: "#D8569B",
  accentOrange: "#A8620A",
  accentRed: "#C13B52",
  success: "#0AAE9A",

  cardStrong: "#E7F2FB",
  input: "#FFFFFF",
  chip: "#E5F3FA",
  chipActive: "#D6F5EF",
  highlight: "#DDF7F3",
  iconWell: "#D6F0EC",
  callout: "#E6FAF7",
  note: "#E8F4FF",
  noteText: "#3E6B8C",
  borderStrong: "#B7D6E8",

  subtleText: "#4E708A",
  linkBlue: "#2E6E9E",
  accentText: "#0A8172",
  accentSolid: "#0A8172",
  onAccent: "#05151F",
  warnSurface: "#FDF3DC",
  warnBorder: "#E7D6A6",
};

export function getPalette(mode: "dark" | "light"): Colors {
  return mode === "light" ? lightPalette : darkPalette;
}

/** Legacy palette for screens that have not been migrated to themed styles yet. */
export const colors: Colors = darkPalette;

// Per-field color assignment, cycled if more fields are added than colors.
export const fieldPalette = [
  colors.accentBlue,
  colors.accentOrange,
  colors.accentTeal,
  colors.accentPink,
  colors.accentPurple,
  colors.accentRed,
];

export function colorForIndex(i: number) {
  return fieldPalette[i % fieldPalette.length];
}
