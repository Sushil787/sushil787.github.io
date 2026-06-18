/**
 * ShapeElement Component
 *
 * Renders a draggable custom shape (rectangle, ellipse, triangle) with
 * selection state, rotation, opacity, and shadow effects.
 */

import type { Shape } from "../../types";
import { buildSvgDataUrl, resolveSvgFill } from "../../lib/svg-utils";
import { SelectionHandles } from "./SelectionHandles";
import { getShapeStyles, getShapeFillStyles, getDropShadowFilter } from "./utils";

interface ShapeElementProps {
  /** Shape data */
  shape: Shape;
  /** Z-index for stacking order */
  zIndex: number;
  /** Whether this shape is selected */
  isSelected: boolean;
  /** Whether mouse interactions are enabled */
  isInteractive: boolean;
  /** Handler for mouse down event */
  onMouseDown: (e: React.MouseEvent) => void;
  /** Handler for right-click context menu */
  onContextMenu?: (e: React.MouseEvent) => void;
  /** Handler to start a corner-handle resize */
  onResizeStart?: (e: React.MouseEvent) => void;
}

/**
 * ShapeElement - Draggable shape overlay component
 *
 * Renders a shape that can be positioned anywhere on the canvas.
 * Supports selection state, rotation, opacity, and drop shadow effects.
 *
 * @param props - Component props
 */
export const ShapeElement = ({
  shape,
  zIndex,
  isSelected,
  isInteractive,
  onMouseDown,
  onContextMenu,
  onResizeStart,
}: ShapeElementProps) => (
  <div
    data-draggable-element="shape"
    className="absolute cursor-move select-none"
    style={getShapeStyles(shape, zIndex, isSelected)}
    onMouseDown={isInteractive ? onMouseDown : undefined}
    onContextMenu={isInteractive ? onContextMenu : undefined}
    onClick={(e) => e.stopPropagation()}
  >
    {shape.type === "svg" && shape.src ? (
      <img
        src={buildSvgDataUrl(shape.src, resolveSvgFill(shape))}
        alt="Shape"
        className="w-full h-full object-contain pointer-events-none"
        style={{
          opacity: (shape.opacity ?? 100) / 100,
          filter: getDropShadowFilter(shape.shadow),
        }}
      />
    ) : (
      <div className="pointer-events-none" style={getShapeFillStyles(shape)} />
    )}
    {isSelected && <SelectionHandles onResizeStart={onResizeStart} />}
  </div>
);
