import './globals.css';

export const metadata = {
  title: 'CelikMinda Toddlers — Dunia Ajaib Pembelajaran',
  description: 'Aplikasi pembelajaran interaktif untuk kanak-kanak berumur 1-6 tahun. Belajar ABC, Nombor, Haiwan, Warna dan banyak lagi!',
  keywords: 'kanak-kanak, pembelajaran, pendidikan, ABC, nombor, Bahasa Melayu, toddler, preschool',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ms">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#E8F4FD" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
