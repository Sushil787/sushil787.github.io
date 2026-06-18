/**
 * SidebarHeader Component
 *
 * Header section with app title and description.
 */

import { Moon, Sun } from "lucide-react";
import { STYLES } from "./constants";
import { useTheme } from "../../context/ThemeContext";

/**
 * SidebarHeader - App title and tagline
 *
 * Displays the application name and brief description
 * at the top of the sidebar, plus a light/dark theme toggle.
 *
 * @example
 * <SidebarHeader />
 */
export const SidebarHeader = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={STYLES.header}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold">ScreenShotEditor</h1>
          <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1">
            Create App Store and Google Play screenshots
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="shrink-0 p-2 rounded-md text-neutral-600 hover:bg-neutral-200 dark:text-gray-300 dark:hover:bg-[#2a2a2a] transition-colors"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
