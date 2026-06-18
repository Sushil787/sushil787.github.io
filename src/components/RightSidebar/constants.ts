/**
 * RightSidebar Constants
 *
 * Style constants used across RightSidebar components.
 */

/**
 * CSS classes for consistent styling
 */
export const STYLES = {
  /** Sidebar container */
  sidebar:
    "w-96 shrink-0 border-l border-black/10 dark:border-white/10 bg-white dark:bg-[#141414] overflow-y-auto",

  /** Content wrapper */
  content: "p-4 space-y-6",

  /** Section container */
  section: "rounded-lg bg-neutral-100 dark:bg-[#1e1e1e] p-3",

  /** Section title */
  sectionTitle:
    "text-xs font-medium text-neutral-700 dark:text-gray-300 uppercase tracking-wider mb-3",

  /** Section content */
  sectionContent: "space-y-3",

  /** Label text */
  label: "text-xs text-neutral-500 dark:text-gray-400",

  /** Small label text */
  labelSmall: "text-xs text-neutral-400 dark:text-gray-500",

  /** Range slider */
  rangeSlider: "w-full mt-1 accent-neutral-900 dark:accent-white",

  /** Color input */
  colorInput: "w-full h-8 rounded-md cursor-pointer",

  /** Small color input */
  colorInputSmall: "w-6 h-6 rounded cursor-pointer",

  /** Toggle button container */
  toggle: "w-8 h-4 rounded-full transition-colors",

  /** Toggle button active */
  toggleActive: "bg-blue-600 dark:bg-white",

  /** Toggle button inactive */
  toggleInactive: "bg-neutral-300 dark:bg-[#333]",

  /** Toggle knob */
  toggleKnob: "w-3 h-3 rounded-full bg-white dark:bg-black transition-transform",

  /** Toggle knob active position */
  toggleKnobActive: "translate-x-4",

  /** Toggle knob inactive position */
  toggleKnobInactive: "translate-x-0.5",

  /** Mode button */
  modeButton: "flex-1 text-xs py-1.5 rounded-md",

  /** Mode button active */
  modeButtonActive: "bg-blue-600 text-white dark:bg-white dark:text-black",

  /** Mode button inactive */
  modeButtonInactive:
    "bg-neutral-200 text-neutral-700 dark:bg-[#2a2a2a] dark:text-gray-300",

  /** Upload button */
  uploadButton:
    "w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 dark:bg-[#2a2a2a] dark:hover:bg-[#333] dark:text-gray-300 text-sm py-2 rounded-md transition-colors",

  /** Dropdown button */
  dropdownButton:
    "w-full flex items-center justify-between bg-neutral-200 hover:bg-neutral-300 text-neutral-900 dark:bg-[#2a2a2a] dark:hover:bg-[#333] dark:text-white text-sm rounded-md px-3 py-2 transition-colors border border-transparent hover:border-black/10 dark:hover:border-white/10 outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white",

  /** Gradient preset button */
  gradientButton: "h-6 rounded-md",

  /** Gradient preset active */
  gradientButtonActive: "ring-2 ring-blue-500 dark:ring-white",

  /** Overlay item */
  overlayItem: "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",

  /** Overlay item active */
  overlayItemActive:
    "bg-blue-50 ring-1 ring-blue-500 dark:bg-white/10 dark:ring-white",

  /** Overlay item inactive */
  overlayItemInactive:
    "bg-neutral-200 hover:bg-neutral-300 dark:bg-[#2a2a2a] dark:hover:bg-[#333]",

  /** Overlay thumbnail */
  overlayThumbnail: "w-10 h-10 object-cover rounded",

  /** Icon button */
  iconButton:
    "p-1 text-neutral-500 hover:text-neutral-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed",

  /** Delete icon button */
  iconButtonDelete:
    "p-1 text-neutral-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400",

  /** Properties panel */
  propertiesPanel:
    "p-3 bg-neutral-200/60 dark:bg-[#2a2a2a] rounded-lg border border-black/5 dark:border-white/5 space-y-3 mt-2",
} as const;

/**
 * Slider range configurations
 */
export const SLIDER_RANGES = {
  deviceScale: { min: 40, max: 90 },
  devicePosition: { min: 20, max: 60 },
  deviceRotation: { min: 0, max: 360 },
  headlineSize: { min: 32, max: 120 },
  subheadlineSize: { min: 20, max: 72 },
  textWidth: { min: 20, max: 120, step: 5 },
  shadowBlur: { min: 0, max: 100 },
  shadowOffset: { min: -50, max: 50 },
  imageSize: { min: 5, max: 100 },
  imageRotation: { min: 0, max: 360 },
  shapeSize: { min: 5, max: 120 },
  shapeOpacity: { min: 0, max: 100 },
  shapeCornerRadius: { min: 0, max: 50 },
  device3dRotateY: { min: -45, max: 45 },
  device3dRotateX: { min: -30, max: 30 },
} as const;
