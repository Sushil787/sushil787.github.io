/**
 * ShapesSection Component
 *
 * Custom shapes management section. Add rectangles, ellipses, and triangles
 * to the background, then position, color, and style them.
 */

import { useRef } from "react";
import {
  ArrowUp,
  ArrowDown,
  X,
  Square,
  Circle,
  Triangle,
  Shapes,
} from "lucide-react";
import type {
  Screenshot,
  Shape,
  ShapeType,
  ShadowConfig,
  GradientPreset,
} from "../../types";
import { shapeOptions } from "../../constants";
import { SidebarSection } from "./SidebarSection";
import { RangeSlider } from "./RangeSlider";
import { ShadowControls } from "./ShadowControls";
import { STYLES, SLIDER_RANGES } from "./constants";
import type { SelectedElement } from "./types";

interface ShapesSectionProps {
  /** Active screenshot data */
  screenshot: Screenshot;
  /** Currently selected element */
  selectedElement: SelectedElement | null;
  /** Gradient presets for quick-pick */
  gradientPresets: GradientPreset[];
  /** Set selected element handler */
  onSelectElement: (element: SelectedElement | null) => void;
  /** Add shape handler */
  onAddShape: (type: ShapeType) => void;
  /** Add SVG shape handler */
  onAddSvg: (file: File) => void;
  /** Remove shape handler */
  onRemoveShape: (id: string) => void;
  /** Update shape handler */
  onUpdateShape: (id: string, updates: Partial<Shape>) => void;
  /** Update shape shadow handler */
  onUpdateShadow: (id: string, shadow: Partial<ShadowConfig>) => void;
  /** Bring shape forward handler */
  onBringForward: (id: string) => void;
  /** Send shape backward handler */
  onSendBackward: (id: string) => void;
}

const SHAPE_ICONS: Record<ShapeType, typeof Square> = {
  rectangle: Square,
  ellipse: Circle,
  triangle: Triangle,
  svg: Shapes,
};

/**
 * ShapesSection - Custom shapes management
 *
 * Add, remove, reorder, and configure shapes drawn on the canvas.
 *
 * @param props - Component props
 */
/** Computes the preview swatch background for a shape list item. */
const shapeSwatchBackground = (shape: Shape): string => {
  if (shape.fillMode === "gradient") {
    return `linear-gradient(135deg, ${shape.gradientFrom}, ${shape.gradientTo})`;
  }
  if (shape.fillMode === "original") {
    return "#3a3a3a";
  }
  return shape.color;
};

