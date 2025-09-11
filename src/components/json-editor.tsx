"use client";

import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
import type { EditorFile } from "@/types/editor";
import { useTheme } from "next-themes";
import { LoadingSpinner } from "./loading-spinner";
import { ValidationInputSchema } from "@/types/excel";
import zodToJsonSchema from "zod-to-json-schema";
import React from "react";
import { useRef } from "react";
import { Braces } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

type ErrorCountMap = Record<string, number>;
type Monaco = Parameters<OnMount>[1];
interface Props {
  files: EditorFile[];
  onChange: (files: EditorFile[]) => void;
  onValidityChange: (allValid: boolean) => void;
}

type Shape = typeof ValidationInputSchema.shape;
type ShapeKey = keyof Shape;
const toSchemaEntries = () =>
  (
    Object.entries(ValidationInputSchema.shape) as [ShapeKey, Shape[ShapeKey]][]
  ).map(([name, schema]) => ({
    fileMatch: [name],
    uri: `inmemory://schemas/${name}.schema.json`,
    schema: zodToJsonSchema(schema, { name }),
  }));

export default function JsonEditor({
  files,
  onChange,
  onValidityChange,
}: Props) {
  const { resolvedTheme } = useTheme();

  // active file is keyed by filename (tabs value)
  const initial = files[0]?.filename ?? "";
  const [activeFilename, setActiveFilename] = useState(initial);
  const activeFile = useMemo(
    () => files.find((f) => f.filename === activeFilename) ?? files[0],
    [files, activeFilename],
  );

  // keep Monaco instance so we can convert filenames -> URIs in render
  const monacoRef = useRef<Monaco | null>(null);
  const recomputeRef = useRef<(() => void) | null>(null);
  const [errorCounts, setErrorCounts] = useState<ErrorCountMap>({});

  const handleChange = (value?: string) => {
    const next = files.map((f) =>
      f.filename === activeFile?.filename ? { ...f, code: value ?? "" } : f,
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
      const counts: Record<string, number> = {};
      const models = monaco.editor
        .getModels()
        .filter((m) => m.getLanguageId() === "json");

      for (const m of models) {
        const markers = monaco.editor.getModelMarkers({ resource: m.uri });
        counts[m.uri.toString()] = markers.filter(
          (x) => x.severity === monaco.MarkerSeverity.Error,
        ).length;
      }

      setErrorCounts(counts);
      onValidityChange(!Object.values(counts).some((n) => n > 0));
    };

    recomputeRef.current = recompute;
    const d1 = monaco.editor.onDidChangeMarkers(recompute);
    const d2 = editor.onDidChangeModelContent(recompute);

    editor.onDidDispose(() => {
      d1.dispose();
      d2.dispose();
    });

    // run once initially
    recompute();
  };

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;

    const keep = new Set<string>();

    for (const f of files) {
      const uri = monaco.Uri.parse(f.filename);
      keep.add(uri.toString());

      let model = monaco.editor.getModel(uri);
      if (!model) {
        model = monaco.editor.createModel(f.code ?? "", "json", uri);
      } else if (model.getValue() !== (f.code ?? "")) {
        model.setValue(f.code ?? ""); // triggers JSON worker re-validate
      }
    }

    // dispose models that are no longer represented in props
    for (const m of monaco.editor.getModels()) {
      if (m.getLanguageId() !== "json") continue;
      if (!keep.has(m.uri.toString())) m.dispose();
    }

    // force a recompute right after batch updates
    recomputeRef.current?.();
  }, [files]);

  const uriKeyFor = (filename: string) =>
    monacoRef.current?.Uri.parse(filename).toString() ?? filename;

  return (
    <div className="flex h-full w-full flex-col">
      <Tabs
        value={activeFile?.filename ?? ""}
        onValueChange={setActiveFilename}
        className="mr-1 flex h-full flex-col"
      >
        <TabsList className="w-full">
          {files.map((f) => {
            const key = uriKeyFor(f.filename);
            const errCount = errorCounts[key] ?? 0;
            const hasErrors = errCount > 0;

            return (
              <TabsTrigger
                key={f.filename}
                value={f.filename}
                title={f.filename}
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex cursor-pointer items-center gap-2 px-3 py-1.5"
              >
                <Braces className="inline size-4" />
                <span
                  className={`${hasErrors ? "underline decoration-red-600 decoration-wavy underline-offset-2" : ""} truncate`}
                >
                  {f.filename}.json
                </span>
                {hasErrors && (
                  <span className="text-destructive ml-1 rounded bg-red-600/30 px-1.5 py-0.5 text-[10px] leading-none">
                    {errCount}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Single editor, bound to the active tab */}
        <div className="border-input min-h-0 flex-1 overflow-hidden rounded-md border">
          <Editor
            path={activeFile?.filename}
            height="100%"
            loading={<LoadingSpinner />}
            theme={resolvedTheme === "dark" ? "vs-dark" : resolvedTheme}
            language={activeFile?.language ?? "json"}
            value={activeFile?.code ?? ""}
            onChange={handleChange}
            onMount={onMount}
            className="h-full"
            options={{
              minimap: { enabled: true },
              lineNumbers: "on",
              wordWrap: "on",
              automaticLayout: true,
              fixedOverflowWidgets: true,
              padding: { top: 10, bottom: 10 },
              glyphMargin: true,
            }}
          />
        </div>
      </Tabs>
    </div>
  );
}
