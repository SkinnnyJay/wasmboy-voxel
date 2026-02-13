import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'WasmBoy Debugger',
  description: 'Next.js debugger shell for WasmBoy-Voxel migration',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <nav className="topNav">
            <Link href="/">Debugger</Link>
            <Link href="/contracts">Contracts</Link>
          </nav>
          <main className="pageContainer">{children}</main>
        </div>
      </body>
    </html>
  );
}
