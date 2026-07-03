import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ConnectionProvider } from '@/context/ConnectionContext';
import { PlanningProvider } from '@/context/PlanningContext';
import { HomePage } from '@/pages/HomePage';
import { SetupPage } from '@/pages/SetupPage';
import { RoomPage } from '@/pages/RoomPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConnectionProvider>
          <PlanningProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/setup" element={<SetupPage />} />
              <Route path="/room/:roomId" element={<RoomPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </PlanningProvider>
        </ConnectionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
