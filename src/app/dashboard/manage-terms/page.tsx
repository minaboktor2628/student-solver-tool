import { TermTable } from "./term-table";
import { CreateTermDialogForm } from "./create-term-form";

export default async function MangageTermsPage() {
  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex flex-row content-center justify-between">
        <h1 className="text-foreground text-3xl font-bold">Manage Terms</h1>
        <CreateTermDialogForm />
      </div>
      <TermTable />
    </div>
  );
}
