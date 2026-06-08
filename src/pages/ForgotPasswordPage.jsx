import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthFormCard from '../components/AuthFormCard'
import { useAuth } from '../hooks/useAuth'
import { requestPasswordReset } from '../services/authService'
import { getDashboardPath } from '../routes/routeRegistry'

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, userType, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState(location.state?.error ?? '')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (location.state?.error) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state?.error, navigate])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(getDashboardPath(userType), { replace: true })
    }
  }, [authLoading, isAuthenticated, userType, navigate])

  function validateForm() {
    const errors = {}

    if (!email.trim()) {
      errors.email = 'Email is required.'
    } else if (!isValidEmail(email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')
    setSuccessMessage('')

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      await requestPasswordReset({ email: email.trim() })
      setSuccessMessage(
        'If an account exists for that email, a password reset link has been sent.',
      )
      setEmail('')
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
    <AuthFormCard title="Forgot password" subtitle="Enter your email to receive a reset link">
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
          <label className="auth-form-label" htmlFor="forgot-password-email">
            Email
          </label>
          <input
            id="forgot-password-email"
            className="auth-form-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'forgot-password-email-error' : undefined}
          />
          {fieldErrors.email ? (
            <p className="auth-form-field-error" id="forgot-password-email-error" role="alert">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <button className="auth-form-submit" type="submit" disabled={submitting}>
          {submitting ? 'Sending reset link…' : 'Send reset link'}
        </button>
      </form>

      <p className="auth-form-footer">
        Remember your password?{' '}
        <Link className="auth-form-link" to="/login">
          Sign in
        </Link>
      </p>
    </AuthFormCard>
  )
}
