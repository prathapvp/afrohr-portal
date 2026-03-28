/**
 * Global Mantine theme — single source of truth.
 *
 * Imported by the root-level <MantineProvider> in main.tsx so every route
 * (Home, Auth, Legacy portal) shares the same palette and typography.
 */
import { createTheme, type MantineColorsTuple } from "@mantine/core";

/* ── Brand palettes (11 shades each, Mantine convention) ─────────── */

const brightSun: MantineColorsTuple = [
  "#fffbeb",
  "#fff3c6",
  "#ffe588",
  "#ffd149",
  "#ffbd20",   // index 4 — primary shade
  "#f99b07",
  "#dd7302",
  "#b75006",
  "#943c0c",
  "#7a330d",
  "#461902",
];

const mineShaft: MantineColorsTuple = [
  "#f6f6f6",
  "#e7e7e7",
  "#d1d1d1",
  "#b0b0b0",
  "#888888",
  "#6d6d6d",
  "#5d5d5d",
  "#4f4f4f",
  "#454545",
  "#3d3d3d",
  "#2d2d2d",
];

/* ── Theme object ────────────────────────────────────────────────── */

export const afroTheme = createTheme({
  focusRing: "never",
  fontFamily: "'Poppins', sans-serif",
  headings: { fontFamily: "'Poppins', sans-serif" },
  primaryColor: "brightSun",
  primaryShade: 4,
  colors: { brightSun, mineShaft },
  defaultRadius: "md",
  cursorType: "pointer",
});
