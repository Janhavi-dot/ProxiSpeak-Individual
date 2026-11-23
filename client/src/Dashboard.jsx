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
  const [showJoinOffice, setShowJoinOffice] = useState(false);
  const [joinOfficeId, setJoinOfficeId] = useState("");
  const [joiningOffice, setJoiningOffice] = useState(false);
  const [joinOfficeError, setJoinOfficeError] = useState("");
  const [completedTasks, setCompletedTasks] = useState(0);

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:5000/api/offices", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const handleJoinOffice = async () => {
    if (!joinOfficeId.trim()) {
      setJoinOfficeError("Please enter an Office ID.");
      return;
    }

    setJoiningOffice(true);
    setJoinOfficeError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/offices/${encodeURIComponent(
          joinOfficeId.trim()
        )}/join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to join office.");
      }

      const officesResponse = await fetch("http://localhost:5000/api/offices", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const officesData = await officesResponse.json();

      if (officesResponse.ok) {
        setOffices(officesData.offices || []);
      }

      setShowJoinOffice(false);
      setJoinOfficeId("");
    } catch (error) {
      setJoinOfficeError(error.message);
    } finally {
      setJoiningOffice(false);
    }
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

      const officesResponse = await fetch("http://localhost:5000/api/offices", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const officesData = await officesResponse.json();

      if (!officesResponse.ok) {
        throw new Error(
          officesData.message || "Office created, but refresh failed."
        );
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

  const handleTaskToggle = (checked) => {
    setCompletedTasks((prev) =>
      Math.min(4, Math.max(0, checked ? prev + 1 : prev - 1))
    );
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
                  Your space to connect, collaborate, and feel closer to your
                  team.
                </p>
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

                <div className="office-actions">
                  <button
                    className="create-office-button"
                    onClick={() => setShowCreateOffice(true)}
                    type="button"
                  >
                    + Create Office
                  </button>

                  <button
                    className="create-office-button"
                    type="button"
                    onClick={() => {
                      setJoinOfficeError("");
                      setJoinOfficeId("");
                      setShowJoinOffice(true);
                    }}
                  >
                    Join Office
                  </button>
                </div>
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

                        <p>{office.description || "Your virtual workspace"}</p>

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
                  <p>{completedTasks} of 4 tasks completed</p>
                </div>
                <span className="panel-icon">✓</span>
              </div>

              <div className="task-progress">
                <span
                  style={{
                    width: `${(completedTasks / 4) * 100}%`,
                  }}
                ></span>
              </div>

              <label className="task-item">
                <input
                  type="checkbox"
                  onChange={(e) => handleTaskToggle(e.target.checked)}
                />
                <span>Join your virtual workspace</span>
              </label>

              <label className="task-item">
                <input
                  type="checkbox"
                  onChange={(e) => handleTaskToggle(e.target.checked)}
                />
                <span>Connect with your teammates</span>
              </label>

              <label className="task-item">
                <input
                  type="checkbox"
                  onChange={(e) => handleTaskToggle(e.target.checked)}
                />
                <span>Test proximity audio</span>
              </label>

              <label className="task-item">
                <input
                  type="checkbox"
                  onChange={(e) => handleTaskToggle(e.target.checked)}
                />
                <span>Explore the office environment</span>
              </label>
            </section>

            {/* Highlight Card */}
            <section className="dashboard-highlight" id="messages">
              <span className="highlight-label">TEAMWORK</span>
              <h2>Great things happen when we connect.</h2>
              <p>
                Move around your virtual office and have natural conversations
                with teammates nearby.
              </p>
            </section>
          </div>

          {/* Right Column */}
          <aside className="dashboard-right">
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
                <p>Move closer to other avatars to start a conversation.</p>
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
            </section>
          </aside>
        </div>

        <footer className="dashboard-footer">
          <span>ProxiSpeak</span>
          <span>Work together. Feel closer.</span>
        </footer>
      </main>

      {/* Join Office Modal */}
      {showJoinOffice && (
        <div
          className="modal-overlay"
          onClick={() => setShowJoinOffice(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="join-office-header">
              <div className="join-office-icon">⌂</div>
              <h2>Join a Workspace</h2>
              <p>Connect with your team in their virtual office.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleJoinOffice();
              }}
            >
              <label htmlFor="office-id">Office ID</label>
              <input
                id="office-id"
                type="text"
                placeholder="e.g. E21C5181"
                value={joinOfficeId}
onChange={(e) => setJoinOfficeId(e.target.value.trim().toUpperCase())}                autoComplete="off"
              />

              <p className="join-office-hint">
                Ask the office owner to share their Office ID with you.
              </p>

              {joinOfficeError && (
                <p className="modal-error">{joinOfficeError}</p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinOffice(false);
                    setJoinOfficeId("");
                    setJoinOfficeError("");
                  }}
                >
                  Cancel
                </button>

                <button type="submit" disabled={joiningOffice}>
                  {joiningOffice ? "Joining..." : "Join Workspace →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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