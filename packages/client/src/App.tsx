import { RouterProvider } from 'react-router-dom';
import { WalletProvider } from '@/contexts/WalletContext';
import { AppModeProvider, useAppMode } from '@/contexts/AppModeContext';
import { ToastProvider } from '@/components/common';
import { webRouter, xappRouter } from '@/router';

function AppRouter() {
  const { mode } = useAppMode();
  const router = mode === 'xapp' ? xappRouter : webRouter;
  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <AppModeProvider>
      <WalletProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </WalletProvider>
    </AppModeProvider>
  );
}
