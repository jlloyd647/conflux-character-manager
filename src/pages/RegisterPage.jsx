import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthFormCard from '../components/AuthFormCard'
import { useAuth } from '../hooks/useAuth'
import { register } from '../services/authService'
import { getPostAuthPath } from '../services/playerService'

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated, userType, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.'
    }

    if (!passwordConfirmation) {
      errors.passwordConfirmation = 'Please confirm your password.'
    } else if (password !== passwordConfirmation) {
      errors.passwordConfirmation = 'Passwords do not match.'
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
      const { session } = await register({ email: email.trim(), password })

      if (session) {
        const path = await getPostAuthPath()
        navigate(path, { replace: true })
        return
      }

      setSuccessMessage(
        'Account created. Check your email to confirm your address, then sign in.',
      )
      setEmail('')
      setPassword('')
      setPasswordConfirmation('')
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
    <AuthFormCard title="Create account" subtitle="Join Conflux to manage your characters">
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
          <label className="auth-form-label" htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
            className="auth-form-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
          />
          {fieldErrors.email ? (
            <p className="auth-form-field-error" id="register-email-error" role="alert">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="auth-form-field">
          <label className="auth-form-label" htmlFor="register-password">
            Password
          </label>
          <input
            id="register-password"
            className="auth-form-input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
          />
          {fieldErrors.password ? (
            <p className="auth-form-field-error" id="register-password-error" role="alert">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div className="auth-form-field">
          <label className="auth-form-label" htmlFor="register-password-confirmation">
            Confirm password
          </label>
          <input
            id="register-password-confirmation"
            className="auth-form-input"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            aria-invalid={Boolean(fieldErrors.passwordConfirmation)}
            aria-describedby={
              fieldErrors.passwordConfirmation ? 'register-password-confirmation-error' : undefined
            }
          />
          {fieldErrors.passwordConfirmation ? (
            <p
              className="auth-form-field-error"
              id="register-password-confirmation-error"
              role="alert"
            >
              {fieldErrors.passwordConfirmation}
            </p>
          ) : null}
        </div>

        <button className="auth-form-submit" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-form-footer">
        Already have an account?{' '}
        <Link className="auth-form-link" to="/login">
          Sign in
        </Link>
      </p>
    </AuthFormCard>
  )
}
