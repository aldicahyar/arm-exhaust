import type { Metadata } from 'next';
import './globals.css';
import { HeaderTabs, SiteFooter, SmoothScroll, AppChrome, NoticeProvider, DynamicIslandNotice } from '@/shared/components';

export const metadata: Metadata = {
  title: 'ARM Exhaust',
  description: 'Custom motorcycle exhausts — locally crafted, globally trusted',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Geist:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Readex+Pro:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0A0A0B] text-white antialiased">
        <NoticeProvider>
          <DynamicIslandNotice />
          <SmoothScroll />
          <AppChrome>
            <HeaderTabs />
          </AppChrome>
          {children}
          <AppChrome>
            <SiteFooter />
          </AppChrome>
        </NoticeProvider>
      </body>
    </html>
  );
}
