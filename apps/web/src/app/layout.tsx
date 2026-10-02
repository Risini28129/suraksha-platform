import type { Metadata } from 'next';
import './style.css';
import './admin.css';
export const metadata: Metadata = {
  title: 'Suraksha · Staff console',
  description: 'Suraksha shared response and support workspace',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
