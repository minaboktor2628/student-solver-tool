import MultiStepFormModal from "@/components/staff/MultiStepForm/multi-step-form-modal";
import { redirectToForbidden } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { isUserAllowedInActiveTerm } from "@/lib/permission-helpers";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { InfoIcon } from "lucide-react";
import {
  Banner,
  BannerClose,
  BannerDescription,
  BannerTitle,
} from "@/components/banner";

export const metadata = {
  title: "Preferences Form",
  description: "Form for TAs and PLAs to set their preferences",
};

type PageProps = {
  searchParams: Promise<{
    userId?: string;
    termId?: string;
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function PreferencesFormPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const activeTerm = await api.term.getActive();

  if (!session) return redirectToForbidden();

  const userId = searchParams?.userId ?? session?.user.id;
  const termId = searchParams.termId ?? activeTerm?.id;

  if (
    !hasPermission(session.user, "staffPreferenceForm", "viewActiveTerm", {
      userId,
      isAllowedInActiveTerm: await isUserAllowedInActiveTerm(userId),
    })
  ) {
    redirectToForbidden();
  }

  if (!termId) {
    throw new Error("No active term. Please contact admin.");
  }

  const user = await api.staff.getStaffById({ id: userId });

  const isFillingOnBehalf = session.user.id !== userId;

  return (
    <div className="flex flex-col space-y-4 px-4">
      {isFillingOnBehalf && (
        <Banner variant="amber">
          <InfoIcon />
          <BannerTitle>Heads up!</BannerTitle>
          <BannerDescription>
            You are modifying these preferences on behalf of this staff.
          </BannerDescription>
          <BannerClose />
        </Banner>
      )}
      <div>
        <h1 className="text-2xl font-bold">Preferences Form</h1>
        <p className="text-muted-foreground">
          {user?.name?.split(", ").reverse().join(" ")}
        </p>
      </div>
      <MultiStepFormModal
        userId={userId}
        termId={termId}
        redirectOnComplete={"/"}
        inline
      />
    </div>
  );
}
