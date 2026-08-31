import "./globals.css";

export const metadata = {
  title: "Water Futures — County Intervention Priority",
  description: "Population-weighted water disruption risk and intervention priority by Kenyan county.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
