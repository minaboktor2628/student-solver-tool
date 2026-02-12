import { LoadingSpinner } from "@/components/loading-spinner";
import MultiStepFormModal from "@/components/staff/MultiStepForm/multi-step-form-modal";
import { useTerm } from "@/components/term-combobox";
import { redirectToForbidden } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { auth } from "@/server/auth";
import { api } from "@/trpc/react";

export const metadata = {
  title: "Preferences Form",
  description: "Form for TAs and PLAs to set their preferences",
};

export default async function PreferencesFormPage() {
  const session = await auth();
  const userId = session?.user.id;

  if (!userId) return <LoadingSpinner />;

  if (
    !hasPermission(session.user, "staffPreferenceForm", "viewActiveTerm", {
      id: userId,
    })
  ) {
    redirectToForbidden();
  }

  return (
    <div className="p-6">
      <MultiStepFormModal userId={userId} inline />
    </div>
  );
}
