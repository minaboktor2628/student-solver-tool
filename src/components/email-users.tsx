import type { ReactNode } from "react";
import { Button, type ButtonProps } from "./ui/button";
import { MailIcon } from "lucide-react";

export function EmailUsers({
  children,
  emails,
  body,
  subject,
  ...props
}: {
  children?: ReactNode;
  emails: string[];
  body?: string;
  subject?: string;
} & ButtonProps) {
  const params = new URLSearchParams();

  params.append("bcc", emails.join(","));
  if (subject) params.append("subject", subject);
  if (body) params.append("body", body);

  const mailtoString = `mailto:?${params.toString()}`;

  return (
    <Button variant="outline" size="sm" asChild {...props}>
      <a href={mailtoString} className="flex items-center gap-2">
        <MailIcon className="h-4 w-4" />
        {children ?? "Email users"}
      </a>
    </Button>
  );
}
