import { Link } from 'react-router-dom'
import DataTable from '../components/DataTable'
import { useAuth } from '../hooks/useAuth'
import { useReferenceDataStore } from '../stores/referenceDataStore'
import { formatDateToMmDdYyyy } from '../utils/formatDate'

const skillColumns = [
  { key: 'skillID', header: 'Skill ID' },
  { key: 'skillName', header: 'Name' },
  { key: 'skillDescription', header: 'Description' },
  { key: 'costXP', header: 'XP Cost' },
  { key: 'costWill', header: 'Will Cost' },
  { key: 'costMind', header: 'Mind Cost' },
  { key: 'createdAt', header: 'Created', format: formatDateToMmDdYyyy },
]

export default function SkillManagementPage() {
  const { loading: authLoading } = useAuth()
  const skills = useReferenceDataStore((state) => state.skills)
  const loading = useReferenceDataStore((state) => state.skillsLoading)
  const error = useReferenceDataStore((state) => state.skillsError)

  return (
    <div className="list-page">
      <div className="list-page-header">
        <h1>Skills</h1>
        <Link className="dashboard-action-link" to="/admin/skills/new/edit">
          Create Skill
        </Link>
      </div>

      {error ? (
        <p className="list-page-error" role="alert">
          {error}
        </p>
      ) : null}

      {authLoading || loading ? (
        <p className="list-page-loading" role="status">
          Loading skills…
        </p>
      ) : (
        <DataTable
          data={skills}
          columns={skillColumns}
          emptyMessage="No skills found."
          link="/admin/skills/:id/edit"
          linkId="id"
        />
      )}
    </div>
  )
}
