import { Link } from "react-router-dom";
import "./Auth.css";

export default function Signup() {
  const handleSignup = (event) => {
    event.preventDefault();
    alert("Account creation will be connected in Phase 3.");
  };

  return (
    <main className="auth-page">
      <Link to="/" className="auth-brand">
        Proxi<span>Speak</span>
      </Link>

      <section className="auth-card signup-card">
        <div className="auth-decoration">
          <span className="auth-decoration-dot" />
          Your workspace awaits
        </div>

        <h1>Create your account</h1>

        <p className="auth-subtitle">
          Join your team in a more connected workspace.
        </p>

        <form onSubmit={handleSignup} className="auth-form">
          <label htmlFor="signup-name">Full name</label>
          <input
            id="signup-name"
            name="name"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />

          <label htmlFor="signup-email">Email address</label>
          <input
            id="signup-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            name="password"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label htmlFor="signup-confirm-password">
            Confirm password
          </label>
          <input
            id="signup-confirm-password"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <button type="submit" className="auth-submit">
            Create Account <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>

        <Link to="/" className="auth-home-link">
          ← Back to homepage
        </Link>
      </section>

      <p className="auth-footer">
        Bringing people closer, one conversation at a time.
      </p>
    </main>
  );
}
