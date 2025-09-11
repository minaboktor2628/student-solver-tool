import { auth, signIn, signOut } from "@/server/auth";
import { Button } from "./ui/button";
import { LoadingSpinner } from "./loading-spinner";

export async function AuthButton() {
  const session = await auth();

  if (session === undefined) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="hover:bg-accent hover:text-accent-foreground text-sm font-medium"
        disabled
      >
        <LoadingSpinner />
      </Button>
    );
  }

  if (session) {
    return (
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="hover:bg-accent hover:text-accent-foreground text-sm font-medium"
        >
          Sign out
        </Button>
      </form>
    );
  }

  return (
    <form
      action={async () => {
        "use server";
        await signIn("microsoft-entra-id", { redirectTo: "/" });
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="hover:bg-accent hover:text-accent-foreground text-sm font-medium"
      >
        Sign in
      </Button>
    </form>
  );
}
