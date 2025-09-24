import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { auth, signIn } from "@/server/auth";
import { testingPasswordMap } from "@/server/auth/config";

export default async function DevDock() {
  const session = await auth();
  return (
    <Sheet>
      <SheetTrigger
        asChild
        className="fixed right-3 bottom-3 z-[9999] flex items-center gap-2"
      >
        <Button>Dev</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[60vh] overflow-scroll p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>Developer Dock</SheetTitle>
          <SheetDescription>
            Quick test sign-ins (only available in dev mode)
          </SheetDescription>
        </SheetHeader>
        <div className="flex w-full flex-row items-center justify-center gap-2">
          {Object.entries(testingPasswordMap).map(([pwd, roles]) => (
            <form
              key={pwd}
              action={async () => {
                "use server";
                await signIn("credentials", { password: pwd, redirectTo: "/" });
              }}
            >
              <Button type="submit" className="flex h-full flex-col">
                <p>Sign in w/ {pwd}.</p>
                <p>Roles: {roles.join(", ")}</p>
              </Button>
            </form>
          ))}
        </div>
        <pre className="mx-4 overflow-auto rounded-xl bg-black p-4 text-white">
          <code>{JSON.stringify(session, null, 2)}</code>
        </pre>
      </SheetContent>
    </Sheet>
  );
}
