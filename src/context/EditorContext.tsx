import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  DeviceSpec,
  DeviceColor,
  DeviceInstance,
  ExportSize,
  Screenshot,
  ImageOverlay,
  Shape,
  ShapeType,
  ShadowConfig,
  Project,
  SelectedElement,
} from "../types";
import { devices, exportSizes, gradientPresets } from "../constants";
import { exportScreenshots } from "../lib/export-utils";
import {
  cloneDeviceInstance,
  createDeviceInstance,
  ensureDeviceInstances,
  getDeviceColorById,
  getDeviceSpecById,
} from "../lib/device-instances";
import {
  loadPersistedState,
  useEditorPersistence,
  clearPersistedState,
} from "../lib/useLocalStorage";

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

interface EditorContextType {
  // Project state
  projects: Project[];
  activeProjectId: string;
  activeProject: Project;
  createProject: (name: string) => void;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  switchProject: (id: string) => void;

  // State
  isFontPickerOpen: boolean;
  setIsFontPickerOpen: (open: boolean) => void;
  isStarModalOpen: boolean;
  setIsStarModalOpen: (open: boolean) => void;
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  selectedColorId: string;
  setSelectedColorId: (id: string) => void;
  exportSizeId: string;
  setExportSizeId: (id: string) => void;
  screenshots: Screenshot[];
  setScreenshots: (screenshots: Screenshot[]) => void;
  activeScreenshotId: string;
  setActiveScreenshotId: (id: string) => void;
  selectedElement: SelectedElement | null;
  setSelectedElement: (element: SelectedElement | null) => void;
  isDragging: boolean;
  headlineFontSize: number;
  setHeadlineFontSize: (size: number) => void;
  subheadlineFontSize: number;
  setSubheadlineFontSize: (size: number) => void;
  previewDimensions: { width: number; height: number };
  setPreviewDimensions: (dim: { width: number; height: number }) => void;

  // Refs
  previewRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  overlayImageInputRef: React.RefObject<HTMLInputElement | null>;

  // Derived
  selectedDevice: DeviceSpec;
  selectedColor: DeviceColor;
  activeScreenshot: Screenshot;
  activeDevice: DeviceInstance;
  exportSize: ExportSize;

