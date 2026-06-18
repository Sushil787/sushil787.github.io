/**
 * SelectionHandles Component
 *
 * Corner handles displayed when an element is selected. When `onResizeStart`
 * is provided, the handles become draggable grips that scale the element.
 */

const HANDLE_POSITIONS = [
  { corner: "tl", className: "-top-1.5 -left-1.5", cursor: "nwse-resize" },
  { corner: "tr", className: "-top-1.5 -right-1.5", cursor: "nesw-resize" },
  { corner: "bl", className: "-bottom-1.5 -left-1.5", cursor: "nesw-resize" },
  { corner: "br", className: "-bottom-1.5 -right-1.5", cursor: "nwse-resize" },
] as const;

interface SelectionHandlesProps {
  /** When provided, handles are draggable and call this to start a resize. */
  onResizeStart?: (e: React.MouseEvent) => void;
}

/**
 * SelectionHandles - Corner resize grips for selected elements
 *
 * Renders four corner handles. With `onResizeStart`, dragging a handle scales
 * the element around its center; without it, the handles are decorative.
 *
 * @example
 * {isSelected && <SelectionHandles onResizeStart={start} />}
 */
export const SelectionHandles = ({ onResizeStart }: SelectionHandlesProps) => (
  <>
    {HANDLE_POSITIONS.map((pos) => (
      <div
        key={pos.corner}
        onMouseDown={onResizeStart}
        style={onResizeStart ? { cursor: pos.cursor } : undefined}
        className={`absolute ${
          onResizeStart ? "pointer-events-auto" : "pointer-events-none"
        } ${pos.className} w-3 h-3 bg-white border-2 border-neutral-400 rounded-full shadow-sm`}
      />
    ))}
  </>
);
