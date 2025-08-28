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
import { UploadIcon } from "lucide-react";

const ACCEPT_MAP = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-excel": [".xls"],
};

export default function ValidationForm() {
  const [files, setFiles] = useState<File[] | undefined>();
  const [editorFiles, setEditorFiles] = useState<EditorFile[]>([
    {
      filename: "/data.json",
      code: '{ "value": "No data yet" }',
      language: "json",
    },
  ]);

  const excel = api.excel.toJson.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: (data) => setEditorFiles(data),
  });

  function handleSubmit() {
    if (!files?.length) return;
    const fd = new FormData();
    fd.append("file", files[0]!);
    excel.mutate(fd);
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        {["Assignments", "PLA preferences", "TA preferences"].map((item) => (
          <Dropzone
            className="flex-1"
            onDrop={setFiles}
            onError={(err) => toast.error(err.message)}
            src={files}
            accept={ACCEPT_MAP}
            maxFiles={1}
            key={item}
          >
            <DropzoneEmptyState>
              <div className="flex flex-col items-center justify-center">
                <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-md">
                  <UploadIcon size={16} />
                </div>
                <p className="my-2 w-full truncate text-sm font-medium text-wrap">
                  Upload {item}
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
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" onClick={handleSubmit} disabled={!files}>
          Upload
        </Button>
        <Button className="flex-1" disabled={editorFiles.length <= 1}>
          Validate
        </Button>
      </div>
      <JsonEditor files={editorFiles} onChange={setEditorFiles} height={600} />
    </div>
  );
}
