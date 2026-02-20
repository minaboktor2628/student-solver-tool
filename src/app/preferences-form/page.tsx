import { LoadingSpinner } from "@/components/loading-spinner";
import MultiStepFormModal from "@/components/staff/MultiStepForm/multi-step-form-modal";
import { redirectToForbidden } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { isUserAllowedInActiveTerm } from "@/lib/permission-helpers";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";

export const metadata = {
  title: "Preferences Form",
  description: "Form for TAs and PLAs to set their preferences",
};

export default async function PreferencesFormPage() {
  const session = await auth();
  const activeTerm = await api.term.getActive();
  const userId = session?.user.id;

  if (!userId) return <LoadingSpinner />;

  if (
    !hasPermission(session.user, "staffPreferenceForm", "viewActiveTerm", {
      userId,
      isAllowedInActiveTerm: await isUserAllowedInActiveTerm(userId),
    })
  ) {
    redirectToForbidden();
  }

  if (!activeTerm) {
    throw new Error("No active term. Please contact admin.");
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Preferences Form</h1>
      <MultiStepFormModal
        userId={userId}
        termId={activeTerm.id}
        redirectOnComplete={"/"}
        inline
      />
    </div>
  );
}
