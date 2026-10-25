import { Link } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      {/* Left Sidebar */}
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-logo">
          Proxi<span>Speak</span>
        </Link>

        <nav className="sidebar-menu">
          <Link to="/dashboard" className="sidebar-link active">
            <span>▦</span> Dashboard
          </Link>

          <a href="#news" className="sidebar-link">
            <span>◈</span> News & Events
          </a>

          <a href="#messages" className="sidebar-link">
            <span>✉</span> Messages
          </a>

          <Link to="/office" className="sidebar-link">
            <span>⌂</span> Virtual Office
          </Link>

          <a href="#tasks" className="sidebar-link">
            <span>✓</span> My Tasks
          </a>
        </nav>

        <div className="sidebar-bottom">
          <Link to="/" className="sidebar-link">
            <span>⚙</span> Settings
          </Link>

          <div className="sidebar-profile">
            <div className="profile-avatar">P</div>
            <div>
              <strong>ProxiSpeak User</strong>
              <small>Workspace Member</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Dashboard */}
      <main className="dashboard-content">
        {/* Top Bar */}
        <header className="dashboard-topbar">

          <div className="dashboard-top-actions">

            <button
              className="theme-button"
              type="button"
              aria-label="Theme preview"
              title="Theme preview"
            >
              ☼
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          <div className="dashboard-center">
            {/* Welcome Banner */}
            <section className="welcome-banner">
              <div className="welcome-copy">
                <p className="dashboard-eyebrow">YOUR WORKSPACE</p>
                <h1>Welcome back!</h1>
                <p>
                  Your space to connect, collaborate, and feel closer to
                  your team.
                </p>

                <Link to="/office" className="dashboard-primary-button">
                  Enter Virtual Office <span>→</span>
                </Link>
              </div>

              <div className="welcome-art" aria-hidden="true">
                <div className="art-circle"></div>
                <div className="art-person person-one">●</div>
                <div className="art-person person-two">●</div>
                <div className="art-person person-three">●</div>
                <div className="art-desk"></div>
                <div className="art-laptop">▰</div>
                <div className="art-sparkle">✦</div>
              </div>
            </section>

            {/* Tasks */}
            <section className="dashboard-panel task-panel" id="tasks">
              <div className="panel-heading">
                <div>
                  <h2>To-do List</h2>
                  <p>Your workspace checklist</p>
                </div>
                <span className="panel-icon">✓</span>
              </div>

              <div className="task-progress">
                <span></span>
              </div>

              <label className="task-item">
                <input type="checkbox" />
                <span>Join your virtual workspace</span>
              </label>

              <label className="task-item">
                <input type="checkbox" />
                <span>Connect with your teammates</span>
              </label>

              <label className="task-item">
                <input type="checkbox" />
                <span>Test proximity audio</span>
              </label>

              <label className="task-item">
                <input type="checkbox" />
                <span>Explore the office environment</span>
              </label>

              <Link to="/office" className="panel-outline-button">
                Open Virtual Office →
              </Link>
            </section>

            {/* Highlight Card */}
            <section className="dashboard-highlight" id="messages">
              <span className="highlight-label">TEAMWORK</span>
              <h2>Great things happen when we connect.</h2>
              <p>
                Move around your virtual office and have natural
                conversations with teammates nearby.
              </p>
              <Link to="/office">Start connecting →</Link>
            </section>
          </div>

          {/* Right Column */}
          <aside className="dashboard-right">
            {/* Quick Access */}
            <section className="dashboard-panel quick-panel">
              <div className="panel-heading">
                <div>
                  <h2>Quick Access</h2>
                  <p>Jump back into your work</p>
                </div>
              </div>

              <Link to="/office" className="quick-link">
                <span className="quick-icon">⌂</span>
                <span>
                  <strong>Virtual Office</strong>
                  <small>Meet your teammates</small>
                </span>
                <span className="quick-arrow">→</span>
              </Link>

              <Link to="/" className="quick-link">
                <span className="quick-icon yellow-icon">⌂</span>
                <span>
                  <strong>Home Page</strong>
                  <small>Explore ProxiSpeak</small>
                </span>
                <span className="quick-arrow">→</span>
              </Link>
            </section>

            {/* News */}
            <section className="dashboard-panel news-panel" id="news">
              <div className="panel-heading">
                <div>
                  <h2>News & Updates</h2>
                  <p>What's happening in ProxiSpeak</p>
                </div>
              </div>

              <article className="news-item">
                <span className="news-tag">FEATURE</span>
                <h3>Your virtual office awaits</h3>
                <p>
                  Enter the office and explore your interactive workspace.
                </p>
              </article>

              <article className="news-item">
                <span className="news-tag yellow-tag">COLLABORATION</span>
                <h3>Connect through proximity</h3>
                <p>
                  Move closer to other avatars to start a conversation.
                </p>
              </article>

              <article className="news-item">
                <span className="news-tag">TIP</span>
                <h3>Check your microphone</h3>
                <p>
                  Allow microphone access when you want to use office audio.
                </p>
              </article>
            </section>

            {/* Time Tracker Preview */}
            <section className="dashboard-panel time-panel">
              <div className="panel-heading">
                <div>
                  <h2>Workspace</h2>
                  <p>Ready for collaboration?</p>
                </div>
                <span className="online-indicator"></span>
              </div>

              <div className="workspace-status">
                <span>●</span> Ready to connect
              </div>

              <Link to="/office" className="dashboard-primary-button full-button">
                Start Working →
              </Link>
            </section>
          </aside>
        </div>

        <footer className="dashboard-footer">
          <span>ProxiSpeak</span>
          <span>Work together. Feel closer.</span>
        </footer>
      </main>
    </div>
  );
}