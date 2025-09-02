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
import zodToJsonSchema from "zod-to-json-schema";
import React from "react";
import { useRef } from "react";
import { Braces } from "lucide-react";

type ErrorCountMap = Record<string, number>;
type Monaco = Parameters<OnMount>[1];
interface Props {
  files: EditorFile[];
  onChange: (files: EditorFile[]) => void;
  onValidityChange: (allValid: boolean) => void;
}

const toSchemaEntries = () =>
  ExcelSheetNames.map((sheetName) => {
    const zodSchema = ValidationArraySchemasBySheetName[sheetName];
    const jsonSchema = zodToJsonSchema(zodSchema, { name: sheetName });
    return {
      fileMatch: [sheetName],
      uri: `inmemory://schema${sheetName}`,
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

  // keep Monaco instance so we can convert filenames -> URIs in render
  const monacoRef = useRef<Monaco | null>(null);
  const [errorCounts, setErrorCounts] = useState<ErrorCountMap>({});

  const handleChange = (value?: string) => {
    const next = files.map((f, i) =>
      i === activeIndex ? { ...f, code: value ?? "" } : f,
    );
    onChange(next);
  };

  const onMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      enableSchemaRequest: false,
      trailingCommas: "error",
      schemas: toSchemaEntries(),
      schemaValidation: "error",
    });

    files.forEach((f) => {
      const uri = monaco.Uri.parse(f.filename);
      return (
        monaco.editor.getModel(uri) ??
        monaco.editor.createModel(f.code ?? "", "json", uri)
      );
    });

    const recompute = () => {
      const counts: ErrorCountMap = {};
      const models = monaco.editor
        .getModels()
        .filter((m) => m.getLanguageId() === "json");
      for (const m of models) {
        const markers = monaco.editor.getModelMarkers({ resource: m.uri });
        const errors = markers.filter(
          (x) => x.severity === monaco.MarkerSeverity.Error,
        ).length;
        counts[m.uri.toString()] = errors;
      }
      setErrorCounts(counts);

      const hasAnyErrors = Object.values(counts).some((n) => n > 0);
      onValidityChange(!hasAnyErrors);
    };

    // initial + listeners
    recompute();
    const d1 = monaco.editor.onDidChangeMarkers(recompute);
    const d2 = editor.onDidChangeModelContent(recompute);

    editor.onDidDispose(() => {
      d1.dispose();
      d2.dispose();
    });
  };

  // helper to get the key we used above (uri.toString())
  const uriKeyFor = (filename: string) =>
    monacoRef.current?.Uri.parse(filename).toString() ?? filename;

  return (
    <ResizablePanelGroup direction="horizontal" className="w-full">
      <ResizablePanel
        className="overflow-y-auto border-r"
        defaultSize={10}
        minSize={8}
        maxSize={40}
      >
        <ul className="text-sm">
          {files.map((f, i) => {
            const key = uriKeyFor(f.filename);
            const errCount = errorCounts[key] ?? 0;
            const hasErrors = errCount > 0;
            return (
              <li
                key={f.filename}
                className={`group flex cursor-pointer items-center gap-2 truncate px-2 py-1 ${i === activeIndex ? "bg-accent" : ""}`}
                onClick={() => setActiveIndex(i)}
                title={f.filename}
              >
                <span
                  className={`${hasErrors ? "underline decoration-red-600 decoration-wavy underline-offset-2" : ""} truncate`}
                >
                  <Braces className="mr-2 inline size-4" /> {f.filename}.json
                </span>
                {hasErrors && (
                  <span className="ml-auto rounded bg-red-600/15 px-1.5 py-0.5 text-[10px] leading-none text-red-700">
                    {errCount}
                  </span>
                )}
              </li>
            );
          })}
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
          className="max-h-screen"
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
