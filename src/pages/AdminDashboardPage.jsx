import ApprovalPendingCharactersSection from '../components/ApprovalPendingCharactersSection'
import ApprovalPendingPlayersSection from '../components/ApprovalPendingPlayersSection'

export default function AdminDashboardPage() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-section dashboard-welcome">
        <h1>Admin Dashboard</h1>
        <p className="dashboard-intro">
          Manage game settings, skills, and items.
        </p>
      </section>

      <ApprovalPendingPlayersSection />
      <ApprovalPendingCharactersSection />
    </div>
  )
}
