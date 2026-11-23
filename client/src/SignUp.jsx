
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Auth.css";

export default function Signup() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async (event) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    const name = formData.get("name").trim();
    const email = formData.get("email").trim();
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create account.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
          <div className="password-input-wrapper">
  <input
    id="signup-password"
    name="password"
    type={showPassword ? "text" : "password"}
    placeholder="Create a password"
    autoComplete="new-password"
    aria-describedby="password-hint"
    minLength={8}
    required
  />

  <button
    type="button"
    className="password-toggle"
    onClick={() => setShowPassword((prev) => !prev)}
    aria-label={showPassword ? "Hide password" : "Show password"}
  >
    {showPassword ? "Hide" : "Show"}
  </button>
</div>

<p className="password-hint">
  Password must be at least 8 characters long.
</p>

  
          <label htmlFor="signup-confirm-password">
  Confirm password
</label>
<div className="password-input-wrapper">
  <input
    id="signup-confirm-password"
    name="confirmPassword"
    type={showConfirmPassword ? "text" : "password"}
    placeholder="Re-enter your password"
    autoComplete="new-password"
    minLength={8}
    required
  />

  <button
    type="button"
    className="password-toggle"
    onClick={() => setShowConfirmPassword((prev) => !prev)}
    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
  >
    {showConfirmPassword ? "Hide" : "Show"}
  </button>
</div>

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
            {loading ? "Creating account..." : "Create Account"}
            {!loading && <span aria-hidden="true">→</span>}
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
