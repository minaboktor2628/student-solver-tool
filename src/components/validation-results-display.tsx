"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { ValidationResult } from "@/types/validation";
import { ScrollArea } from "./ui/scroll-area";

interface ValidationResultsCardProps {
  result: ValidationResult[];
}

export function ValidationResultsDisplay({
  result,
}: ValidationResultsCardProps) {
  if (!result || result.length === 0) {
    return (
      <Card className="max-w-4xl rounded-none">
        <CardHeader>
          <CardTitle>Validation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default">
            <AlertTitle>No issues.</AlertTitle>
            <AlertDescription>There are no validation issues.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-screen">
      <Card className="max-w-4xl rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            {result.every((r) => r.ok) ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            Validation Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {result.map((r, i) => (
            <div
              key={i}
              className="space-y-4 border-t pt-4 first:border-t-0 first:pt-0"
            >
              <h3 className="text-lg font-semibold">
                Rule: <span className="font-mono">{r.meta.rule}</span> (
                {r.meta.ms}ms)
              </h3>

              {r.errors.length > 0 && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50"
                >
                  <AlertTitle className="flex items-center gap-2 text-red-800">
                    <XCircle className="h-5 w-5" />
                    Errors ({r.errors.length})
                  </AlertTitle>
                  <AlertDescription className="text-red-700">
                    <ul className="list-inside list-disc space-y-2 text-sm">
                      {r.errors.map((error, idx) => (
                        <li key={idx} className="py-1 break-words">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {r.warnings.length > 0 && (
                <Alert
                  variant="default"
                  className="border-yellow-200 bg-yellow-50"
                >
                  <AlertTitle className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-5 w-5" />
                    Warnings ({r.warnings.length})
                  </AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    <ul className="list-inside list-disc space-y-2 text-sm">
                      {r.warnings.map((warning, idx) => (
                        <li key={idx} className="py-1 break-words">
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {r.ok && r.warnings.length === 0 && (
                <Alert
                  variant="default"
                  className="border-green-200 bg-green-50"
                >
                  <AlertTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    Success!
                  </AlertTitle>
                  <AlertDescription className="text-green-700">
                    All validation checks passed successfully.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
