export default function AuthFormCard({ title, subtitle, children }) {
  return (
    <div className="auth-form-page">
      <div className="auth-form-card">
        <h1 className="auth-form-title">{title}</h1>
        {subtitle ? <p className="auth-form-subtitle">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  )
}
