import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { signIn } from "@/server/auth";

export default function DevDock() {
  return (
    <Sheet>
      <SheetTrigger
        asChild
        className="fixed right-3 bottom-3 z-[9999] flex items-center gap-2"
      >
        <Button>Dev</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[60vh] p-0">
        <div className="mt-10 flex h-full flex-col">
          <form
            action={async () => {
              "use server";
              await signIn();
            }}
          >
            <Button>Dev Sign in</Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
