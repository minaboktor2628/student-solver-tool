import { AlertCircleIcon, ArrowUpRight } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const errorMap = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "Something went wrong.",
  Default: "Something went wrong.",
} as const;

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const error = (await searchParams).error as keyof typeof errorMap;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center space-y-4">
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircleIcon />
        <AlertTitle>Something went wrong. Code: {error}</AlertTitle>
        <AlertDescription>
          {errorMap[error] ?? "Please contact us if this error persists."}
        </AlertDescription>
      </Alert>
      <Button asChild variant="secondary">
        <Link href="/login">
          Back to login <ArrowUpRight />
        </Link>
      </Button>
    </div>
  );
}
