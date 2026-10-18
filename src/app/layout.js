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
  const basePath = process.env.NODE_ENV === 'production' ? '/celikminda' : '';
  return (
    <html lang="ms">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CelikMinda" />
        <meta name="theme-color" content="#2E7D32" />
        <link rel="manifest" href={`${basePath}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${basePath}/images/icon-192.png`} />
        <link rel="icon" type="image/png" sizes="192x192" href={`${basePath}/images/icon-192.png`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('${basePath}/sw.js').catch(function() {});
            });
          }
        `}} />
      </head>
      <body>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
