"use client";

import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { api } from "@/trpc/react";
import React, { useState } from "react";
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
import { sheetnameToJsonFilename } from "@/lib/xlsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ValidationForm() {
  const [isOpen, setIsOpen] = useState(true);
  const [allFilesValid, setAllFilesValid] = useState(false);

  const [selected, setSelected] = useState<
    Partial<Record<ExcelInputFileEnum, File>>
  >({});
  const [editorFiles, setEditorFiles] = useState<EditorFile[]>(
    ExcelSheetNames.map((name) => ({
      filename: sheetnameToJsonFilename(name),
      code: "[]",
      language: "json",
    })),
  );

  const pickedCount = Object.values(selected).filter(Boolean).length;

  const excelParse = api.excel.parseExcelWorkbooks.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: ({ files, isValid }) => {
      toast(`ret=${isValid}`);
      setEditorFiles(files);
    },
  });

  const excelValidate = api.excel.validate.useMutation({
    onError: (error) => toast.error(error.message),
  });

  function handleDrop(key: ExcelInputFileEnum, files: File[]) {
    if (!files?.length) return;
    const file = files[0]!;
    setSelected((prev) => ({ ...prev, [key]: file }));
  }

  function handleUploadAndParse() {
    if (pickedCount === 0) return;

    const fd = new FormData();
    for (const key of ExcelInputFiles) {
      const file = selected[key];
      if (file) fd.append(key, file);
    }

    excelParse.mutate(fd);
  }

  const isValidateButtonDisabled = excelValidate.isPending || !allFilesValid;
  const isUploadButtonDisabled =
    ExcelInputFiles.length !== pickedCount || excelParse.isPending;

  return (
    <div className="flex h-screen min-h-0 flex-col">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="flex flex-col"
      >
        <div className="flex items-center justify-between border-b p-2">
          <h3 className="text-sm font-medium">Input & Validate</h3>
          <div className="flex flex-row gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex-1">
                    <Button
                      className="w-full"
                      onClick={handleUploadAndParse}
                      disabled={isUploadButtonDisabled}
                    >
                      {excelParse.isPending ? (
                        <LoadingSpinner>Uploading...</LoadingSpinner>
                      ) : (
                        "Upload"
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isUploadButtonDisabled
                      ? "Select all required Excel files before uploading"
                      : "Upload the Excel workbooks"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex-1">
                    <Button
                      className="w-full"
                      onClick={() => toast("TODO")}
                      disabled={false} // TODO: disable valid button
                    >
                      {excelValidate.isPending ? (
                        <LoadingSpinner>Validating...</LoadingSpinner>
                      ) : (
                        "Validate"
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isValidateButtonDisabled
                      ? "Upload and fix errors before validating. You can check each file's right scrollbar/sidebar to see the errors."
                      : "Run validation"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2">
              <ChevronsUpDown className="mr-1 size-4" />
              <span className="text-xs">{isOpen ? "Hide" : "Show"}</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="px-2 py-2">
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              {ExcelInputFiles.map((name) => (
                <ExcelFileDropzones
                  key={name}
                  current={selected[name]}
                  handleDrop={handleDrop}
                  name={name}
                />
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <div className="flex-1">
        <JsonEditor
          files={editorFiles}
          onChange={setEditorFiles}
          onValidityChange={setAllFilesValid}
        />
      </div>
    </div>
  );
}

function ExcelFileDropzones({
  current,
  handleDrop,
  name,
}: {
  name: ExcelInputFileEnum;
  current: File | undefined;
  handleDrop: (key: ExcelInputFileEnum, files: File[]) => void;
}) {
  return (
    <Dropzone
      className="flex-1"
      onDrop={(files) => handleDrop(name, files)}
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
            {current ? current.name : `Upload ${name} file.`}
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
}
