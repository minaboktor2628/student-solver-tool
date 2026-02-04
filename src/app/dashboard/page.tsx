import DashboardContent from "./dashboard-content";

export default async function DashboardPage() {
  return (
    <>
      <p data-testid="dashboard-page">STS Coordinator Dashboard TEST</p>
      <DashboardContent />
    </>
  );
}
