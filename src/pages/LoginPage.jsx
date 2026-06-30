import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthFormCard from '../components/AuthFormCard'
import { useAuth } from '../hooks/useAuth'
import { login } from '../services/authService'
import { getPostAuthPath } from '../services/playerService'

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, userType, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const successMessage = location.state?.passwordReset
    ? 'Your password has been updated. Sign in with your new password.'
    : ''
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (location.state?.passwordReset) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state?.passwordReset, navigate])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      getPostAuthPath(userType)
        .then((path) => navigate(path, { replace: true }))
        .catch(() => navigate('/dashboard', { replace: true }))
    }
  }, [authLoading, isAuthenticated, userType, navigate])

  function validateForm() {
    const errors = {}

    if (!email.trim()) {
      errors.email = 'Email is required.'
    } else if (!isValidEmail(email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }

    if (!password) {
      errors.password = 'Password is required.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      await login({ email: email.trim(), password })
      const path = await getPostAuthPath()
      navigate(path, { replace: true })
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return null
  }

  return (
    <AuthFormCard title="Sign in" subtitle="Welcome back to Conflux">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {submitError ? (
          <p className="auth-form-error" role="alert">
            {submitError}
          </p>
        ) : null}

        {successMessage ? (
          <p className="auth-form-success" role="status">
            {successMessage}
          </p>
        ) : null}

        <div className="auth-form-field">
          <label className="auth-form-label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            className="auth-form-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
          />
          {fieldErrors.email ? (
            <p className="auth-form-field-error" id="login-email-error" role="alert">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="auth-form-field">
          <label className="auth-form-label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            className="auth-form-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
          />
          {fieldErrors.password ? (
            <p className="auth-form-field-error" id="login-password-error" role="alert">
              {fieldErrors.password}
            </p>
          ) : null}
          <p className="auth-form-helper">
            <Link className="auth-form-link" to="/forgot-password">
              Forgot password?
            </Link>
          </p>
        </div>

        <button className="auth-form-submit" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-form-footer">
        Don&apos;t have an account?{' '}
        <Link className="auth-form-link" to="/register">
          Create one
        </Link>
      </p>
    </AuthFormCard>
  )
}
