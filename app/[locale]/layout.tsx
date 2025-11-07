"use client"

import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from 'next-auth/react';
import { useEffect, useState, use } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Unwrap the params Promise
  const { locale } = use(params);
  const [messages, setMessages] = useState<any>(null);

  useEffect(() => {
    async function loadMessages() {
      const msgs = (await import(`@/messages/${locale}.json`)).default;
      setMessages(msgs);
    }
    loadMessages();
  }, [locale]);

  if (!messages) {
    return null;
  }

  return (
    <ThemeProvider>
      <SessionProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

