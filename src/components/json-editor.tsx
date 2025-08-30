"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import type { EditorFile } from "@/types/editor";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useTheme } from "next-themes";
import { LoadingSpinner } from "./loading-spinner";

interface Props {
  files: EditorFile[];
  onChange?: (files: EditorFile[]) => void;
}

export default function JsonEditor({ files, onChange }: Props) {
  const { resolvedTheme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFile = files[activeIndex];

  function handleChange(value?: string) {
    const next = files.map((f, i) =>
      i === activeIndex ? { ...f, code: value ?? "" } : f,
    );
    onChange?.(next);
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="w-full">
      {/* Explorer */}
      <ResizablePanel
        className="overflow-y-auto border-r"
        defaultSize={10}
        minSize={8}
        maxSize={40}
      >
        <ul className="text-sm">
          {files.map((f, i) => (
            <li
              key={f.filename}
              className={`cursor-pointer truncate px-2 py-1 ${
                i === activeIndex ? "bg-accent" : ""
              }`}
              onClick={() => setActiveIndex(i)}
              title={f.filename}
            >
              {f.filename.replace(/^\//, "")}
            </li>
          ))}
        </ul>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Monaco */}
      <ResizablePanel className="overflow-hidden">
        <Editor
          height="100%"
          loading={<LoadingSpinner />}
          theme={resolvedTheme === "dark" ? "vs-dark" : resolvedTheme}
          language={activeFile?.language ?? "json"}
          value={activeFile?.code ?? ""}
          onChange={handleChange}
          options={{
            minimap: { enabled: true },
            lineNumbers: "on",
            wordWrap: "on",
            automaticLayout: true, // reacts to resizes
          }}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
