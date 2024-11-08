// TelegramProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Define Telegram user and WebApp types
export interface ITelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username: string;
  language_code: string;
}

export interface IWebApp {
  initData: string;
  initDataUnsafe: {
    query_id: string;
    user: ITelegramUser;
    auth_date: string;
    hash: string;
  };
  version: string;
  platform: string;
  colorScheme: string;
  themeParams: {
    link_color: string;
    button_color: string;
    button_text_color: string;
    secondary_bg_color: string;
    hint_color: string;
    bg_color: string;
    text_color: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  isClosingConfirmationEnabled: boolean;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isProgressVisible: boolean;
    isActive: boolean;
  };
  HapticFeedback: any;
}

export interface ITelegramContext {
  webApp?: IWebApp;
  user?: ITelegramUser;
}

// Create the Telegram context
export const TelegramContext = createContext<ITelegramContext>({});

// Create the Telegram provider component
export const TelegramProvider = ({ children }: { children: React.ReactNode }) => {
  const [webApp, setWebApp] = useState<IWebApp | null>(null);

  useEffect(() => {
    // Load the Telegram Web App script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const app = (window as any).Telegram?.WebApp;
      if (app) {
        app.ready();
        setWebApp(app);
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const value = useMemo(() => {
    return webApp
      ? {
          webApp,
          unsafeData: webApp.initDataUnsafe,
          user: webApp.initDataUnsafe.user,
        }
      : {};
  }, [webApp]);

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
};

// Custom hook to use the Telegram context
export const useTelegram = () => useContext(TelegramContext);
