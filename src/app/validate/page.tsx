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
  ValidationInputSchema,
  type ExcelInputFileEnum,
} from "@/types/excel";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ValidationResult } from "@/types/validation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ValidationResultsDisplay } from "@/components/validation-results-display";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useHotkeys } from "react-hotkeys-hook";
import { Kbd, KbdKey } from "@/components/ui/shadcn-io/kbd";

export default function ValidationPage() {
  const [isOpen, setIsOpen] = useLocalStorage("validation:isOpen", true);
  const [areAllFilesValid, setAreAllFilesValid] = useLocalStorage(
    "validation:allValid",
    false,
  );

  const [validationResults, setValidationResults] = useLocalStorage<
    ValidationResult[]
  >("validation:results", []);

  const [editorFiles, setEditorFiles] = useLocalStorage<EditorFile[]>(
    "validation:editorFiles",
    Object.keys(ValidationInputSchema.shape).map((name) => ({
      filename: name,
      language: "json",
      code: "[]",
    })),
  );

  const [selected, setSelected] = useState<
    Partial<Record<ExcelInputFileEnum, File>>
  >({});

  const pickedCount = Object.values(selected).filter(Boolean).length;

  const parserApi = api.excel.parseExcelWorkbooks.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: ({ files }) => {
      setEditorFiles(files);
      setValidationResults([]);
    },
  });

  const validationApi = api.validate.validateFullSolution.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: ({ issues }) => setValidationResults(issues),
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

    parserApi.mutate(fd);
  }

  function handleValidate() {
    const rawData: Record<string, unknown> = {};

    for (const { filename, code } of editorFiles) {
      try {
        rawData[filename] = JSON.parse(code);
      } catch (err) {
        toast.error(`Unable to parse: ${filename}. ${String(err)}`);
        return;
      }
    }

    const result = ValidationInputSchema.safeParse(rawData);
    if (!result.success) {
      const msg = result.error.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("\n");
      toast.error(`Validation failed:\n${msg}`);
      return;
    }

    validationApi.mutate(result.data);
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="flex flex-col"
      >
        <div className="flex items-center justify-between border-b p-2">
          <h3 className="text-sm font-medium">Input & Validate</h3>
          <div className="flex flex-row gap-2">
            <UploadExcelFilesButton
              handleClick={() => handleUploadAndParse()}
              disabled={
                ExcelInputFiles.length !== pickedCount || parserApi.isPending
              }
              api={{ ...parserApi }}
            />
            <ValidateButton
              handleClick={() => handleValidate()}
              disabled={validationApi.isPending || !areAllFilesValid}
              api={{ ...validationApi }}
            />
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2">
              <ChevronsUpDown className="mr-1 size-4" />
              <span className="text-xs">{isOpen ? "Hide" : "Show"}</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="border-b px-2 py-2">
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
      <div className="min-h-0 flex-1 p-2">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel>
            <div className="h-full">
              <JsonEditor
                files={editorFiles}
                onChange={setEditorFiles}
                onValidityChange={setAreAllFilesValid}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-background" />
          <ResizablePanel minSize={20} defaultSize={30} maxSize={60}>
            <ValidationResultsDisplay result={validationResults} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

type ValidationPageButtonProps = {
  handleClick: () => void;
  disabled: boolean;
  api: { isPending: boolean };
};

function UploadExcelFilesButton({
  handleClick,
  disabled,
  api,
}: ValidationPageButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex-1">
            <Button
              className="w-full"
              onClick={handleClick}
              disabled={disabled}
            >
              {api.isPending ? <LoadingSpinner size="sm" /> : "Upload"}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {disabled
              ? "Select all required Excel files before uploading"
              : "Upload the Excel workbooks"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ValidateButton({
  handleClick,
  disabled,
  api,
}: ValidationPageButtonProps) {
  useHotkeys(
    "ctrl+shift+v",
    (event) => {
      event.preventDefault();
      if (!disabled) handleClick();
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
    [disabled, handleClick],
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex-1">
            <Button
              className="w-full"
              onClick={handleClick}
              disabled={disabled}
            >
              {api.isPending ? <LoadingSpinner size="sm" /> : "Validate"}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {disabled ? (
            <p>
              Upload Excel files and fix all their errors before validating. You
              can check each file&apos;s sidebar to see the errors.
            </p>
          ) : (
            <p className="max-w-sm">
              Press{" "}
              <Kbd>
                <KbdKey aria-label="Meta">⌘</KbdKey>
                <KbdKey>Shift</KbdKey>
                <KbdKey>V</KbdKey>
              </Kbd>{" "}
              to run validation.
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
