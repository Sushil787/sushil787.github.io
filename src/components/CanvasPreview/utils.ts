/**
 * CanvasPreview Utility Functions
 *
 * Helper functions for computing styles and handling element interactions.
 */

import type {
  ImageOverlay,
  SelectedElement,
  ShadowConfig,
  Shape,
} from "../../types";
import { SELECTION_COLORS } from "./constants";

/**
 * Generates drop shadow CSS filter from shadow configuration.
 *
 * @param shadow - Shadow configuration object
 * @returns CSS filter string or undefined if shadow is disabled
 */
export const getDropShadowFilter = (
  shadow: ShadowConfig | undefined,
): string | undefined => {
  if (!shadow?.enabled) return undefined;
  return `drop-shadow(${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color})`;
};

/**
 * Checks if an element is currently selected.
 *
 * @param isActiveScreenshot - Whether this screenshot is active
 * @param selectedElement - Currently selected element info
 * @param elementType - Type of element to check
 * @param elementId - Optional element ID for image elements
 * @returns True if the element is selected
 */
export const isElementSelected = (
  selectedElement: SelectedElement | null,
  elementType: string,
  screenshotId: string,
  elementId?: string,
): boolean => {
  if (!selectedElement) return false;
  if (selectedElement.type !== elementType) return false;
  if (selectedElement.screenshotId !== screenshotId) return false;
  if (elementId && selectedElement.id !== elementId) return false;
  return true;
};

/**
 * Generates selection styles for text elements (headline/subheadline).
 *
 * @param isSelected - Whether the element is selected
 * @returns Style object for selection highlight
 */
export const getTextSelectionStyles = (
  isSelected: boolean,
): React.CSSProperties => ({
  outline: isSelected ? `2px solid ${SELECTION_COLORS.outline}` : "none",
  outlineOffset: "2px",
  background: isSelected ? SELECTION_COLORS.background : "transparent",
  boxShadow: isSelected ? `0 0 0 1px ${SELECTION_COLORS.shadow}` : "none",
});

/**
 * Generates selection styles for image overlay elements.
 *
 * @param isSelected - Whether the element is selected
 * @returns Style object for selection highlight
 */
export const getImageSelectionStyles = (
  isSelected: boolean,
): React.CSSProperties => ({
  outline: isSelected ? `2px dashed ${SELECTION_COLORS.imageOutline}` : "none",
  outlineOffset: "4px",
});

export const getDeviceSelectionStyles = (
  isSelected: boolean,
): React.CSSProperties => getImageSelectionStyles(isSelected);

/**
 * Generates position and transform styles for overlay images.
 *
 * @param image - Overlay image data
 * @param zIndex - Z-index for stacking
 * @param isSelected - Whether the image is selected
 * @returns Style object for positioning
 */
export const getOverlayImageStyles = (
  image: ImageOverlay,
  zIndex: number,
  isSelected: boolean,
): React.CSSProperties => ({
  left: `${image.x}%`,
  top: `${image.y}%`,
  transform: `translate(-50%, -50%) rotate(${image.rotation ?? 0}deg)`,
  width: `${image.width}%`,
  height: `${image.height}%`,
  zIndex,
  ...getImageSelectionStyles(isSelected),
});

/**
 * Generates position and transform styles for the shape container.
 *
 * @param shape - Shape data
 * @param zIndex - Z-index for stacking
 * @param isSelected - Whether the shape is selected
 * @returns Style object for positioning
 */
export const getShapeStyles = (
  shape: Shape,
  zIndex: number,
  isSelected: boolean,
): React.CSSProperties => ({
  left: `${shape.x}%`,
  top: `${shape.y}%`,
  transform: `translate(-50%, -50%) rotate(${shape.rotation ?? 0}deg)`,
  width: `${shape.width}%`,
  height: `${shape.height}%`,
  zIndex,
  ...getImageSelectionStyles(isSelected),
});

/**
 * Generates the fill styles for the inner shape element based on its type.
 *
 * @param shape - Shape data
 * @returns Style object for the shape visual
 */
export const getShapeBackground = (shape: Shape): string => {
  if (shape.fillMode === "gradient") {
    // Store angle as 0 = left→right, 90 = top→bottom; CSS 0deg points up.
    const cssAngle = (shape.gradientAngle ?? 90) + 90;
    return `linear-gradient(${cssAngle}deg, ${shape.gradientFrom}, ${shape.gradientTo})`;
  }
  return shape.color;
};

export const getShapeFillStyles = (shape: Shape): React.CSSProperties => {
  const base: React.CSSProperties = {
    width: "100%",
    height: "100%",
    background: getShapeBackground(shape),
    opacity: (shape.opacity ?? 100) / 100,
    filter: getDropShadowFilter(shape.shadow),
  };

  if (shape.type === "ellipse") {
    return { ...base, borderRadius: "50%" };
  }
  if (shape.type === "triangle") {
    return { ...base, clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" };
  }
  return { ...base, borderRadius: `${shape.cornerRadius ?? 0}%` };
};
