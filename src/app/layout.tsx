import "./globals.css";

export const metadata = {
  title: "Надтай үерхээч 💘",
  description: "Cute proposal with Yes/No buttons and a romantic vibe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
