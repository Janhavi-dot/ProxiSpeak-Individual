import { Link, useNavigate } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
    const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="homepage">
      <nav className="home-navbar">
        <a className="home-logo" href="#home">
          Proxi<span>Speak</span>
        </a>

        <div className="home-nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="home-nav-actions">
          <button className="home-login" onClick={() => navigate("/login")}>
          Log In
          </button>

          <button
           className="home-signup"
           onClick={() => navigate("/signup")}
         >
           Sign Up
        </button>
        </div>
      </nav>

      <main>
        <section className="home-hero" id="home">
          <div className="hero-content">
            <span className="hero-label">
              YOUR VIRTUAL WORKSPACE
            </span>

            <h1>
              Work together.
              <br />
              <span>Feel closer.</span>
            </h1>

            <p>
              Meet, move, and connect in a virtual office where
              conversations happen naturally. Get closer to your
              teammates and let the conversation begin.
            </p>

            <div className="hero-actions">
              <button
               className="home-signup hero-button"
               onClick={() => navigate("/signup")}
              >
               Get Started <span aria-hidden="true">→</span>
              </button>

              <button
                className="home-secondary-button"
                onClick={() => scrollToSection("features")}
              >
                Explore Features
              </button>
            </div>

            <div className="hero-note">
              <span className="hero-note-dot" />
              A more natural way to work together
            </div>
          </div>

          <div className="hero-visual" aria-label="Virtual office illustration">
            <div className="visual-window">
              <div className="window-top">
                <span />
                <span />
                <span />
                <p>your virtual office</p>
              </div>

              <div className="visual-office">
                <div className="office-window">
                  <div className="window-sky" />
                  <div className="window-horizon" />
                </div>

                <div className="office-shelf">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="office-desk" />

                <div className="office-plant">
                  <span />
                  <span />
                  <span />
                  <div />
                </div>

                <div className="office-avatar avatar-one">
                  <span>J</span>
                </div>

                <div className="office-avatar avatar-two">
                  <span>A</span>
                </div>

                <div className="office-avatar avatar-three">
                  <span>S</span>
                </div>

                <div className="audio-bubble">
                  <span>•••</span>
                  <div className="audio-waves">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <small>Nearby conversation</small>
                </div>
              </div>
            </div>

            <div className="visual-caption">
              <span className="caption-dot" />
              A workspace that brings people closer
            </div>
          </div>
        </section>

        <section className="home-about" id="about">
          <span className="section-eyebrow">ABOUT PROXISPEAK</span>
          <h2>Not just another video call.</h2>
          <p>
            ProxiSpeak brings the feeling of an office into a virtual
            space. Move around, meet teammates, and talk naturally
            when you are nearby.
          </p>
        </section>

        <section className="home-features" id="features">
          <div className="section-heading">
            <span className="section-eyebrow">MADE FOR CONNECTION</span>
            <h2>A workspace that feels more natural.</h2>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon teal-icon">↗</div>
              <h3>Move Freely</h3>
              <p>
                Explore a shared virtual office with avatars that
                move as you do.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon blue-icon">◖</div>
              <h3>Talk Nearby</h3>
              <p>
                Have voice conversations with teammates who are
                close to you.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon wood-icon">◎</div>
              <h3>Feel Connected</h3>
              <p>
                Make everyday collaboration feel more spontaneous
                and engaging.
              </p>
            </article>
          </div>
        </section>

        <section className="home-cta" id="get-started">
          <div>
            <span className="section-eyebrow">YOUR SPACE AWAITS</span>
            <h2>Ready to get a little closer?</h2>
            <p>
              Step into a workspace designed around people and
              conversations.
            </p>
          </div>

          <button
            className="home-signup cta-button"
            onClick={() =>
              window.alert(
                "Account registration will be connected in a later step."
              )
            }
          >
            Create an Account <span aria-hidden="true">→</span>
          </button>
        </section>
      </main>

      <footer className="home-footer" id="contact">
        <a className="home-logo footer-logo" href="#home">
          Proxi<span>Speak</span>
        </a>

        <p>Bringing people closer, one conversation at a time.</p>

        <span>© 2026 ProxiSpeak</span>
      </footer>
    </div>
  );
}
