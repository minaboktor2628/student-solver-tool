"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ValidationResultsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  result: ValidationResult | null;
}

export function ValidationResultsDialog({
  isOpen,
  onOpenChange,
  result,
}: ValidationResultsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {result?.isValid ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            Validation Results
          </DialogTitle>
          <DialogDescription>
            {result?.isValid 
              ? "All validation checks passed!" 
              : `Found ${result?.errors.length} error(s) and ${result?.warnings.length} warning(s)`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {result?.errors && result.errors.length > 0 && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertTitle className="flex items-center gap-2 text-red-800">
                <XCircle className="h-5 w-5" />
                Errors ({result.errors.length})
              </AlertTitle>
              <AlertDescription className="text-red-700">
                <ul className="list-disc list-inside space-y-2 text-sm">
                  {result.errors.map((error, index) => (
                    <li key={index} className="break-words py-1">
                      {error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {result?.warnings && result.warnings.length > 0 && (
            <Alert variant="default" className="bg-yellow-50 border-yellow-200">
              <AlertTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                Warnings ({result.warnings.length})
              </AlertTitle>
              <AlertDescription className="text-yellow-700">
                <ul className="list-disc list-inside space-y-2 text-sm">
                  {result.warnings.map((warning, index) => (
                    <li key={index} className="break-words py-1">
                      {warning}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {result?.isValid && result.warnings.length === 0 && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <AlertTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Success!
              </AlertTitle>
              <AlertDescription className="text-green-700">
                All validation checks passed successfully.
              </AlertDescription>
            </Alert>
          )}

          {!result && (
            <Alert variant="default">
              <AlertTitle>Processing...</AlertTitle>
              <AlertDescription>
                Validation is in progress. Please wait.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Debug info */}
        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Debug Info:</h3>
          <pre className="text-xs overflow-auto max-h-32">
            {JSON.stringify({
              hasResult: !!result,
              errorCount: result?.errors.length || 0,
              warningCount: result?.warnings.length || 0,
              isValid: result?.isValid,
              firstError: result?.errors[0] || 'No errors',
              firstWarning: result?.warnings[0] || 'No warnings'
            }, null, 2)}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}