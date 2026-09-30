import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppRoutes } from '@/routes/AppRoutes';
import { ConfirmDialogProvider } from '@/components/common/ConfirmDialogProvider';
import { ensureDemoDataSeeded } from '@/store/seedManager';
import { useReservationsStore } from '@/store/reservationsStore';
import { useRequestsStore } from '@/store/requestsStore';

function App() {
  useEffect(() => {
    ensureDemoDataSeeded();
    useReservationsStore.getState().checkExpiries();
    useRequestsStore.getState().checkExpiries();
  }, []);

  return (
    <BrowserRouter>
      <ConfirmDialogProvider>
        <AppRoutes />
      </ConfirmDialogProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#fff', fontSize: '14px' },
          success: { iconTheme: { primary: '#0f766e', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
