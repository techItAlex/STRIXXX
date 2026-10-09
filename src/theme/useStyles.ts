import { useMemo } from "react";
import { useColors } from "../context/ThemeContext";
import type { Colors } from "./colors";

/**
 * Builds a screen's StyleSheet from the active palette and rebuilds it whenever
 * the theme changes.
 *
 * Pass a module-scope factory so the identity is stable across renders:
 *
 *   const makeStyles = (colors: Colors) => StyleSheet.create({ ... });
 *
 *   function MyScreen() {
 *     const colors = useColors();
 *     const styles = useStyles(makeStyles);
 *     ...
 *   }
 *
 * Every component in the file that reads `styles` (or `colors`) needs its own
 * call — that call is also what subscribes the component to theme changes.
 */
export function useStyles<T>(makeStyles: (colors: Colors) => T): T {
  const colors = useColors();
  return useMemo(() => makeStyles(colors), [makeStyles, colors]);
}
