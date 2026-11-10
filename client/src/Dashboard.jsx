import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Dashboard.css";

export default function Dashboard() {
const [offices, setOffices] = useState([]);
const [loadingOffices, setLoadingOffices] = useState(true);
const [officeError, setOfficeError] = useState("");
const [showCreateOffice, setShowCreateOffice] = useState(false);
const [officeName, setOfficeName] = useState("");
const [officeDescription, setOfficeDescription] = useState("");
const [officeVisibility, setOfficeVisibility] = useState("private");
const [creatingOffice, setCreatingOffice] = useState(false);
const [createOfficeError, setCreateOfficeError] = useState("");

useEffect(() => {
  const fetchOffices = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/offices",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load offices.");
      }

      setOffices(data.offices || []);
    } catch (error) {
      console.error("Error fetching offices:", error);
      setOfficeError(error.message);
    } finally {
      setLoadingOffices(false);
    }
  };

  fetchOffices();
}, []);

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const handleCreateOffice = async (e) => {
  e.preventDefault();

  setCreatingOffice(true);
  setCreateOfficeError("");

  try {
    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:5000/api/offices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: officeName,
        description: officeDescription,
        visibility: officeVisibility,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create office.");
    }

    // Refresh the offices list
    const officesResponse = await fetch(
      "http://localhost:5000/api/offices",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const officesData = await officesResponse.json();

    if (!officesResponse.ok) {
      throw new Error(officesData.message || "Office created, but refresh failed.");
    }

    setOffices(officesData.offices || []);

    setOfficeName("");
    setOfficeDescription("");
    setOfficeVisibility("private");
    setShowCreateOffice(false);

  } catch (error) {
    console.error("Create office error:", error);
    setCreateOfficeError(error.message);
  } finally {
    setCreatingOffice(false);
  }
};

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
          <div className="sidebar-link">
            <span>⚙</span> Settings
          </div>

          <div className="sidebar-profile">
            <div className="profile-avatar">{userInitial}</div>
            <div>
              <strong>{userName}</strong>
              <small>{userEmail || "Workspace Member"}</small>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-link"
            onClick={handleLogout}
          >
            <span>↪</span> Logout
          </button>
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
                <h1>Welcome back, {userName}!</h1>
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

            {/* My Offices */}
<section className="dashboard-panel offices-panel">
  <div className="panel-heading">
    <div>
      <h2>My Offices</h2>
      <p>Your created and joined workspaces</p>
    </div>

    <button
      className="create-office-button"
      onClick={() => setShowCreateOffice(true)}
      type="button"
    >
      + Create Office
    </button>
  </div>

  {loadingOffices ? (
    <p>Loading your offices...</p>
  ) : officeError ? (
    <p className="office-error">{officeError}</p>
  ) : offices.length === 0 ? (
    <div className="empty-offices">
      <p>You haven't joined or created any offices yet.</p>
      <p>Create your first persistent workspace to get started!</p>
    </div>
  ) : (
    <div className="offices-list">
      {offices.map((office) => (
        <article className="office-card" key={office._id}>
          <div className="office-card-info">
            <h3>{office.name}</h3>

            <p>
              {office.description || "Your virtual workspace"}
            </p>

            <span className="office-visibility">
              {office.visibility}
            </span>
          </div>

          <button
            className="enter-office-button"
            type="button"
            onClick={() =>
              navigate(
                `/office?roomId=${encodeURIComponent(office.roomId)}`
              )
            }
          >
            Enter Office →
          </button>
        </article>
      ))}
    </div>
  )}
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

      {/* Create Office Modal */}
{showCreateOffice && (
  <div className="office-modal-overlay">
    <div className="office-modal">

      <button
        type="button"
        className="office-modal-close"
        onClick={() => {
          setShowCreateOffice(false);
          setCreateOfficeError("");
        }}
      >
        ×
      </button>

      <h2>Create a New Office</h2>

      <p className="office-modal-subtitle">
        Set up your own persistent virtual workspace.
      </p>

      <form onSubmit={handleCreateOffice}>

        <label>Office Name</label>
        <input
          type="text"
          placeholder="Enter office name"
          value={officeName}
          onChange={(e) => setOfficeName(e.target.value)}
          required
        />

        <label>Description</label>
        <textarea
          placeholder="Describe your workspace"
          value={officeDescription}
          onChange={(e) => setOfficeDescription(e.target.value)}
        />

        <label>Office Visibility</label>
        <select
          value={officeVisibility}
          onChange={(e) => setOfficeVisibility(e.target.value)}
        >
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>

        {createOfficeError && (
          <p className="office-error">{createOfficeError}</p>
        )}

        <button
          type="submit"
          className="create-office-submit"
          disabled={creatingOffice}
        >
          {creatingOffice ? "Creating..." : "Create Office →"}
        </button>

      </form>
    </div>
  </div>
)}
    </div>
  );
}
