/**
 * CanvasPreview Component
 *
 * Main canvas area displaying all screenshots with interactive editing capabilities.
 * Supports drag-and-drop positioning, element selection, and screenshot management.
 *
 * Features:
 * - Horizontal scrolling screenshot gallery
 * - Drag-to-position text and overlay elements
 * - Add/remove screenshots
 * - Responsive preview scaling
 */

import { useState } from "react";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useEditor } from "../../context/EditorContext";
import { getRenderableDevicesForScreenshot } from "../../lib/device-overflow";
import { Toolbar } from "./Toolbar";
import { ScreenshotCard } from "./ScreenshotCard";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { useResizeObserver } from "./useResizeObserver";

type CanvasContextMenu = {
  x: number;
  y: number;
  type: "image" | "shape" | "device";
  screenshotId: string;
  id: string;
};

/**
 * CanvasPreview - Main screenshot editing canvas
 *
 * Displays all screenshots in a horizontal scrollable gallery.
 * The active screenshot can be edited by dragging elements.
 *
 * @example
 * <CanvasPreview />
 */
export const CanvasPreview = () => {
  const {
    screenshots,
    activeScreenshotId,
    setActiveScreenshotId,
    setSelectedElement,
    removeScreenshot,
    handleElementMouseDown,
    handleElementMouseUp,
    handleResizeStart,
    getBackgroundStyle,
    addScreenshot,
    previewRef,
    canvasContainerRef,
    selectedElement,
    headlineFontSize,
    subheadlineFontSize,
    setPreviewDimensions,
    exportSize,
    activeScreenshot,
    removeOverlayImage,
    removeShape,
    removeDevice,
    bringImageForward,
    sendImageBackward,
    bringShapeForward,
    sendShapeBackward,
    bringDeviceForward,
    sendDeviceBackward,
  } = useEditor();

  const [contextMenu, setContextMenu] = useState<CanvasContextMenu | null>(null);

  const handleElementContextMenu = (
    e: React.MouseEvent,
    type: "image" | "shape" | "device",
    screenshotId: string,
    id: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeScreenshotId !== screenshotId) {
      setActiveScreenshotId(screenshotId);
    }
    setSelectedElement({ type, id, screenshotId });
    setContextMenu({ x: e.clientX, y: e.clientY, type, screenshotId, id });
  };

  const buildMenuItems = (menu: CanvasContextMenu): ContextMenuItem[] => {
    const forwardIcon = <ArrowUp className="w-3.5 h-3.5" />;
    const backwardIcon = <ArrowDown className="w-3.5 h-3.5" />;
    const deleteItem: ContextMenuItem = {
      label: "Delete",
      icon: <Trash2 className="w-3.5 h-3.5" />,
      danger: true,
      onClick: () => {
        if (menu.type === "image") removeOverlayImage(menu.id);
        else if (menu.type === "shape") removeShape(menu.id);
        else removeDevice(menu.id);
      },
    };

    if (menu.type === "image") {
      return [
        { label: "Bring forward", icon: forwardIcon, onClick: () => bringImageForward(menu.id) },
        { label: "Send backward", icon: backwardIcon, onClick: () => sendImageBackward(menu.id) },
        deleteItem,
      ];
    }
    if (menu.type === "shape") {
      return [
        { label: "Bring forward", icon: forwardIcon, onClick: () => bringShapeForward(menu.id) },
        { label: "Send backward", icon: backwardIcon, onClick: () => sendShapeBackward(menu.id) },
        deleteItem,
      ];
    }
    return [
      { label: "Bring forward", icon: forwardIcon, onClick: () => bringDeviceForward(menu.id) },
      { label: "Send backward", icon: backwardIcon, onClick: () => sendDeviceBackward(menu.id) },
      {
        ...deleteItem,
        disabled: activeScreenshot.devices.length <= 1,
      },
    ];
  };

  // Track preview dimensions for export scaling
  useResizeObserver({
    elementRef: previewRef,
    onResize: setPreviewDimensions,
    deps: [activeScreenshotId],
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Toolbar
        onAddScreenshot={addScreenshot}
        screenshotCount={screenshots.length}
      />

      {/* Preview area with horizontal scroll */}
      <div
        ref={canvasContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden bg-neutral-200 dark:bg-[#0a0a0a] p-6"
      >
        <div className="flex gap-1 h-full min-w-max">
          {screenshots.map((screenshot, index) => {
            const renderableDevices = getRenderableDevicesForScreenshot(
              screenshots,
              index,
            );

            return (
              <ScreenshotCard
                key={screenshot.id}
                screenshot={screenshot}
                renderableDevices={renderableDevices}
                isActive={activeScreenshotId === screenshot.id}
                canRemove={screenshots.length > 1}
                selectedElement={selectedElement}
                exportSize={exportSize}
                headlineFontSize={headlineFontSize}
                subheadlineFontSize={subheadlineFontSize}
                previewRef={previewRef}
                getBackgroundStyle={getBackgroundStyle}
                onSelect={() => {
                  if (activeScreenshotId !== screenshot.id) {
                    setActiveScreenshotId(screenshot.id);
                    setSelectedElement(null);
                  }
                }}
                onRemove={() => removeScreenshot(screenshot.id)}
                onDeselect={() => setSelectedElement(null)}
                onElementMouseDown={handleElementMouseDown}
                onElementMouseUp={handleElementMouseUp}
                onElementContextMenu={handleElementContextMenu}
                onElementResizeStart={handleResizeStart}
              />
            );
          })}
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={buildMenuItems(contextMenu)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
