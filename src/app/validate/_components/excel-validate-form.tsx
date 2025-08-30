"use client";

import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { api } from "@/trpc/react";
import { useState } from "react";
import { toast } from "sonner";
import type { EditorFile } from "@/types/editor";
import JsonEditor from "@/components/json-editor";
import { ChevronsUpDown, UploadIcon } from "lucide-react";
import {
  ACCEPT_MAP,
  ExcelInputFiles,
  ExcelSheetNames,
  type ExcelInputFileEnum,
} from "@/types/excel";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function ValidationForm() {
  const [isOpen, setIsOpen] = useState(true);
  const [selected, setSelected] = useState<
    Partial<Record<ExcelInputFileEnum, File>>
  >({});
  const [editorFiles, setEditorFiles] = useState<EditorFile[]>([
    {
      filename: "/data.json",
      code: '{\n\t"value": "No data yet. Upload all three files to validate."\n}',
      language: "json",
    },
  ]);
  const pickedCount = Object.values(selected).filter(Boolean).length;

  const excel = api.excel.toJson.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: (data) => {
      setEditorFiles(data);
    },
  });

  function handleDrop(key: ExcelInputFileEnum, files: File[]) {
    if (!files?.length) return;
    const file = files[0]!;
    setSelected((prev) => ({ ...prev, [key]: file }));
  }

  function handleSubmit() {
    if (pickedCount === 0) return;

    const fd = new FormData();
    for (const key of ExcelInputFiles) {
      const file = selected[key];
      if (file) fd.append(key, file);
    }

    excel.mutate(fd);
  }

  return (
    <div className="flex h-screen min-h-0 flex-col">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="flex flex-col"
      >
        <div className="flex items-center justify-between border-b p-2">
          <h3 className="text-sm font-medium">Input & Validate</h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ChevronsUpDown className="mr-1 size-4" />
              <span className="text-xs">{isOpen ? "Hide" : "Show"}</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="px-2 py-2">
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              {ExcelInputFiles.map((key) => {
                const current = selected[key];
                return (
                  <Dropzone
                    key={key}
                    className="flex-1"
                    onDrop={(files) => handleDrop(key, files)}
                    onError={(err) => toast.error(err.message)}
                    src={current ? [current] : undefined}
                    accept={ACCEPT_MAP}
                    maxFiles={1}
                  >
                    <DropzoneEmptyState>
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-md">
                          <UploadIcon size={16} />
                        </div>
                        <p className="my-2 w-full truncate text-sm font-medium text-wrap">
                          {current ? current.name : `Upload ${key} file.`}
                        </p>
                        <p className="text-muted-foreground w-full truncate text-xs text-wrap">
                          Drag and drop or click to upload
                        </p>
                        <p className="text-muted-foreground text-xs text-wrap">
                          Accepts Excel files only.
                        </p>
                      </div>
                    </DropzoneEmptyState>
                    <DropzoneContent />
                  </Dropzone>
                );
              })}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={
                  ExcelInputFiles.length !== pickedCount || excel.isPending
                }
              >
                {excel.isPending ? (
                  <LoadingSpinner>Uploading...</LoadingSpinner>
                ) : (
                  "Upload"
                )}
              </Button>
              <Button
                className="flex-1"
                disabled={editorFiles.length !== ExcelSheetNames.length}
              >
                Validate
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <div className="min-h-0 flex-1">
        <JsonEditor files={editorFiles} onChange={setEditorFiles} />
      </div>
    </div>
  );
}