  // Actions
  updateActiveScreenshot: (updates: Partial<Screenshot>) => void;
  addScreenshot: () => void;
  removeScreenshot: (id: string) => void;
  handleElementMouseDown: (
    e: React.MouseEvent,
    type: "headline" | "subheadline" | "image" | "shape" | "device",
    screenshotId: string,
    id?: string,
  ) => void;
  handleElementMouseMove: (e: MouseEvent) => void;
  handleElementMouseUp: () => void;
  handleResizeStart: (
    e: React.MouseEvent,
    type: "headline" | "subheadline" | "image" | "shape" | "device",
    screenshotId: string,
    id?: string,
  ) => void;
  addOverlayImage: (file: File) => void;
  removeOverlayImage: (imageId: string) => void;
  updateOverlayImageSize: (imageId: string, widthPercent: number) => void;
  updateOverlayImageLayer: (imageId: string, layer: "behind" | "front") => void;
  updateOverlayImageRotation: (imageId: string, rotation: number) => void;
  updateOverlayImageShadow: (
    imageId: string,
    shadow: Partial<ShadowConfig>,
  ) => void;
  addShape: (type: ShapeType) => void;
  addSvgShape: (file: File) => void;
  removeShape: (shapeId: string) => void;
  updateShape: (shapeId: string, updates: Partial<Shape>) => void;
  updateShapeShadow: (shapeId: string, shadow: Partial<ShadowConfig>) => void;
  bringShapeForward: (shapeId: string) => void;
  sendShapeBackward: (shapeId: string) => void;
  addDevice: () => void;
  selectDevice: (deviceId: string) => void;
  removeDevice: (deviceId: string) => void;
  bringDeviceForward: (deviceId: string) => void;
  sendDeviceBackward: (deviceId: string) => void;
  bringImageForward: (imageId: string) => void;
  sendImageBackward: (imageId: string) => void;
  bringImageToFront: (imageId: string) => void;
  sendImageToBack: (imageId: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleExport: () => void;
  getBackgroundStyle: (screenshot: Screenshot) => string;
  resetEditor: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

type LegacyScreenshotFields = {
  screenshotSrc?: string | null;
  deviceScale?: number;
  deviceOffsetY?: number;
  deviceRotation?: number;
  deviceShadow?: ShadowConfig;
  deviceStyle?: "flat" | "3d";
  device3dRotateY?: number;
  device3dRotateX?: number;
};

// Default screenshot for new editors
const createDefaultScreenshot = (
  defaultDeviceId: string = devices[0].id,
  defaultColorId: string = devices[0].colors[0].id,
): Screenshot => {
  const defaultDevice = createDeviceInstance({
    deviceId: defaultDeviceId,
    colorId: defaultColorId,
  });

  return {
    id: generateId(),
    headline: "Showcase Your App",
    subheadline:
      "Create stunning App Store screenshots in minutes. Customizable templates, devices, and backgrounds.",
    backgroundColor: "#8b5cf6",
    backgroundMode: "solid",
    gradientPresetId: null,
    textColor: "#ffffff",
    headlineX: 50,
    headlineY: 10,
    headlineWidth: 80,
    subheadlineX: 50,
    subheadlineY: 18,
    subheadlineWidth: 80,
    fontFamily: "Inter",
    overlayImages: [],
    shapes: [],
    devices: [defaultDevice],
    activeDeviceId: defaultDevice.id,
  };
};

const normalizeShape = (shape: Partial<Shape>): Shape => ({
  id: shape.id ?? generateId(),
  type: shape.type ?? "rectangle",
  src: shape.src,
  x: shape.x ?? 50,
  y: shape.y ?? 50,
  width: shape.width ?? 30,
  height: shape.height ?? 30,
  fillMode: shape.fillMode ?? (shape.type === "svg" ? "original" : "solid"),
  color: shape.color ?? "#ffffff",
  gradientFrom: shape.gradientFrom ?? "#8b5cf6",
  gradientTo: shape.gradientTo ?? "#ec4899",
  gradientAngle: shape.gradientAngle ?? 90,
  opacity: shape.opacity ?? 100,
  cornerRadius: shape.cornerRadius ?? 0,
  layer: shape.layer ?? "behind",
  rotation: shape.rotation ?? 0,
  shadow: shape.shadow ?? {
    enabled: false,
    color: "#000000",
    blur: 20,
    offsetX: 0,
    offsetY: 10,
  },
});

const normalizeScreenshot = (
  screenshot: Partial<Screenshot> & LegacyScreenshotFields,
  fallbackDeviceId: string,
  fallbackColorId: string,
): Screenshot => {
  const {
    screenshotSrc: _legacyScreenshotSrc,
    deviceScale: _legacyDeviceScale,
    deviceOffsetY: _legacyDeviceOffsetY,
    deviceRotation: _legacyDeviceRotation,
    deviceShadow: _legacyDeviceShadow,
    deviceStyle: _legacyDeviceStyle,
    device3dRotateY: _legacyDevice3dRotateY,
    device3dRotateX: _legacyDevice3dRotateX,
    ...rest
  } = screenshot;
  const baseScreenshot = createDefaultScreenshot(fallbackDeviceId, fallbackColorId);
  const { devices: deviceInstances, activeDeviceId } = ensureDeviceInstances(
    screenshot,
    fallbackDeviceId,
    fallbackColorId,
  );

  return {
    ...baseScreenshot,
    ...rest,
    overlayImages: screenshot.overlayImages ?? [],
    shapes: (screenshot.shapes ?? []).map(normalizeShape),
    devices: deviceInstances,
    activeDeviceId,
  };
};

const normalizeProject = (project: Project): Project => {
  const fallbackDeviceId = project.selectedDeviceId ?? devices[0].id;
  const fallbackColorId =
    project.selectedColorId ?? getDeviceSpecById(fallbackDeviceId).colors[0].id;
  const normalizedScreenshots = project.screenshots.map((screenshot) =>
    normalizeScreenshot(screenshot, fallbackDeviceId, fallbackColorId),
  );

  return {
    ...project,
    selectedDeviceId: fallbackDeviceId,
    selectedColorId: fallbackColorId,
    screenshots: normalizedScreenshots,
    activeScreenshotId:
      normalizedScreenshots.find((s) => s.id === project.activeScreenshotId)?.id ??
      normalizedScreenshots[0].id,
  };
};

// Create a default project
const createDefaultProject = (name: string = "My Project"): Project => {
  const defaultDeviceId = devices[0].id;
  const defaultColorId = devices[0].colors[0].id;
  const defaultScreenshot = createDefaultScreenshot(defaultDeviceId, defaultColorId);
  return {
    id: generateId(),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    screenshots: [defaultScreenshot],
    selectedDeviceId: defaultDeviceId,
    selectedColorId: defaultColorId,
    exportSizeId: exportSizes[0].id,
    activeScreenshotId: defaultScreenshot.id,
    headlineFontSize: 72,
    subheadlineFontSize: 42,
  };
};

// Load persisted state once on module load
const persistedState = loadPersistedState();

// Initialize projects from persisted state or create default
const getInitialProjects = (): Project[] => {
  if (persistedState?.projects && persistedState.projects.length > 0) {
    return persistedState.projects.map(normalizeProject);
  }
  return [createDefaultProject()];
};

const getInitialActiveProjectId = (projects: Project[]): string => {
  if (persistedState?.activeProjectId) {
    // Verify the project exists
    const exists = projects.some((p) => p.id === persistedState.activeProjectId);
    if (exists) return persistedState.activeProjectId;
  }
  return projects[0]?.id || generateId();
};

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  // Project state
  const [projects, setProjects] = useState<Project[]>(getInitialProjects);
  const [activeProjectId, setActiveProjectId] = useState(() =>
    getInitialActiveProjectId(projects),
  );

  // Get active project
  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0];

