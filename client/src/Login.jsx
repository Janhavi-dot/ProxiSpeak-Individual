import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    const email = formData.get("email").trim();
    const password = formData.get("password");

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");

    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
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

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
            {!loading && <span aria-hidden="true">→</span>}
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