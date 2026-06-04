import "./globals.css";

export const metadata = {
  title: "CasparCG Scroll Scheduler",
  description: "Next.js ticker page and CasparCG AMCP controller"
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}