  // Initialize state from persisted values or defaults
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);
  const [isStarModalOpen, setIsStarModalOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceIdState] = useState(
    activeProject.selectedDeviceId,
  );
  const [selectedColorId, setSelectedColorIdState] = useState(
    activeProject.selectedColorId,
  );
  const [exportSizeId, setExportSizeIdState] = useState(
    activeProject.exportSizeId,
  );
  const [screenshots, setScreenshotsState] = useState<Screenshot[]>(
    activeProject.screenshots,
  );
  const [activeScreenshotId, setActiveScreenshotIdState] = useState(
    activeProject.activeScreenshotId,
  );
  const [headlineFontSize, setHeadlineFontSizeState] = useState(
    activeProject.headlineFontSize,
  );
  const [subheadlineFontSize, setSubheadlineFontSizeState] = useState(
    activeProject.subheadlineFontSize,
  );

  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(
    null,
  );

  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartElementPos = useRef({ x: 0, y: 0 });
  const dragContainerSize = useRef({ width: 0, height: 0 });
  const rafId = useRef<number | null>(null);
  const pendingUpdate = useRef<{ x: number; y: number } | null>(null);

  const overlayImageInputRef = useRef<HTMLInputElement>(null);

  const [previewDimensions, setPreviewDimensions] = useState({
    width: 0,
    height: 0,
  });

  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Sync project state when local state changes
  const updateProjectState = useCallback(() => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              screenshots,
              selectedDeviceId,
              selectedColorId,
              exportSizeId,
              activeScreenshotId,
              headlineFontSize,
              subheadlineFontSize,
              updatedAt: Date.now(),
            }
          : p,
      ),
    );
  }, [
    activeProjectId,
    screenshots,
    selectedDeviceId,
    selectedColorId,
    exportSizeId,
    activeScreenshotId,
    headlineFontSize,
    subheadlineFontSize,
  ]);

  // Update project whenever state changes
  useEffect(() => {
    updateProjectState();
  }, [updateProjectState]);

  // Auto-save projects to localStorage
  useEditorPersistence({
    projects,
    activeProjectId,
  });

  // Wrapper functions that update both local state and project
  const setSelectedDeviceId = (id: string) => {
    setSelectedDeviceIdState(id);
    const nextColorId = getDeviceColorById(id, selectedColorId).id;
    setSelectedColorIdState(nextColorId);
    setScreenshotsState((prev) =>
      prev.map((screenshot) =>
        screenshot.id === activeScreenshotId
          ? {
              ...screenshot,
              devices: screenshot.devices.map((device) =>
                device.id === screenshot.activeDeviceId
                  ? { ...device, deviceId: id, colorId: nextColorId }
                  : device,
              ),
            }
          : screenshot,
      ),
    );
  };
  const setSelectedColorId = (id: string) => {
    setSelectedColorIdState(id);
    setScreenshotsState((prev) =>
      prev.map((screenshot) =>
        screenshot.id === activeScreenshotId
          ? {
              ...screenshot,
              devices: screenshot.devices.map((device) =>
                device.id === screenshot.activeDeviceId
                  ? { ...device, colorId: id }
                  : device,
              ),
            }
          : screenshot,
      ),
    );
  };
  const setExportSizeId = (id: string) => {
    setExportSizeIdState(id);
  };
  const setScreenshots = (newScreenshots: Screenshot[]) => {
    setScreenshotsState(newScreenshots);
  };
  const setActiveScreenshotId = (id: string) => {
    setActiveScreenshotIdState(id);
  };
  const setHeadlineFontSize = (size: number) => {
    setHeadlineFontSizeState(size);
  };
  const setSubheadlineFontSize = (size: number) => {
    setSubheadlineFontSizeState(size);
  };

  // Project management functions
  const createProject = (name: string) => {
    const newProject = createDefaultProject(name);
    setProjects((prev) => [...prev, newProject]);
    switchProject(newProject.id);
  };

  const renameProject = (id: string, name: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, name, updatedAt: Date.now() } : p,
      ),
    );
  };

  const deleteProject = (id: string) => {
    // Don't delete the last project
    if (projects.length <= 1) return;

    setProjects((prev) => prev.filter((p) => p.id !== id));

    // If deleting active project, switch to another
    if (id === activeProjectId) {
      const remaining = projects.filter((p) => p.id !== id);
      if (remaining.length > 0) {
        switchProject(remaining[0].id);
      }
    }
  };

  const switchProject = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;

    setActiveProjectId(id);
    setSelectedDeviceIdState(project.selectedDeviceId);
    setSelectedColorIdState(project.selectedColorId);
    setExportSizeIdState(project.exportSizeId);
    setScreenshotsState(project.screenshots);
    setActiveScreenshotIdState(project.activeScreenshotId);
    setHeadlineFontSizeState(project.headlineFontSize);
    setSubheadlineFontSizeState(project.subheadlineFontSize);
    setSelectedElement(null);
  };

  const selectedDevice =
    getDeviceSpecById(selectedDeviceId);
  const selectedColor =
    getDeviceColorById(selectedDevice.id, selectedColorId);
  const activeScreenshot =
    screenshots.find((s) => s.id === activeScreenshotId) || screenshots[0];
  const activeDevice =
    activeScreenshot.devices.find(
      (device) => device.id === activeScreenshot.activeDeviceId,
    ) || activeScreenshot.devices[0];
  const exportSize =
    exportSizes.find((s) => s.id === exportSizeId) || exportSizes[0];

  const updateScreenshotById = useCallback(
    (screenshotId: string, updates: Partial<Screenshot>) => {
      setScreenshotsState((prev) =>
        prev.map((s) => (s.id === screenshotId ? { ...s, ...updates } : s)),
      );
    },
    [],
  );

  const updateActiveScreenshot = useCallback(
    (updates: Partial<Screenshot>) => {
      updateScreenshotById(activeScreenshotId, updates);
    },
    [activeScreenshotId, updateScreenshotById],
  );

  useEffect(() => {
    if (!activeDevice) return;
    if (selectedDeviceId !== activeDevice.deviceId) {
      setSelectedDeviceIdState(activeDevice.deviceId);
    }
    if (selectedColorId !== activeDevice.colorId) {
      setSelectedColorIdState(activeDevice.colorId);
    }
    if (activeScreenshot.activeDeviceId !== activeDevice.id) {
      updateActiveScreenshot({ activeDeviceId: activeDevice.id });
    }
  }, [
    activeDevice,
    activeScreenshot.activeDeviceId,
    selectedColorId,
    selectedDeviceId,
    updateActiveScreenshot,
  ]);

  const addScreenshot = () => {
    const newScreenshot: Screenshot = {
      id: generateId(),
      headline: "New Screenshot",
      subheadline: "Add your description here",
      backgroundColor: activeScreenshot.backgroundColor,
      backgroundMode: activeScreenshot.backgroundMode,
      gradientPresetId: activeScreenshot.gradientPresetId,
      textColor: activeScreenshot.textColor,
      headlineX: 50,
      headlineY: 10,
      headlineWidth: 80,
      subheadlineX: 50,
      subheadlineY: 18,
      subheadlineWidth: 80,
      fontFamily: activeScreenshot.fontFamily,
      overlayImages: [],
      shapes: [],
      devices: activeScreenshot.devices.map((device) =>
        cloneDeviceInstance(device, { id: generateId() }),
      ),
      activeDeviceId: activeScreenshot.devices[0]?.id ?? generateId(),
    };
    newScreenshot.activeDeviceId = newScreenshot.devices[0].id;
    setScreenshots([...screenshots, newScreenshot]);
    setActiveScreenshotId(newScreenshot.id);
  };

  const handleElementMouseDown = (
    e: React.MouseEvent,
    type: "headline" | "subheadline" | "image" | "shape" | "device",
    screenshotId: string,
    id?: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const screenshotElement = (e.currentTarget as HTMLElement).closest(
      "[data-screenshot-card='true']",
    );
    if (screenshotElement instanceof HTMLElement) {
      const rect = screenshotElement.getBoundingClientRect();
      dragContainerSize.current = { width: rect.width, height: rect.height };
    } else if (previewRef.current) {
      const rect = previewRef.current.getBoundingClientRect();
      dragContainerSize.current = { width: rect.width, height: rect.height };
    }

    const targetScreenshot =
      screenshots.find((screenshot) => screenshot.id === screenshotId) ??
      activeScreenshot;

    setIsDragging(true);
    setSelectedElement({ type, id, screenshotId });
    if (activeScreenshotId !== screenshotId) {
      setActiveScreenshotIdState(screenshotId);
    }
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    if (type === "device" && id) {
      updateScreenshotById(screenshotId, { activeDeviceId: id });
      const device = targetScreenshot.devices.find((item) => item.id === id);
      if (device) {
        dragStartElementPos.current = { x: device.x, y: device.y };
      }
    } else if (type === "headline") {
      dragStartElementPos.current = {
        x: targetScreenshot.headlineX,
        y: targetScreenshot.headlineY,
      };
    } else if (type === "subheadline") {
      dragStartElementPos.current = {
        x: targetScreenshot.subheadlineX,
        y: targetScreenshot.subheadlineY,
      };
    } else if (type === "image" && id) {
      const image = targetScreenshot.overlayImages.find((img) => img.id === id);
      if (image) {
        dragStartElementPos.current = { x: image.x, y: image.y };
      }
    } else if (type === "shape" && id) {
      const shape = targetScreenshot.shapes.find((item) => item.id === id);
      if (shape) {
        dragStartElementPos.current = { x: shape.x, y: shape.y };
      }
    }
  };

  const applyDragUpdate = useCallback(() => {
    if (!pendingUpdate.current || !selectedElement) return;

    const { x: newX, y: newY } = pendingUpdate.current;

    if (selectedElement.type === "headline") {
      updateScreenshotById(selectedElement.screenshotId, {
        headlineX: newX,
        headlineY: newY,
      });
    } else if (selectedElement.type === "subheadline") {
      updateScreenshotById(selectedElement.screenshotId, {
        subheadlineX: newX,
        subheadlineY: newY,
      });
    } else if (selectedElement.type === "image" && selectedElement.id) {
      const targetScreenshot = screenshots.find(
        (screenshot) => screenshot.id === selectedElement.screenshotId,
      );
      if (!targetScreenshot) return;

      const updatedImages = targetScreenshot.overlayImages.map((img) =>
        img.id === selectedElement.id ? { ...img, x: newX, y: newY } : img,
      );
      updateScreenshotById(selectedElement.screenshotId, {
        overlayImages: updatedImages,
      });
    } else if (selectedElement.type === "shape" && selectedElement.id) {
      const targetScreenshot = screenshots.find(
        (screenshot) => screenshot.id === selectedElement.screenshotId,
      );
      if (!targetScreenshot) return;

      const updatedShapes = targetScreenshot.shapes.map((shape) =>
        shape.id === selectedElement.id ? { ...shape, x: newX, y: newY } : shape,
      );
      updateScreenshotById(selectedElement.screenshotId, {
        shapes: updatedShapes,
      });
    } else if (selectedElement.type === "device" && selectedElement.id) {
      const targetScreenshot = screenshots.find(
        (screenshot) => screenshot.id === selectedElement.screenshotId,
      );
      if (!targetScreenshot) return;

      const updatedDevices = targetScreenshot.devices.map((device) =>
        device.id === selectedElement.id ? { ...device, x: newX, y: newY } : device,
      );
      updateScreenshotById(selectedElement.screenshotId, {
        devices: updatedDevices,
      });
    }

    pendingUpdate.current = null;
    rafId.current = null;
  }, [screenshots, selectedElement, updateScreenshotById]);

  const handleElementMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !selectedElement) return;

      const { width, height } = dragContainerSize.current;
      if (width === 0 || height === 0) return;

      const deltaX = ((e.clientX - dragStartPos.current.x) / width) * 100;
      const deltaY = ((e.clientY - dragStartPos.current.y) / height) * 100;

      const newX = dragStartElementPos.current.x + deltaX;
      const newY = dragStartElementPos.current.y + deltaY;

      pendingUpdate.current = { x: newX, y: newY };

      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(applyDragUpdate);
      }
    },
    [isDragging, selectedElement, applyDragUpdate],
  );

  const handleElementMouseUp = useCallback(() => {
    setIsDragging(false);
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (pendingUpdate.current) {
      applyDragUpdate();
    }
  }, [applyDragUpdate]);

  // Set up global mouse listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleElementMouseMove);
      window.addEventListener("mouseup", handleElementMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleElementMouseMove);
      window.removeEventListener("mouseup", handleElementMouseUp);
    };
  }, [isDragging, handleElementMouseMove, handleElementMouseUp]);

  // --- Corner-handle resize (scale) ---------------------------------------
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{
    type: "headline" | "subheadline" | "image" | "shape" | "device";
    screenshotId: string;
    id?: string;
    centerX: number;
    centerY: number;
    startDist: number;
    startWidth: number;
    startHeight: number;
    startScale: number;
    startFontSize: number;
  } | null>(null);
  const resizePending = useRef<number | null>(null);
  const resizeRaf = useRef<number | null>(null);

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const handleResizeStart = (
    e: React.MouseEvent,
    type: "headline" | "subheadline" | "image" | "shape" | "device",
    screenshotId: string,
    id?: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const elementNode = (e.currentTarget as HTMLElement).closest(
      "[data-draggable-element]",
    );
    if (!(elementNode instanceof HTMLElement)) return;
    const rect = elementNode.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startDist = Math.max(
      1,
      Math.hypot(e.clientX - centerX, e.clientY - centerY),
    );

    const targetScreenshot =
      screenshots.find((screenshot) => screenshot.id === screenshotId) ??
      activeScreenshot;

    let startWidth = 0;
    let startHeight = 0;
    let startScale = 0;
    let startFontSize = 0;

    if (type === "image" && id) {
      const image = targetScreenshot.overlayImages.find((img) => img.id === id);
      if (!image) return;
      startWidth = image.width;
      startHeight = image.height;
    } else if (type === "shape" && id) {
      const shape = targetScreenshot.shapes.find((item) => item.id === id);
      if (!shape) return;
      startWidth = shape.width;
      startHeight = shape.height;
    } else if (type === "device" && id) {
      const device = targetScreenshot.devices.find((item) => item.id === id);
      if (!device) return;
      startScale = device.scale;
    } else if (type === "headline") {
      startFontSize = headlineFontSize;
    } else if (type === "subheadline") {
      startFontSize = subheadlineFontSize;
    }

    if (activeScreenshotId !== screenshotId) {
      setActiveScreenshotIdState(screenshotId);
    }
    setSelectedElement({ type, id, screenshotId });
    resizeRef.current = {
      type,
      screenshotId,
      id,
      centerX,
      centerY,
      startDist,
      startWidth,
      startHeight,
      startScale,
      startFontSize,
    };
    setIsResizing(true);
  };

  const applyResizeUpdate = useCallback(() => {
    const data = resizeRef.current;
    if (data === null || resizePending.current === null) return;
    const scale = resizePending.current;

    if (data.type === "image" && data.id) {
      updateScreenshotById(data.screenshotId, {
        overlayImages: (
          screenshots.find((s) => s.id === data.screenshotId)?.overlayImages ??
          []
        ).map((img) =>
          img.id === data.id
            ? {
                ...img,
                width: clamp(data.startWidth * scale, 3, 200),
                height: data.startHeight * scale,
              }
            : img,
        ),
      });
    } else if (data.type === "shape" && data.id) {
      updateScreenshotById(data.screenshotId, {
        shapes: (
          screenshots.find((s) => s.id === data.screenshotId)?.shapes ?? []
        ).map((shape) =>
          shape.id === data.id
            ? {
                ...shape,
                width: clamp(data.startWidth * scale, 3, 200),
                height: clamp(data.startHeight * scale, 3, 200),
              }
            : shape,
        ),
      });
    } else if (data.type === "device" && data.id) {
      updateScreenshotById(data.screenshotId, {
        devices: (
          screenshots.find((s) => s.id === data.screenshotId)?.devices ?? []
        ).map((device) =>
          device.id === data.id
            ? { ...device, scale: clamp(data.startScale * scale, 15, 130) }
            : device,
        ),
      });
    } else if (data.type === "headline") {
      setHeadlineFontSize(Math.round(clamp(data.startFontSize * scale, 16, 220)));
    } else if (data.type === "subheadline") {
      setSubheadlineFontSize(
        Math.round(clamp(data.startFontSize * scale, 12, 200)),
      );
    }

    resizePending.current = null;
    resizeRaf.current = null;
  }, [screenshots, updateScreenshotById]);

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      const data = resizeRef.current;
      if (!data) return;
      const dist = Math.hypot(e.clientX - data.centerX, e.clientY - data.centerY);
      resizePending.current = dist / data.startDist;
      if (resizeRaf.current === null) {
        resizeRaf.current = requestAnimationFrame(applyResizeUpdate);
      }
    },
    [applyResizeUpdate],
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    if (resizeRaf.current !== null) {
      cancelAnimationFrame(resizeRaf.current);
      resizeRaf.current = null;
    }
    if (resizePending.current !== null) {
      applyResizeUpdate();
    }
    resizeRef.current = null;
  }, [applyResizeUpdate]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const addOverlayImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          const newImage: ImageOverlay = {
            id: generateId(),
            src: result,
            x: 50,
            y: 50,
            width: 30,
            height: 30 / aspectRatio,
            layer: "front",
            rotation: 0,
            shadow: {
              enabled: false,
              color: "#000000",
              blur: 20,
              offsetX: 0,
              offsetY: 10,
            },
          };
          updateActiveScreenshot({
            overlayImages: [...activeScreenshot.overlayImages, newImage],
          });
          setSelectedElement({
            type: "image",
            id: newImage.id,
            screenshotId: activeScreenshot.id,
          });
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  const removeOverlayImage = (imageId: string) => {
    const updatedImages = activeScreenshot.overlayImages.filter(
      (img) => img.id !== imageId,
    );
    updateActiveScreenshot({ overlayImages: updatedImages });
    if (
      selectedElement?.type === "image" &&
      selectedElement.screenshotId === activeScreenshot.id &&
      selectedElement.id === imageId
    ) {
      setSelectedElement(null);
    }
  };

  const updateOverlayImageSize = (imageId: string, widthPercent: number) => {
    const image = activeScreenshot.overlayImages.find(
      (img) => img.id === imageId,
    );
    if (!image) return;

    // Use current dimensions to maintain aspect ratio without reloading image
    const aspectRatio = image.width / image.height;

    const updatedImages = activeScreenshot.overlayImages.map((item) =>
      item.id === imageId
        ? {
            ...item,
            width: widthPercent,
            height: widthPercent / aspectRatio,
          }
        : item,
    );
    updateActiveScreenshot({ overlayImages: updatedImages });
  };

  const updateOverlayImageLayer = (
    imageId: string,
    layer: "behind" | "front",
  ) => {
    const updatedImages = activeScreenshot.overlayImages.map((item) =>
      item.id === imageId ? { ...item, layer } : item,
    );
    updateActiveScreenshot({ overlayImages: updatedImages });
  };

  const updateOverlayImageRotation = (imageId: string, rotation: number) => {
    const updatedImages = activeScreenshot.overlayImages.map((item) =>
      item.id === imageId ? { ...item, rotation } : item,
    );
    updateActiveScreenshot({ overlayImages: updatedImages });
  };

  const updateOverlayImageShadow = (
    imageId: string,
    shadow: Partial<ShadowConfig>,
  ) => {
    const updatedImages = activeScreenshot.overlayImages.map((item) =>
      item.id === imageId
        ? { ...item, shadow: { ...item.shadow, ...shadow } }
        : item,
    );
    updateActiveScreenshot({ overlayImages: updatedImages });
  };

  // Reorder an overlay image relative to its visible peers. Like shapes, images
  // render in two groups (behind vs. in front of the device), so we swap with
  // the nearest neighbor in the same layer rather than the raw array neighbor.
  const reorderImageWithinLayer = (imageId: string, direction: 1 | -1) => {
    const images = [...activeScreenshot.overlayImages];
    const index = images.findIndex((img) => img.id === imageId);
    if (index === -1) return;
    const isBehind = (img: ImageOverlay) => img.layer === "behind";
    let target = -1;
    for (let i = index + direction; i >= 0 && i < images.length; i += direction) {
      if (isBehind(images[i]) === isBehind(images[index])) {
        target = i;
        break;
      }
    }
    if (target === -1) return;
    [images[index], images[target]] = [images[target], images[index]];
    updateActiveScreenshot({ overlayImages: images });
  };

  const bringImageForward = (imageId: string) =>
    reorderImageWithinLayer(imageId, 1);

  const sendImageBackward = (imageId: string) =>
    reorderImageWithinLayer(imageId, -1);

  const bringImageToFront = (imageId: string) => {
    const images = [...activeScreenshot.overlayImages];
    const index = images.findIndex((img) => img.id === imageId);
    if (index !== -1 && index < images.length - 1) {
      const [image] = images.splice(index, 1);
      images.push(image);
      updateActiveScreenshot({ overlayImages: images });
    }
  };

  const sendImageToBack = (imageId: string) => {
    const images = [...activeScreenshot.overlayImages];
    const index = images.findIndex((img) => img.id === imageId);
    if (index > 0) {
      const [image] = images.splice(index, 1);
      images.unshift(image);
      updateActiveScreenshot({ overlayImages: images });
    }
  };

  const addShape = (type: ShapeType) => {
    // Cascade each new shape so multiple shapes don't stack on the exact same
    // spot (which would hide reordering and make them look like one shape).
    const cascade = (activeScreenshot.shapes.length % 6) * 4;
    const newShape: Shape = {
      id: generateId(),
      type,
      x: 50 + cascade,
      y: 50 + cascade,
      width: 30,
      height: 30,
      fillMode: "solid",
      color: "#3b82f6",
      gradientFrom: "#3b82f6",
      gradientTo: "#06b6d4",
      gradientAngle: 90,
      opacity: 100,
      cornerRadius: type === "rectangle" ? 8 : 0,
      layer: "front",
      rotation: 0,
      shadow: {
        enabled: false,
        color: "#000000",
        blur: 20,
        offsetX: 0,
        offsetY: 10,
      },
    };
    updateActiveScreenshot({
      shapes: [...activeScreenshot.shapes, newShape],
    });
    setSelectedElement({
      type: "shape",
      id: newShape.id,
      screenshotId: activeScreenshot.id,
    });
  };

  const addSvgShape = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return;
      const cascade = (activeScreenshot.shapes.length % 6) * 4;
      const newShape: Shape = {
        id: generateId(),
        type: "svg",
        src: result,
        x: 50 + cascade,
        y: 50 + cascade,
        width: 30,
        height: 30,
        fillMode: "original",
        color: "#3b82f6",
        gradientFrom: "#3b82f6",
        gradientTo: "#06b6d4",
        gradientAngle: 90,
        opacity: 100,
        cornerRadius: 0,
        layer: "front",
        rotation: 0,
        shadow: {
          enabled: false,
          color: "#000000",
          blur: 20,
          offsetX: 0,
          offsetY: 10,
        },
      };
      updateActiveScreenshot({
        shapes: [...activeScreenshot.shapes, newShape],
      });
      setSelectedElement({
        type: "shape",
        id: newShape.id,
        screenshotId: activeScreenshot.id,
      });
    };
    reader.readAsText(file);
  };

  const removeShape = (shapeId: string) => {
    updateActiveScreenshot({
      shapes: activeScreenshot.shapes.filter((shape) => shape.id !== shapeId),
    });
    if (
      selectedElement?.type === "shape" &&
      selectedElement.screenshotId === activeScreenshot.id &&
      selectedElement.id === shapeId
    ) {
      setSelectedElement(null);
    }
  };

  const updateShape = (shapeId: string, updates: Partial<Shape>) => {
    updateActiveScreenshot({
      shapes: activeScreenshot.shapes.map((shape) =>
        shape.id === shapeId ? { ...shape, ...updates } : shape,
      ),
    });
  };

  const updateShapeShadow = (
    shapeId: string,
    shadow: Partial<ShadowConfig>,
  ) => {
    updateActiveScreenshot({
      shapes: activeScreenshot.shapes.map((shape) =>
        shape.id === shapeId
          ? { ...shape, shadow: { ...shape.shadow, ...shadow } }
          : shape,
      ),
    });
  };

  // Reorder a shape through one continuous stacking order that crosses the
  // device. Shapes render in two groups (behind vs. in front of the device);
  // we treat [behind..., front...] as the full bottom-to-top order. Moving past
  // the top of the behind group flips the shape to the front of the device (and
  // vice versa), so the arrows actually move shapes to the foreground/background.
  const reorderShape = (shapeId: string, direction: 1 | -1) => {
    const all = activeScreenshot.shapes;
    const isBehind = (shape: Shape) => shape.layer === "behind";
    const behind = all.filter(isBehind);
    const front = all.filter((shape) => !isBehind(shape));
    const ordered = [...behind, ...front];

    const pos = ordered.findIndex((shape) => shape.id === shapeId);
    if (pos === -1) return;
    const next = pos + direction;
    if (next < 0 || next >= ordered.length) return; // already at the extreme

    const moving = ordered[pos];
    const neighbor = ordered[next];

    if (isBehind(moving) === isBehind(neighbor)) {
      // Same side of the device: swap their stacking positions.
      [ordered[pos], ordered[next]] = [ordered[next], ordered[pos]];
      updateActiveScreenshot({ shapes: ordered });
      return;
    }

    // Crossing the device boundary: flip which side this shape sits on.
    ordered[pos] = {
      ...moving,
      layer: isBehind(moving) ? "front" : "behind",
    };
    const reBehind = ordered.filter(isBehind);
    const reFront = ordered.filter((shape) => !isBehind(shape));
    updateActiveScreenshot({ shapes: [...reBehind, ...reFront] });
  };

  const bringShapeForward = (shapeId: string) => reorderShape(shapeId, 1);

  const sendShapeBackward = (shapeId: string) => reorderShape(shapeId, -1);

  const addDevice = () => {
    const nextDevice = activeDevice
      ? cloneDeviceInstance(activeDevice, {
          id: generateId(),
          x: Math.min(activeDevice.x + 12, 88),
          y: Math.min(activeDevice.y + 4, 70),
        })
      : createDeviceInstance({
          deviceId: selectedDeviceId,
          colorId: selectedColorId,
        });

    updateActiveScreenshot({
      devices: [...activeScreenshot.devices, nextDevice],
      activeDeviceId: nextDevice.id,
    });
    setSelectedElement({
      type: "device",
      id: nextDevice.id,
      screenshotId: activeScreenshot.id,
    });
    setSelectedDeviceIdState(nextDevice.deviceId);
    setSelectedColorIdState(nextDevice.colorId);
  };

  const selectDevice = (deviceId: string) => {
    updateActiveScreenshot({ activeDeviceId: deviceId });
    setSelectedElement({
      type: "device",
      id: deviceId,
      screenshotId: activeScreenshot.id,
    });
  };

  const removeDevice = (deviceId: string) => {
    if (activeScreenshot.devices.length <= 1) return;

    const nextDevices = activeScreenshot.devices.filter(
      (device) => device.id !== deviceId,
    );
    const nextActiveDeviceId =
      activeScreenshot.activeDeviceId === deviceId
        ? nextDevices[Math.max(0, nextDevices.length - 1)].id
        : activeScreenshot.activeDeviceId;

    updateActiveScreenshot({
      devices: nextDevices,
      activeDeviceId: nextActiveDeviceId,
    });

    if (
      selectedElement?.type === "device" &&
      selectedElement.screenshotId === activeScreenshot.id &&
      selectedElement.id === deviceId
    ) {
      setSelectedElement({
        type: "device",
        id: nextActiveDeviceId,
        screenshotId: activeScreenshot.id,
      });
    }
  };

  const bringDeviceForward = (deviceId: string) => {
    const nextDevices = [...activeScreenshot.devices];
    const index = nextDevices.findIndex((device) => device.id === deviceId);
    if (index !== -1 && index < nextDevices.length - 1) {
      const temp = nextDevices[index];
      nextDevices[index] = nextDevices[index + 1];
      nextDevices[index + 1] = temp;
      updateActiveScreenshot({ devices: nextDevices });
    }
  };

  const sendDeviceBackward = (deviceId: string) => {
    const nextDevices = [...activeScreenshot.devices];
    const index = nextDevices.findIndex((device) => device.id === deviceId);
    if (index > 0) {
      const temp = nextDevices[index];
      nextDevices[index] = nextDevices[index - 1];
      nextDevices[index - 1] = temp;
      updateActiveScreenshot({ devices: nextDevices });
    }
  };

  const removeScreenshot = (id: string) => {
    if (screenshots.length <= 1) return;
    const newScreenshots = screenshots.filter((s) => s.id !== id);
    setScreenshots(newScreenshots);
    if (activeScreenshotId === id) {
      setActiveScreenshotId(newScreenshots[0].id);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        updateActiveScreenshot({
          devices: activeScreenshot.devices.map((device) =>
            device.id === activeDevice.id
              ? { ...device, screenshotSrc: result }
              : device,
          ),
        });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const getBackgroundStyle = (screenshot: Screenshot) => {
    if (screenshot.backgroundMode === "gradient") {
      const preset =
        gradientPresets.find((p) => p.id === screenshot.gradientPresetId) ??
        gradientPresets[0];
      return `linear-gradient(180deg, ${preset.from}, ${preset.to})`;
    }
    return screenshot.backgroundColor;
  };

  const handleExport = () => {
    void exportScreenshots({
      screenshots,
      exportSize,
      previewDimensions,
      headlineFontSize,
      subheadlineFontSize,
    });
    setIsStarModalOpen(true);
  };

  /**
   * Resets the editor to default state and clears localStorage
   */
  const resetEditor = () => {
    clearPersistedState();
    const defaultProject = createDefaultProject();
    setProjects([defaultProject]);
    setActiveProjectId(defaultProject.id);
    setSelectedDeviceIdState(defaultProject.selectedDeviceId);
    setSelectedColorIdState(defaultProject.selectedColorId);
    setExportSizeIdState(defaultProject.exportSizeId);
    setScreenshotsState(defaultProject.screenshots);
    setActiveScreenshotIdState(defaultProject.activeScreenshotId);
    setHeadlineFontSizeState(defaultProject.headlineFontSize);
    setSubheadlineFontSizeState(defaultProject.subheadlineFontSize);
    setSelectedElement(null);
    setIsStarModalOpen(false);
  };

  return (
    <EditorContext.Provider
      value={{
        // Project state
        projects,
        activeProjectId,
        activeProject,
        createProject,
        renameProject,
        deleteProject,
        switchProject,

        isFontPickerOpen,
        setIsFontPickerOpen,
        isStarModalOpen,
        setIsStarModalOpen,
        selectedDeviceId,
        setSelectedDeviceId,
        selectedColorId,
        setSelectedColorId,
        exportSizeId,
        setExportSizeId,
        screenshots,
        setScreenshots,
        activeScreenshotId,
        setActiveScreenshotId,
        selectedElement,
        setSelectedElement,
        isDragging,
        headlineFontSize,
        setHeadlineFontSize,
        subheadlineFontSize,
        setSubheadlineFontSize,
        previewDimensions,
        setPreviewDimensions,
        previewRef,
        fileInputRef,
        canvasContainerRef,
        overlayImageInputRef,
        selectedDevice,
        selectedColor,
        activeScreenshot,
        activeDevice,
        exportSize,
        updateActiveScreenshot,
        addScreenshot,
        removeScreenshot,
        handleElementMouseDown,
        handleElementMouseMove,
        handleElementMouseUp,
        handleResizeStart,
        addOverlayImage,
        removeOverlayImage,
        updateOverlayImageSize,
        updateOverlayImageLayer,
        updateOverlayImageRotation,
        updateOverlayImageShadow,
        addShape,
        addSvgShape,
        removeShape,
        updateShape,
        updateShapeShadow,
        bringShapeForward,
        sendShapeBackward,
        addDevice,
        selectDevice,
        removeDevice,
        bringDeviceForward,
        sendDeviceBackward,
        bringImageForward,
        sendImageBackward,
        bringImageToFront,
        sendImageToBack,
        handleFileUpload,
        handleExport,
        getBackgroundStyle,
        resetEditor,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
};
