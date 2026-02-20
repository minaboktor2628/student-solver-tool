"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";

const SingleUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(Role),
});

export type SingleUserFormValues = z.infer<typeof SingleUserSchema>;

export function SingleAddUserForm({
  onSubmit,
  submitLabel = "Add User",
  disabled = false,
}: {
  onSubmit: (values: SingleUserFormValues) => void | Promise<void>;
  submitLabel?: string;
  disabled?: boolean;
}) {
  const form = useForm<SingleUserFormValues>({
    resolver: zodResolver(SingleUserSchema),
    defaultValues: { name: "", email: "", role: Role.PLA },
  });

  async function handleSubmit(values: SingleUserFormValues) {
    try {
      await onSubmit(values);
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add user");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input {...form.register("name")} placeholder="Anthony, Roman" />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input
              {...form.register("email")}
              placeholder="ranthony@wpi.edu"
              type="email"
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Role</FormLabel>
          <FormControl>
            <select
              {...form.register("role")}
              className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              disabled={disabled}
            >
              {Object.values(Role).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </FormControl>
          <FormMessage />
        </FormItem>

        <div className="flex justify-end">
          <Button type="submit" disabled={disabled} variant="default">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
