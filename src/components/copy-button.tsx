"use client";

import { useState } from "react";
import { CopyIcon, Check } from "lucide-react";
import { Button, type ButtonProps } from "./ui/button";

type CopyButtonProps = ButtonProps & {
  value: string;
  timeout?: number; // how long to show checkmark
};

export function CopyButton({
  value,
  timeout = 1500,
  children,
  variant = "ghost",
  size = "icon-sm",
  title = "Copy",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, timeout);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleCopy}
      variant={variant}
      size={size}
      title={title}
      className="p-0"
      {...props}
    >
      {copied ? <Check /> : <CopyIcon />}
      {children}
    </Button>
  );
}
