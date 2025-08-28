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

const ACCEPT_MAP = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-excel": [".xls"],
};

export default function Page() {
  const [files, setFiles] = useState<File[] | undefined>();
  const excel = api.excel.validate.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: (data) => console.dir(data.allSheets),
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
    </div>
  );
}
