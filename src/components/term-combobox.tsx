/*
The whole app is now wrapped in with <TermProvider /> so you can call useTerm() from anywhere in the app and be able to access all terms, the active term in the db, and the current selected term.

The selected term defaults to the current active term. Selected term is stored in session storage, so it can survive page reloads, but gets reset back to the active term once the user closes the tab/browser.

You can change the selected term with the provided useTerm() hook, which returns a function that takes in a termId. You can just also use the provided <TermCombobox /> component, which is a popover combobox w/ search.

Here is an example of using the useTerm() hook. You can also directly see how it is used in the <TermCombobox /> component if you wish.

"use client";

import { useTerm } from "@/components/term-combobox";

export function TermBadge() {
  const { selectedTerm, active } = useTerm();

  const termToShow = selectedTerm ?? active;

  if (!termToShow) return null;

  return (
    <span className="rounded-full bg-muted px-2 py-1 text-xs">
      {termToShow.label}
    </span>
  );
}
*/

"use client";

import {
  createContext,
  Suspense,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "./ui/skeleton";
import { api, type RouterOutputs } from "@/trpc/react";
import { Badge } from "./ui/badge";
import { useSessionStorage } from "@/hooks/use-session-storage";

export type Term = RouterOutputs["term"]["getTerms"]["all"][number];

// What gets returned when using the useTerm() context
type TermContextValue = {
  all: Term[];
  active: Term | null;
  selectedId: string | null;
  selectedTerm: Term | null;
  setSelectedId: (id: string | null) => void;
};

const EMPTY_TERMS: Term[] = [];
const NO_ACTIVE: Term | null = null;

const TermContext = createContext<TermContextValue | null>(null);

// This wraps the whole app so you can call useTerm() anywhere
export function TermProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  // Only fetch when enabled (i.e., user is authed). Also only use suspense when enabled.
  const { data } = api.term.getTerms.useQuery(undefined, {
    enabled,
    suspense: true,
    retry: false,
  });

  // Grab raw values
  const rawAll = data?.all;
  const rawActive = data?.active;

  // Memoize the final values to keep identity stable
  const all = useMemo(() => rawAll ?? EMPTY_TERMS, [rawAll]);
  const active = useMemo(() => rawActive ?? NO_ACTIVE, [rawActive]);

  // Default selectedId = active term id, or first term id, or null
  const [selectedId, setSelectedId] = useSessionStorage<string | null>(
    "sts:selectedTermId",
    active?.id ?? all[0]?.id ?? null,
  );

  const selectedTerm = useMemo(
    () => all.find((t) => t.id === selectedId) ?? null,
    [all, selectedId],
  );

  const value = useMemo(
    () => ({
      all,
      active,
      selectedId,
      selectedTerm,
      setSelectedId,
    }),
    [all, active, selectedId, selectedTerm, setSelectedId],
  );

  return <TermContext.Provider value={value}>{children}</TermContext.Provider>;
}

// useTerm hook can be used anywhere in the app to retrieve the
// active term, the current selected term, etc
export function useTerm() {
  const ctx = useContext(TermContext);
  if (!ctx) {
    throw new Error("useTerm must be used within a TermProvider");
  }
  return ctx;
}

// Combobox to select a term from a dropdown w/ search
// sets the global term context's selected term.
export function TermCombobox() {
  return (
    <Suspense fallback={<Skeleton className="h-9 w-[200px]" />}>
      <TermComboboxInternal />
    </Suspense>
  );
}

// internal function since we want to wrap this with a skeleton
function TermComboboxInternal() {
  const { active, all, selectedId, selectedTerm, setSelectedId } = useTerm();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedTerm ? selectedTerm.label : "Select term..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search terms..." className="h-9" />
          {/* make it so the list is scrollable when it gets long */}
          <CommandList className="max-h-64 overflow-y-auto">
            <CommandEmpty>No Terms found.</CommandEmpty>
            <CommandGroup>
              {all.map((term) => (
                <CommandItem
                  key={term.id}
                  value={term.label}
                  onSelect={(label) => {
                    const term = all.find((t) => t.label === label);
                    if (!term) return;

                    setSelectedId(term.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex w-full items-center gap-2">
                    <span>{term.label}</span>

                    {/* always mark the active term with a badge */}
                    {term.id === active?.id && (
                      <Badge className="font-sm px-1 py-0 leading-tight">
                        Active
                      </Badge>
                    )}

                    {/* selected term gets a checkmark next to it */}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedId === term.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
