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

type Term = RouterOutputs["term"]["getTerms"]["all"][number];
type TermContextValue = {
  all: Term[];
  active: Term | null;
  selectedId: string | null;
  selectedTerm: Term | null;
  setSelectedId: (id: string | null) => void;
};

const TermContext = createContext<TermContextValue | null>(null);

export function TermProvider({ children }: { children: ReactNode }) {
  const [{ active, all }] = api.term.getTerms.useSuspenseQuery();

  const [selectedId, setSelectedId] = useSessionStorage<string | null>(
    "sts:selectedTermId",
    active?.id ?? null,
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

export function useTerm() {
  const ctx = useContext(TermContext);
  if (!ctx) {
    throw new Error("useTerm must be used within a TermProvider");
  }
  return ctx;
}

export function TermCombobox() {
  return (
    <Suspense fallback={<Skeleton className="h-9 w-[200px]" />}>
      <TermComboboxInternal />
    </Suspense>
  );
}

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

                    {term.id === active?.id && (
                      <Badge className="font-sm px-1 py-0 leading-tight">
                        Active
                      </Badge>
                    )}

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
