import DashboardContent from "./dashboard-content";

export default async function DashboardPage() {
  return (
    <>
      <p data-testid="dashboard-page"></p>
      <DashboardContent />
    </>
  );
}
