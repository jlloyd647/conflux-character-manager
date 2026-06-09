import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DataTable from '../components/DataTable'
import { useAuth } from '../hooks/useAuth'
import { getAllSkills } from '../services/skillService'
import { formatDateToMmDdYyyy } from '../utils/formatDate'

const skillColumns = [
  { key: 'skill_id', header: 'Skill ID' },
  { key: 'name', header: 'Name' },
  { key: 'description', header: 'Description' },
  { key: 'cost_xp', header: 'XP Cost' },
  { key: 'cost_will', header: 'Will Cost' },
  { key: 'cost_mind', header: 'Mind Cost' },
  { key: 'created_at', header: 'Created', format: formatDateToMmDdYyyy },
]

export default function SkillManagementPage() {
  const { loading: authLoading } = useAuth()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) {
      return undefined
    }

    let active = true

    getAllSkills()
      .then((data) => {
        if (active) {
          setSkills(data)
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [authLoading])

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
