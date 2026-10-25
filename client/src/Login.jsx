import { Link } from "react-router-dom";
import "./Auth.css";

export default function Login() {
  const handleLogin = (event) => {
    event.preventDefault();
    alert("Login functionality will be connected in Phase 3.");
  };

  return (
    <main className="auth-page">
      <Link to="/" className="auth-brand">
        Proxi<span>Speak</span>
      </Link>

      <section className="auth-card">
        <div className="auth-decoration">
          <span className="auth-decoration-dot" />
          Welcome back
        </div>

        <h1>Login to ProxiSpeak</h1>

        <p className="auth-subtitle">
          Step back into your virtual workspace.
        </p>

        <form onSubmit={handleLogin} className="auth-form">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          <button type="submit" className="auth-submit">
            Login <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
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
