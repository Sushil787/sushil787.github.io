/**
 * SVG Utilities
 *
 * Helpers for recoloring uploaded SVG markup (solid or gradient) and turning
 * it into a data URL usable by both the preview (<img>) and the canvas export.
 */

import type { Shape } from "../types";

const GRADIENT_ID = "appshot-shape-gradient";

/**
 * Describes how to fill an SVG.
 * - "original": keep the source colors
 * - "solid": flatten to a single color
 * - "gradient": apply a linear gradient
 */
export type SvgFill =
  | { mode: "original" }
  | { mode: "solid"; color: string }
  | { mode: "gradient"; from: string; to: string; angle: number };

/**
 * Replaces every fill value (except "none") in SVG markup with `value`, and
 * ensures the root <svg> carries it so unfilled paths inherit.
 */
const applyFill = (markup: string, value: string): string => {
  let out = markup
    .replace(/fill="(?!none")[^"]*"/g, `fill="${value}"`)
    .replace(/fill:\s*(?!none)[^;"']+/g, `fill:${value}`);

  if (!/<svg[^>]*\sfill=/.test(out)) {
    out = out.replace(/<svg\b/, `<svg fill="${value}"`);
  }
  return out;
};

/**
 * Applies a flat color to raw SVG markup (good for monochrome icons).
 */
export const tintSvg = (markup: string, color: string): string =>
  applyFill(markup, color);

/**
 * Converts a gradient angle (degrees, 0 = left→right, 90 = top→bottom) into
 * the x1/y1/x2/y2 coordinates for an SVG linearGradient.
 */
const gradientVector = (angle: number) => {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad);
  const y = Math.sin(rad);
  return {
    x1: `${(0.5 - x / 2) * 100}%`,
    y1: `${(0.5 - y / 2) * 100}%`,
    x2: `${(0.5 + x / 2) * 100}%`,
    y2: `${(0.5 + y / 2) * 100}%`,
  };
};

/**
 * Applies a linear gradient to raw SVG markup by injecting a <linearGradient>
 * definition and pointing every fill at it.
 */
const gradientSvg = (
  markup: string,
  from: string,
  to: string,
  angle: number,
): string => {
  const { x1, y1, x2, y2 } = gradientVector(angle);
  const defs =
    `<defs><linearGradient id="${GRADIENT_ID}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
    `<stop offset="0%" stop-color="${from}"/>` +
    `<stop offset="100%" stop-color="${to}"/>` +
    `</linearGradient></defs>`;

  const filled = applyFill(markup, `url(#${GRADIENT_ID})`);
  return filled.replace(/(<svg[^>]*>)/, `$1${defs}`);
};

/**
 * Builds a `data:image/svg+xml` URL from SVG markup with the given fill.
 */
export const buildSvgDataUrl = (markup: string, fill: SvgFill): string => {
  let svg = markup;
  if (fill.mode === "solid") {
    svg = tintSvg(markup, fill.color);
  } else if (fill.mode === "gradient") {
    svg = gradientSvg(markup, fill.from, fill.to, fill.angle);
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Resolves a shape's fill settings into an {@link SvgFill} descriptor.
 */
export const resolveSvgFill = (shape: Shape): SvgFill => {
  if (shape.fillMode === "solid") {
    return { mode: "solid", color: shape.color };
  }
  if (shape.fillMode === "gradient") {
    return {
      mode: "gradient",
      from: shape.gradientFrom,
      to: shape.gradientTo,
      angle: shape.gradientAngle ?? 90,
    };
  }
  return { mode: "original" };
};
