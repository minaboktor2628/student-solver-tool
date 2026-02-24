import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "../ui/button";
import { InfoIcon } from "lucide-react";

export function NoTermsAlert() {
  return (
    <div className="p-4">
      <Alert>
        <InfoIcon />
        <AlertTitle>There is no selected term right now.</AlertTitle>
        <AlertDescription>
          You can create a term in /manage-terms
        </AlertDescription>
        <AlertAction>
          <Button asChild>
            <Link href="/manage-terms">Create term</Link>
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
}
