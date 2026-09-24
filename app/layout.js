import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Water Futures - Kenya Water Storyboard",
  description: "Kenya County Water Disruption & Intervention Decision Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="app-nav">
          {/* Brand */}
          <Link href="/" className="nav-brand">
            {/* Water drop SVG icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0C19 9.5 12 2 12 2Z" fill="currentColor" fillOpacity="0.9"/>
              <path d="M9 17c0 1.657 1.343 3 3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            </svg>
            WATER FUTURES
          </Link>

          {/* Nav Links */}
          <ul className="nav-links">
            <li>
              <Link href="/" className="nav-link">
                {/* Chart/presentation icon */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                </svg>
                Executive Brief
              </Link>
            </li>
            <li>
              <Link href="/manager" className="nav-link">
                {/* Table/list icon */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 3H5a2 2 0 0 0-2 2v4M9 3h10a2 2 0 0 1 2 2v4M9 3v18M3 9h18M3 15h18M3 21h6"/>
                </svg>
                Operations Manager
              </Link>
            </li>
            <li>
              <Link href="/analyst" className="nav-link">
                {/* Scatter/analysis icon */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7.5" cy="7.5" r="1.5"/><circle cx="18" cy="5" r="1.5"/><circle cx="11" cy="19" r="1.5"/><circle cx="16" cy="13" r="1.5"/>
                  <path d="M7.5 7.5 16 13M18 5 16 13M11 19 16 13"/>
                </svg>
                Technical Analyst
              </Link>
            </li>
          </ul>


        </nav>

        {children}
      </body>
    </html>
  );
}
