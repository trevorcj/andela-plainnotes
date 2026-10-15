import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/toaster';

export const metadata: Metadata = {
  title: 'PlainNotes',
  description: 'Demystifying dense academic textbooks, lecture notes and past questions into plain words, relatable African analogies, and exam essentials in Pidgin, Yoruba, Hausa, Igbo, French, Swahili and English.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
