import FormTriggerButton from "@/components/MultiStepForm/form-trigger-button";
import MultiStepFormModal from "@/components/MultiStepForm/multi-step-form-modal";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Preferences Form",
  description: "Form for TAs and PLAs to set their preferences",
};

export default async function PreferencesFormPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Preferences Form</h1>
      <p className="text-muted-foreground mb-4">
        Complete the steps to set your preferences.
      </p>
      <MultiStepFormModal userId={session.user.id} inline />
    </div>
  );
}
