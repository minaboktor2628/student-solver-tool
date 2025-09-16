"use client"
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { toast } from "sonner";
import { ACCEPT_MAP, type ExcelInputFileEnum } from "@/types/excel";
import { UploadIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";


export default function GeneratePrefSheetPage() {

    const [selected, setSelected] = useState<
        File | undefined>(undefined);  

    function exportPreferenceSheets(file: File | undefined): void {
        throw new Error("Function not implemented.");

        // Handle file drop logic here
        
        // Instantiate headers of PLA Preferences and TA Preferences

        // Iterate over PLAs, add each [Last, First, Email] to Preference Sheet
        // Iterate over TAs, add each [Last, First, Email] to Preference Sheet

        // Iterate over courses. For each course:
        //   If course 1000 - 4000 and NOT 3043, add to both sheets
        //   If course 3043, add to PLA sheet only. Save meeting patterns to const
        //   If course 500 or 5000, add to TA sheet only

        // Add 3043 meeting patterns to end of PLA sheet

        // Export both sheets as Excel files

        toast.success("Preference sheets generated!");

    }

    function handleDrop(files: File[]): void {
            if (!files || files.length === 0) {
                toast.error("No file uploaded.");
                return;
            }
            setSelected(files[0]);
        }



    return (
        
    <div className="mx-auto flex flex-col items-center h-full min-h-0 flex-1 flex-col p-6 space-y-4">
        <Button 
            className="min-w-[33%]"
            onClick={() => exportPreferenceSheets(selected)}
            disabled={!selected}
        >Export Preference Sheets</Button>
        <Dropzone
            className="flex-1"
            onDrop={(files) => handleDrop(files)}
            accept={ACCEPT_MAP}
            maxFiles={1}
        >
        <DropzoneEmptyState>
            <div className="flex flex-col items-center justify-center">
                <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-md">
                    <UploadIcon size={16} />
                </div>
                <p className="my-2 w-full truncate text-sm font-medium text-wrap">
                    Upload Allocations File
                </p>
                <p className="text-muted-foreground w-full truncate text-xs text-wrap">
                    Drag and drop or click to upload
                </p>
                <p className="text-muted-foreground text-xs text-wrap">
                    Accepts Excel files only.
                </p>
          </div>
        </DropzoneEmptyState>
            <DropzoneContent className="h-64" />
        </Dropzone>

    </div>
    );
}