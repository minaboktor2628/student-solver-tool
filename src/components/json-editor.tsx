"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
import type { EditorFile } from "@/types/editor";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useTheme } from "next-themes";
import { LoadingSpinner } from "./loading-spinner";
import {
  ExcelSheetNames,
  ValidationArraySchemasBySheetName,
} from "@/types/excel";
import { sheetnameToJsonFilename } from "@/lib/xlsx";
import zodToJsonSchema from "zod-to-json-schema";

interface Props {
  files: EditorFile[];
  onChange: (files: EditorFile[]) => void;
  onValidityChange: (allValid: boolean) => void;
}

const toSchemaEntries = () =>
  ExcelSheetNames.map((sheetName) => {
    const modelPath = sheetnameToJsonFilename(sheetName);
    const zodSchema = ValidationArraySchemasBySheetName[sheetName];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const jsonSchema = zodToJsonSchema(zodSchema, {
      name: sheetName.replace(/\s+/g, ""),
    });
    return {
      fileMatch: [modelPath],
      uri: `inmemory://schema${modelPath}`,
      schema: jsonSchema,
    };
  });

export default function JsonEditor({
  files,
  onChange,
  onValidityChange,
}: Props) {
  const { resolvedTheme } = useTheme();

  const [activeIndex, setActiveIndex] = useState(0);
  const activeFile = files[activeIndex];

  const handleChange = (value?: string) => {
    const next = files.map((f, i) =>
      i === activeIndex ? { ...f, code: value ?? "" } : f,
    );
    onChange(next);
  };

  const onMount: OnMount = (editor, monaco) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      enableSchemaRequest: false,
      trailingCommas: "error",
      schemas: toSchemaEntries(),
    });

    files.map((f) => {
      const uri = monaco.Uri.parse(
        f.filename.startsWith("inmemory://")
          ? f.filename
          : `inmemory://${f.filename}`,
      );
      // Reuse existing or create new
      return (
        monaco.editor.getModel(uri) ??
        monaco.editor.createModel(f.code ?? "", "json", uri)
      );
    });

    const updateValidity = () => {
      const allJsonModels = monaco.editor
        .getModels()
        .filter((m) => m.getLanguageId() === "json");
      const hasAnyMarkers = allJsonModels.some(
        (m) => monaco.editor.getModelMarkers({ resource: m.uri }).length > 0,
      );
      onValidityChange(!hasAnyMarkers);
    };

    updateValidity();
    const d1 = monaco.editor.onDidChangeMarkers(updateValidity);
    const d2 = editor.onDidChangeModelContent(updateValidity);

    editor.onDidDispose(() => {
      d1.dispose();
      d2.dispose();
    });
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="w-full">
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
              className={`cursor-pointer truncate px-2 py-1 ${i === activeIndex ? "bg-accent" : ""}`}
              onClick={() => setActiveIndex(i)}
              title={f.filename}
            >
              {f.filename.replace(/^\//, "")}
            </li>
          ))}
        </ul>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
        <Editor
          path={activeFile?.filename}
          height="100%"
          loading={<LoadingSpinner />}
          theme={resolvedTheme === "dark" ? "vs-dark" : resolvedTheme}
          language={activeFile?.language ?? "json"}
          value={activeFile?.code ?? ""}
          onChange={handleChange}
          onMount={onMount}
          options={{
            minimap: { enabled: false },
            lineNumbers: "on",
            wordWrap: "on",
            automaticLayout: true,
            fixedOverflowWidgets: true,
            padding: { top: 10, bottom: 10 },
            glyphMargin: true,
          }}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
