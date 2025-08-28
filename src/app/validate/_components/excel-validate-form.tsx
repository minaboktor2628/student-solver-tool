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
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockFiles,
  CodeBlockHeader,
  CodeBlockItem,
  type CodeBlockData,
} from "@/components/ui/shadcn-io/code-block";

const ACCEPT_MAP = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-excel": [".xls"],
};

export default function ValidationForm() {
  const [files, setFiles] = useState<File[] | undefined>();
  const [code, setCode] = useState<CodeBlockData[]>([
    {
      code: '{ value: "No data yet" }',
      filename: "data.json",
      language: "json",
    },
  ]);

  const excel = api.excel.validate.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: (data) => {
      console.log(data.allSheets);
      setCode([
        {
          code: JSON.stringify(data.allSheets, null, 2),
          filename: "data.json",
          language: "json",
        },
      ]);
    },
  });

  function handleSubmit() {
    if (!files?.length) return;
    const fd = new FormData();
    fd.append("file", files[0]!);
    excel.mutate(fd);
  }

  return (
    <div className="flex flex-col space-y-4">
      <Dropzone
        onDrop={setFiles}
        onError={(err) => toast.error(err.message)}
        src={files}
        accept={ACCEPT_MAP}
        maxFiles={1}
      >
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>
      <Button onClick={handleSubmit}>Validate</Button>
      <CodeBlock data={code} defaultValue={code[0]?.language}>
        <CodeBlockHeader>
          <CodeBlockFiles>
            {(item) => (
              <CodeBlockFilename key={item.language} value={item.language}>
                {item.filename}
              </CodeBlockFilename>
            )}
          </CodeBlockFiles>
          <CodeBlockCopyButton
            onCopy={() => toast.info("Copied code to clipboard")}
            onError={() => toast.error("Failed to copy code to clipboard")}
          />
        </CodeBlockHeader>
        <CodeBlockBody>
          {(item) => (
            <CodeBlockItem key={item.language} value={item.language}>
              <CodeBlockContent language={item.language}>
                {item.code}
              </CodeBlockContent>
            </CodeBlockItem>
          )}
        </CodeBlockBody>
      </CodeBlock>
    </div>
  );
}
