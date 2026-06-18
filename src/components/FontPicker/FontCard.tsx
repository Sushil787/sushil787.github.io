/**
 * FontCard Component
 *
 * Individual font card displaying font name, category, and preview.
 */

import type { FontConfig } from "../../lib/google-fonts";
import { PREVIEW_TEXT } from "./constants";
import { getFontFamily } from "./utils";

interface FontCardProps {
  /** Font data */
  font: FontConfig;
  /** Whether this font is currently selected */
  isSelected: boolean;
  /** Handler for font selection */
  onSelect: () => void;
}

/**
 * FontCard - Clickable font preview card
 *
 * Displays font name, category badge, and sample text in the font.
 * Highlights when selected or hovered.
 *
 * @param props - Component props
 * @param props.font - The Google font data
 * @param props.isSelected - Whether this font is selected
 * @param props.onSelect - Handler called when card is clicked
 *
 * @example
 * <FontCard
 *   font={{ family: "Roboto", category: "sans-serif" }}
 *   isSelected={selectedFont === "Roboto"}
 *   onSelect={() => handleSelect("Roboto")}
 * />
 */
export const FontCard = ({ font, isSelected, onSelect }: FontCardProps) => (
  <button
    onClick={onSelect}
    className={`group flex flex-col p-4 rounded-lg border text-left transition-all hover:border-blue-400 dark:hover:border-white/40 hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] ${
      isSelected
        ? "border-blue-500 dark:border-white bg-blue-50 dark:bg-[#2a2a2a] ring-1 ring-blue-500 dark:ring-white"
        : "border-black/10 dark:border-white/10 bg-white dark:bg-[#141414]"
    }`}
  >
    {/* Font name and category */}
    <div className="flex items-center justify-between w-full mb-3">
      <span className="font-medium text-neutral-800 dark:text-gray-200 group-hover:text-neutral-900 dark:group-hover:text-white">
        {font.family}
      </span>
      <span className="text-xs text-neutral-400 dark:text-gray-500 font-mono border border-black/10 dark:border-white/10 px-2 py-0.5 rounded-full">
        {font.category}
      </span>
    </div>

    {/* Font preview */}
    <p
      className="text-2xl text-neutral-500 dark:text-gray-400 group-hover:text-white truncate w-full"
      style={{ fontFamily: getFontFamily(font.family, font.category) }}
    >
      {PREVIEW_TEXT}
    </p>
  </button>
);
