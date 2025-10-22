import { redirect } from "next/navigation";

import { AuthError } from "next-auth";
import { signIn } from "@/server/auth";
import { env } from "@/env";
import { testingPasswordMap } from "@/server/auth/testing-helpers";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { callbackUrl } = await searchParams;

  if (env.NODE_ENV === "production") {
    return redirect(
      `/api/auth/signin/microsoft-entra-id?callbackUrl=${encodeURIComponent(callbackUrl ?? "")}`,
    );
  }

  const profiles = Object.entries(testingPasswordMap).map(
    ([password, roles]) => ({
      id: password,
      label: `${password}  (${roles.join(", ")})`,
    }),
  );

  async function devSignin(formData: FormData) {
    "use server";
    try {
      const password = formData.get("profile") ?? "";
      if (!password) throw new Error("No profile selected");

      await signIn("credentials", {
        password,
        redirectTo: callbackUrl ?? "",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return redirect(`/error?error=${error.type}`);
      }
      throw error;
    }
  }

  async function microsoftSignin() {
    "use server";
    try {
      await signIn("microsoft-entra-id", {
        redirectTo: callbackUrl ?? "",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return redirect(`/error?error=${error.type}`);
      }
      throw error;
    }
  }

  return (
    <div className="bg-background/70 -mt-16 flex h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <a
                href="#"
                className="flex flex-col items-center gap-2 font-medium"
              >
                {/* <div className="flex size-8 items-center justify-center rounded-md"> */}
                {/*   <GalleryVerticalEnd className="size-6" /> */}
                {/* </div> */}
                <span className="sr-only">STS</span>
              </a>
              <h1 className="text-xl font-bold">Welcome to STS</h1>
              <FieldDescription>
                This is a dev only login page.
              </FieldDescription>
            </div>
            <form action={devSignin} className="flex flex-col space-y-6">
              <Field>
                <FieldLabel htmlFor="profile">Account</FieldLabel>
                <div className="grid gap-2">
                  <Select name="profile" defaultValue={profiles[0]?.id}>
                    <SelectTrigger
                      id="profile"
                      aria-label="Dev profile selector"
                      className="w-full"
                    >
                      <SelectValue placeholder="Select a profile…" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Field>
              <Field>
                <Button type="submit">Login</Button>
              </Field>
            </form>

            <FieldSeparator>Or</FieldSeparator>
            <form action={microsoftSignin}>
              <Field>
                <Button variant="outline" type="submit">
                  <MicrosoftIcon />
                  Continue with Microsoft
                </Button>
              </Field>
            </form>
          </FieldGroup>
        </div>
      </div>
    </div>
  );
}

function MicrosoftIcon() {
  return (
    <svg
      width="256px"
      height="256px"
      viewBox="0 0 256 256"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
    >
      <title>Microsoft</title>
      <g>
        <polygon
          fill="#F1511B"
          points="121.666095 121.666095 0 121.666095 0 0 121.666095 0"
        />
        <polygon
          fill="#80CC28"
          points="256 121.666095 134.335356 121.666095 134.335356 0 256 0"
        />
        <polygon
          fill="#00ADEF"
          points="121.663194 256.002188 0 256.002188 0 134.336095 121.663194 134.336095"
        />
        <polygon
          fill="#FBBC09"
          points="256 256.002188 134.335356 256.002188 134.335356 134.336095 256 134.336095"
        />
      </g>
    </svg>
  );
}
