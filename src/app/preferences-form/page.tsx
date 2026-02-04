import { LoadingSpinner } from "@/components/loading-spinner";
import MultiStepFormModal from "@/components/MultiStepForm/multi-step-form-modal";
import { redirectToForbidden } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { auth } from "@/server/auth";

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
      <h1 className="mb-4 text-2xl font-bold">Preferences Form</h1>
      <p className="text-muted-foreground mb-4">
        Complete the steps to set your preferences.
      </p>
      <MultiStepFormModal userId={userId} inline />
    </div>
  );
}
