import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { loadGoogleFonts } from "../lib/google-fonts";
import { EditorProvider } from "../context/EditorContext";
import { ThemeProvider } from "../context/ThemeContext";
import { EditorLayout } from "../components/EditorLayout";

const RouteComponent = () => {
  useEffect(() => {
    loadGoogleFonts();
  }, []);

  return (
    <ThemeProvider>
      <EditorProvider>
        <EditorLayout />
      </EditorProvider>
    </ThemeProvider>
  );
};

export const Route = createFileRoute("/")({
  component: RouteComponent,
});
