import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

type ExpandableListProps<T> = {
  items: T[];
  initial?: number;
  children: (item: T, index: number) => React.ReactNode;
};

export function ExpandableList<T>({
  items,
  initial = 5,
  children,
}: ExpandableListProps<T>) {
  const [open, setOpen] = useState(false);

  const visible = items.slice(0, initial);
  const hidden = items.slice(initial);

  return (
    <div>
      {/* visible items */}
      <div className="space-y-2">
        {visible.map((item, index) => (
          <div key={index}>{children(item, index)}</div>
        ))}
      </div>

      {hidden.length > 0 && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
            <div className="mt-2 space-y-2">
              {hidden.map((item, index) => (
                <div key={index + initial}>
                  {children(item, index + initial)}
                </div>
              ))}
            </div>
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
