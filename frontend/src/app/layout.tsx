import type { Metadata } from 'next';
import './globals.css';
import { HeaderTabs, SiteFooter, SmoothScroll, AppChrome, NoticeProvider, DynamicIslandNotice, ConfirmProvider } from '@/shared/components';

export const metadata: Metadata = {
  title: 'ARM Exhaust',
  description: 'Custom motorcycle exhausts — locally crafted, globally trusted',
};

interface RootLayoutProps {
  readonly children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="id" className="scrollbar-none" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  const clean = () => {
                    document.querySelectorAll('[bis_skin_checked]').forEach((el) => el.removeAttribute('bis_skin_checked'));
                  };
                  clean();
                  const observer = new MutationObserver(clean);
                  observer.observe(document.documentElement, {
                    attributes: true,
                    subtree: true,
                    attributeFilter: ['bis_skin_checked'],
                  });
                  window.addEventListener('DOMContentLoaded', () => {
                    clean();
                    setTimeout(() => observer.disconnect(), 2000);
                  });
                })();
              `,
            }}
          />
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Geist:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&family=Montserrat:wght@300;400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Readex+Pro:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0A0A0B] text-white antialiased scrollbar-none" suppressHydrationWarning>
        <NoticeProvider>
          <ConfirmProvider>
            <DynamicIslandNotice />
            <SmoothScroll />
            <AppChrome>
              <HeaderTabs />
            </AppChrome>
            {children}
            <AppChrome>
              <SiteFooter />
            </AppChrome>
          </ConfirmProvider>
        </NoticeProvider>
      </body>
    </html>
  );
}