export const ShapesSection = ({
  screenshot,
  selectedElement,
  gradientPresets,
  onSelectElement,
  onAddShape,
  onAddSvg,
  onRemoveShape,
  onUpdateShape,
  onUpdateShadow,
  onBringForward,
  onSendBackward,
}: ShapesSectionProps) => {
  const svgInputRef = useRef<HTMLInputElement>(null);
  const shapes = screenshot.shapes ?? [];

  const handleSvgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAddSvg(file);
    e.target.value = "";
  };

  const selectedShape =
    selectedElement?.type === "shape" &&
    selectedElement.screenshotId === screenshot.id &&
    selectedElement.id
      ? shapes.find((shape) => shape.id === selectedElement.id)
      : null;

  return (
    <SidebarSection title="Shapes">
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1">
          {shapeOptions.map((option) => {
            const Icon = SHAPE_ICONS[option.type];
            return (
              <button
                key={option.type}
                onClick={() => onAddShape(option.type)}
                className={`${STYLES.uploadButton} flex flex-col items-center gap-1 py-2`}
                title={`Add ${option.label}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px]">{option.label}</span>
              </button>
            );
          })}
        </div>

        <input
          ref={svgInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          onChange={handleSvgChange}
          className="hidden"
        />
        <button
          onClick={() => svgInputRef.current?.click()}
          className={STYLES.uploadButton}
        >
          + Upload SVG
        </button>

        {shapes.length > 0 && (
          <div className="space-y-2 mt-3">
            {shapes.map((shape, index) => {
              const Icon = SHAPE_ICONS[shape.type];
              const isSelected =
                selectedElement?.type === "shape" &&
                selectedElement?.screenshotId === screenshot.id &&
                selectedElement?.id === shape.id;
              return (
                <div
                  key={shape.id}
                  onClick={() =>
                    onSelectElement({
                      type: "shape",
                      id: shape.id,
                      screenshotId: screenshot.id,
                    })
                  }
                  className={`${STYLES.overlayItem} ${
                    isSelected
                      ? STYLES.overlayItemActive
                      : STYLES.overlayItemInactive
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                    style={{ background: shapeSwatchBackground(shape) }}
                  >
                    <Icon className="w-4 h-4 text-black/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-700 dark:text-gray-300 truncate capitalize">
                      {shape.type} {index + 1}
                    </p>
                    <p className="text-[10px] text-neutral-400 dark:text-gray-500">
                      Layer {index + 1} of {shapes.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendBackward(shape.id);
                      }}
                      disabled={index === 0}
                      className={STYLES.iconButton}
                      title="Send backward"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onBringForward(shape.id);
                      }}
                      disabled={index === shapes.length - 1}
                      className={STYLES.iconButton}
                      title="Bring forward"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveShape(shape.id);
                      }}
                      className={STYLES.iconButtonDelete}
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {selectedShape && (
              <div className={STYLES.propertiesPanel}>
                <div>
                  <label className="block text-xs text-neutral-500 dark:text-gray-400 mb-1">
                    Fill
                  </label>
                  <div className="flex gap-1">
                    {selectedShape.type === "svg" && (
                      <button
                        onClick={() =>
                          onUpdateShape(selectedShape.id, {
                            fillMode: "original",
                          })
                        }
                        className={`${STYLES.modeButton} transition-colors ${
                          selectedShape.fillMode === "original"
                            ? STYLES.modeButtonActive
                            : "bg-neutral-300 dark:bg-[#333] text-neutral-700 dark:text-gray-300 hover:bg-neutral-300 dark:hover:bg-[#444]"
                        }`}
                      >
                        Original
                      </button>
                    )}
                    <button
                      onClick={() =>
                        onUpdateShape(selectedShape.id, { fillMode: "solid" })
                      }
                      className={`${STYLES.modeButton} transition-colors ${
                        selectedShape.fillMode === "solid"
                          ? STYLES.modeButtonActive
                          : "bg-neutral-300 dark:bg-[#333] text-neutral-700 dark:text-gray-300 hover:bg-neutral-300 dark:hover:bg-[#444]"
                      }`}
                    >
                      Solid
                    </button>
                    <button
                      onClick={() =>
                        onUpdateShape(selectedShape.id, { fillMode: "gradient" })
                      }
                      className={`${STYLES.modeButton} transition-colors ${
                        selectedShape.fillMode === "gradient"
                          ? STYLES.modeButtonActive
                          : "bg-neutral-300 dark:bg-[#333] text-neutral-700 dark:text-gray-300 hover:bg-neutral-300 dark:hover:bg-[#444]"
                      }`}
                    >
                      Gradient
                    </button>
                  </div>
                </div>

                {selectedShape.fillMode === "solid" && (
                  <input
                    type="color"
                    value={selectedShape.color}
                    onChange={(e) =>
                      onUpdateShape(selectedShape.id, { color: e.target.value })
                    }
                    className={STYLES.colorInput}
                  />
                )}

                {selectedShape.fillMode === "gradient" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] text-neutral-400 dark:text-gray-500 mb-1">
                          From
                        </label>
                        <input
                          type="color"
                          value={selectedShape.gradientFrom}
                          onChange={(e) =>
                            onUpdateShape(selectedShape.id, {
                              gradientFrom: e.target.value,
                            })
                          }
                          className={STYLES.colorInput}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-neutral-400 dark:text-gray-500 mb-1">
                          To
                        </label>
                        <input
                          type="color"
                          value={selectedShape.gradientTo}
                          onChange={(e) =>
                            onUpdateShape(selectedShape.id, {
                              gradientTo: e.target.value,
                            })
                          }
                          className={STYLES.colorInput}
                        />
                      </div>
                    </div>

                    <RangeSlider
                      label="Angle"
                      value={selectedShape.gradientAngle ?? 90}
                      min={0}
                      max={360}
                      unit="°"
                      onChange={(angle) =>
                        onUpdateShape(selectedShape.id, { gradientAngle: angle })
                      }
                    />

                    <div className="grid grid-cols-3 gap-1">
                      {gradientPresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() =>
                            onUpdateShape(selectedShape.id, {
                              gradientFrom: preset.from,
                              gradientTo: preset.to,
                            })
                          }
                          className={STYLES.gradientButton}
                          style={{
                            background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                          }}
                          title={preset.label}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <RangeSlider
                  label="Width"
                  value={selectedShape.width}
                  min={SLIDER_RANGES.shapeSize.min}
                  max={SLIDER_RANGES.shapeSize.max}
                  onChange={(width) => onUpdateShape(selectedShape.id, { width })}
                  showValue={false}
                />

                <RangeSlider
                  label="Height"
                  value={selectedShape.height}
                  min={SLIDER_RANGES.shapeSize.min}
                  max={SLIDER_RANGES.shapeSize.max}
                  onChange={(height) =>
                    onUpdateShape(selectedShape.id, { height })
                  }
                  showValue={false}
                />

                <RangeSlider
                  label="Opacity"
                  value={selectedShape.opacity}
                  min={SLIDER_RANGES.shapeOpacity.min}
                  max={SLIDER_RANGES.shapeOpacity.max}
                  unit="%"
                  onChange={(opacity) =>
                    onUpdateShape(selectedShape.id, { opacity })
                  }
                />

                <RangeSlider
                  label="Rotation"
                  value={selectedShape.rotation ?? 0}
                  min={SLIDER_RANGES.imageRotation.min}
                  max={SLIDER_RANGES.imageRotation.max}
                  unit="°"
                  onChange={(rotation) =>
                    onUpdateShape(selectedShape.id, { rotation })
                  }
                />

                {selectedShape.type === "rectangle" && (
                  <RangeSlider
                    label="Corner Radius"
                    value={selectedShape.cornerRadius ?? 0}
                    min={SLIDER_RANGES.shapeCornerRadius.min}
                    max={SLIDER_RANGES.shapeCornerRadius.max}
                    unit="%"
                    onChange={(cornerRadius) =>
                      onUpdateShape(selectedShape.id, { cornerRadius })
                    }
                  />
                )}

                <div>
                  <label className="block text-xs text-neutral-500 dark:text-gray-400 mb-1">
                    Layer Position
                  </label>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        onUpdateShape(selectedShape.id, { layer: "behind" })
                      }
                      className={`${STYLES.modeButton} transition-colors ${
                        selectedShape.layer === "behind"
                          ? STYLES.modeButtonActive
                          : "bg-neutral-300 dark:bg-[#333] text-neutral-700 dark:text-gray-300 hover:bg-neutral-300 dark:hover:bg-[#444]"
                      }`}
                    >
                      Behind Device
                    </button>
                    <button
                      onClick={() =>
                        onUpdateShape(selectedShape.id, { layer: "front" })
                      }
                      className={`${STYLES.modeButton} transition-colors ${
                        (selectedShape.layer ?? "front") === "front"
                          ? STYLES.modeButtonActive
                          : "bg-neutral-300 dark:bg-[#333] text-neutral-700 dark:text-gray-300 hover:bg-neutral-300 dark:hover:bg-[#444]"
                      }`}
                    >
                      In Front
                    </button>
                  </div>
                </div>

                <ShadowControls
                  shadow={selectedShape.shadow}
                  onToggle={() =>
                    onUpdateShadow(selectedShape.id, {
                      enabled: !selectedShape.shadow?.enabled,
                    })
                  }
                  onColorChange={(color) =>
                    onUpdateShadow(selectedShape.id, { color })
                  }
                  onBlurChange={(blur) =>
                    onUpdateShadow(selectedShape.id, { blur })
                  }
                  onOffsetYChange={(offsetY) =>
                    onUpdateShadow(selectedShape.id, { offsetY })
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarSection>
  );
};
