import { auth } from "@/server/auth";
import ProfessorPreferenceForm from "@/components/professor/preference-form/professor-preference-form";
import { hasPermission } from "@/lib/permissions";
import { isUserAllowedInActiveTerm } from "@/lib/permission-helpers";
import { redirectToForbidden } from "@/lib/navigation";
import { api } from "@/trpc/server";
import { InfoIcon } from "lucide-react";
import {
  Banner,
  BannerClose,
  BannerDescription,
  BannerTitle,
} from "@/components/banner";

type PageProps = {
  searchParams: Promise<{
    userId?: string;
    termId?: string;
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function ProfessorPreferencesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const activeTerm = await api.term.getActive();

  if (!session) return redirectToForbidden();

  const userId = searchParams?.userId ?? session?.user.id;
  const termId = searchParams?.termId ?? activeTerm?.id;

  if (!termId) throw new Error("No active term. Please contact admin.");

  if (
    !hasPermission(session.user, "professorPreferenceForm", "viewActiveTerm", {
      userId,
      isAllowedInActiveTerm: await isUserAllowedInActiveTerm(userId),
    })
  ) {
    redirectToForbidden();
  }

  const isFillingOnBehalf = session.user.id !== userId;

  return (
    <div className="flex flex-col space-y-4 px-4">
      {isFillingOnBehalf && (
        <Banner variant="amber">
          <InfoIcon />
          <BannerTitle>Heads up!</BannerTitle>
          <BannerDescription>
            You are modifying these preferences on behalf of this professor.
          </BannerDescription>
          <BannerClose />
        </Banner>
      )}
      <ProfessorPreferenceForm userId={userId} termId={termId} />
    </div>
  );
}
