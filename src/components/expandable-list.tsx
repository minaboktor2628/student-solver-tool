import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

export function ExpandableList({
  items,
  initial = 5,
}: {
  items: string[];
  initial?: number;
}) {
  const [open, setOpen] = useState(false);

  const visible = items.slice(0, initial);
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
