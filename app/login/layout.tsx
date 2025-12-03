import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased bg-slate-100 m-0 p-0`}>
        {children}
      </body>
    </html>
  );
}
