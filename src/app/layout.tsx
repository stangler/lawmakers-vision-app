import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lawmakers Vision',
  description: '日本の衆参議院議員をインタラクティブな地図で可視化するWebアプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
