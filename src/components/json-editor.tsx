"use client";

import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
import type { EditorFile } from "@/types/editor";
import { useTheme } from "next-themes";
import { LoadingSpinner } from "./loading-spinner";
import {
  ValidationInputSchema,
  type Allocation,
  type AssistantPreferences,
} from "@/types/excel";
import zodToJsonSchema from "zod-to-json-schema";
import React from "react";
import { useRef } from "react";
import { Braces } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { parse, getLocation, modify } from "jsonc-parser";
import type * as monacoT from "monaco-editor";
import { defaultPLAHours, defaultTAHours } from "@/lib/constants";
import { makeCourseToAssistantMap, personKey } from "@/lib/validation";

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
    const d0 = registerAllocationSnippets(monaco);
    const d1 = monaco.editor.onDidChangeMarkers(recompute);
    const d2 = editor.onDidChangeModelContent(recompute);

    editor.onDidDispose(() => {
      d0.dispose();
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
                className="cursor-pointer"
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
              formatOnType: true,
              formatOnPaste: true,
            }}
          />
        </div>
      </Tabs>
    </div>
  );
}

function registerAllocationSnippets(monaco: Monaco) {
  const objectSnippet = (obj: unknown) => JSON.stringify(obj, null, 2);

  function buildDoc(
    first: string,
    last: string,
    comments: string | null,
    course: string,
  ) {
    const header = `**Insert** ***${first} ${last}*** into ${course}`;
    if (!comments) return header;
    const quoted = comments
      .trim()
      .split(/\r?\n/)
      .map((l) => `> ${l}`)
      .join("\n");
    return `${header}\n\n---\n**Comments:**\n\n${quoted}`;
  }

  return monaco.languages.registerCompletionItemProvider("json", {
    triggerCharacters: [" ", "\n"],
    provideCompletionItems(model, position) {
      // only run auto complete for allocation tab
      if (!model.uri.path.endsWith("Allocations")) return { suggestions: [] };

      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn,
      );

      // the raw json of the current file
      const text = model.getValue();
      const doc = parse(text, [], {
        allowTrailingComma: true,
        disallowComments: false,
      }) as Allocation[];

      const offset = model.getOffsetAt(position);
      const loc = getLocation(text, offset);
      const [allocationObjectIndex, currentKeyNameInObject] = loc.path;
      const idx = Number(allocationObjectIndex);
      const currentAllocation = Number.isFinite(idx) ? doc[idx] : undefined;

      const suggestions: monacoT.languages.CompletionItem[] = [];
      const course = currentAllocation?.Section?.Course;

      if (
        !course ||
        !(currentKeyNameInObject === "TAs" || currentKeyNameInObject === "PLAs")
      ) {
        return { suggestions: [] };
      }

      const roleSingular = currentKeyNameInObject.slice(0, -1); // "TA" or "PLA"

      // Everyone assigned anywhere in this role (across allocations)
      const assignedAssistantSet = new Set(
        doc.flatMap((a) => a[currentKeyNameInObject] ?? []).map(personKey),
      );

      // People already in the current allocation (avoid double-inserting)
      const currentPeopleSet = new Set(
        (currentAllocation?.[currentKeyNameInObject] ?? []).map(personKey),
      );

      // Everyone who is *locked* anywhere in this role (across allocations)
      const lockedAssistantSet = new Set(
        doc
          .flatMap((a) => a[currentKeyNameInObject] ?? [])
          .filter((p) => p.Locked === true)
          .map(personKey),
      );

      const uri = monaco.Uri.parse(`${roleSingular} Preferences`);
      const prefModel = monaco.editor.getModel(uri);
      if (!prefModel) return { suggestions: [] };

      const courseMap = makeCourseToAssistantMap(
        parse(prefModel.getValue(), [], {
          allowTrailingComma: true,
          disallowComments: false,
        }) as AssistantPreferences[],
      );

      const availableAssistants = courseMap[course] ?? [];

      // Split into "unassigned" and "allocated elsewhere"
      const unassignedAssistants = availableAssistants.filter(
        (p) =>
          !assignedAssistantSet.has(personKey(p)) &&
          !lockedAssistantSet.has(personKey(p)),
      );

      const allocatedElsewhereAssistants = availableAssistants.filter(
        (p) =>
          assignedAssistantSet.has(personKey(p)) &&
          !currentPeopleSet.has(personKey(p)) &&
          !lockedAssistantSet.has(personKey(p)),
      );

      // Helper to build the insert object
      const buildInsert = (First: string, Last: string) => ({
        First,
        Last,
        Hours:
          currentKeyNameInObject === "TAs"
            ? defaultTAHours()
            : defaultPLAHours(),
        Locked: false,
      });

      // Unassigned assistants (top)
      for (const { First, Last, Comments } of unassignedAssistants) {
        suggestions.push({
          label: {
            label: `${First} ${Last}`,
            // detail: ` RANK`,
            description: `Qualified • available`,
          },
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: objectSnippet(buildInsert(First, Last)),
          documentation: { value: buildDoc(First, Last, Comments, course) },
          filterText: `${First} ${Last}`,
          sortText: "0", // show above the generic snippet
          range,
        });
      }

      // Allocated elsewhere (below, and auto-remove from previous spot)
      for (const target of allocatedElsewhereAssistants) {
        const { First, Last, Comments } = target;
        const key = personKey(target);

        // Build one safe edit per allocation: set the array to a filtered copy
        const formattingOptions = {
          insertSpaces: true,
          tabSize: 2,
          eol: "\n" as const,
        };

        const toRange = (offset: number, length: number) => {
          const start = model.getPositionAt(offset);
          const end = model.getPositionAt(offset + length);
          return new monaco.Range(
            start.lineNumber,
            start.column,
            end.lineNumber,
            end.column,
          );
        };

        const additionalTextEdits: monacoT.languages.TextEdit[] = [];
        const previousCourses = new Set<string>();
        doc.forEach((a, aIdx) => {
          if (aIdx === idx) return; // don't touch the allocation we're inserting into
          const arr = a?.[currentKeyNameInObject] ?? [];
          if (!Array.isArray(arr) || arr.length === 0) return;

          const filtered = arr.filter((p) => personKey(p) !== key);
          if (filtered.length === arr.length) return; // no occurrence here

          // capture the course(s) this person was in
          previousCourses.add(a?.Section?.Course);

          // One edit per allocation: set [aIdx, "TAs"/"PLAs"] to the filtered array
          const edits = modify(text, [aIdx, currentKeyNameInObject], filtered, {
            formattingOptions,
          });

          for (const e of edits) {
            additionalTextEdits.push({
              range: toRange(e.offset, e.length),
              text: e.content ?? "",
            });
          }
        });

        const prevList = Array.from(previousCourses);
        const prevSummary =
          prevList.length === 0
            ? "—"
            : prevList.length === 1
              ? prevList[0]
              : `${prevList.length} courses`;

        const prevDetail =
          prevList.length <= 3
            ? prevList.join(", ")
            : prevList.slice(0, 3).join(", ") +
              `, +${prevList.length - 3} more`;

        suggestions.push({
          label: {
            label: `${First} ${Last}`,
            // detail: ` RANK`,
            description: `Qualified • ${prevSummary}`,
          },
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: objectSnippet(buildInsert(First, Last)),
          documentation: { value: buildDoc(First, Last, Comments, course) },
          filterText: `${First} ${Last}`,
          additionalTextEdits,
          detail: `⚠️ This will remove "${First} ${Last}" from ${prevDetail}.`,
          sortText: "1", // shown beneath unassigned
          range,
        });
      }

      return { suggestions };
    },
  });
}
