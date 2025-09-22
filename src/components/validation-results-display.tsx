"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { ValidationResult } from "@/types/validation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ValidationResultsCardProps {
  result: ValidationResult[];
}

export function ValidationResultsDisplay({
  result,
}: ValidationResultsCardProps) {
  if (!result || result.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Validation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default">
            <AlertTitle>No issues yet.</AlertTitle>
            <AlertDescription>
              Make sure to press the validate button for issues to show up here.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Card className="flex h-full min-h-0 flex-col overflow-hidden">
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
        <div className="min-h-0 flex-1">
          <ScrollArea className="h-full">
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
                    <Alert variant="destructive">
                      <AlertTitle className="flex items-center gap-2">
                        <XCircle className="h-5 w-5" />
                        Errors ({r.errors.length})
                      </AlertTitle>
                      <AlertDescription>
                        <ExpandableList items={r.errors} initial={5} />
                      </AlertDescription>
                    </Alert>
                  )}

                  {r.warnings.length > 0 && (
                    <Alert variant="warning">
                      <AlertTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Warnings ({r.warnings.length})
                      </AlertTitle>
                      <AlertDescription>
                        <ExpandableList items={r.warnings} initial={5} />
                      </AlertDescription>
                    </Alert>
                  )}

                  {r.ok && r.warnings.length === 0 && (
                    <Alert variant="success">
                      <AlertTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Success!
                      </AlertTitle>
                      <AlertDescription>
                        All validation checks passed successfully.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </CardContent>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}

function ExpandableList({
  items,
  initial = 5,
}: {
  items: string[];
  initial?: number;
}) {
  const [open, setOpen] = useState(false);

  const shouldClamp = items.length > initial && !open;
  const visible = shouldClamp ? items.slice(0, initial) : items;
  const hidden = items.slice(initial);

  return (
    <div>
      <ul className="list-inside list-disc space-y-2 text-sm">
        {visible.map((text, i) => (
          <li key={i} className="py-1 break-words">
            {text}
          </li>
        ))}
      </ul>

      {hidden.length > 0 && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
            <ul className="mt-2 list-inside list-disc space-y-2 text-sm">
              {hidden.map((text, i) => (
                <li key={i} className="py-1 break-words">
                  {text}
                </li>
              ))}
            </ul>
          </CollapsibleContent>

          <CollapsibleTrigger asChild>
            <button className="mt-3 cursor-pointer text-sm font-medium underline underline-offset-4 hover:no-underline">
              {open ? "Show less" : `Show ${hidden.length} more`}
            </button>
          </CollapsibleTrigger>
        </Collapsible>
      )}
    </div>
  );
}
