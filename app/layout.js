import "./globals.css";
import Link from "next/link";
import { Sparkles, Database } from "lucide-react";

export const metadata = {
  title: "Water Futures Storyboard",
  description: "Kenya County Water Disruption & Intervention Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          background: "rgba(15, 23, 42, 0.85)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 1000
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--cyan-glow)", fontWeight: 800, fontSize: "1.1rem" }}>
              <Sparkles size={18} />
              WATER FUTURES
            </div>
            
            <div style={{ display: "flex", gap: "1rem" }}>
              <Link href="/" style={{ color: "var(--text-primary)", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", padding: "0.4rem 0.8rem", borderRadius: "8px", transition: "background 0.2s" }}>
                👔 Executive Brief
              </Link>
              <Link href="/manager" style={{ color: "var(--text-primary)", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", padding: "0.4rem 0.8rem", borderRadius: "8px", transition: "background 0.2s" }}>
                📊 Operations Manager
              </Link>
              <Link href="/analyst" style={{ color: "var(--text-primary)", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", padding: "0.4rem 0.8rem", borderRadius: "8px", transition: "background 0.2s" }}>
                🔬 Technical Analyst
              </Link>
            </div>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
             When Data Speaks Guidelines Applied
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
