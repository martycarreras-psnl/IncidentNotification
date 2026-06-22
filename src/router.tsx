import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { IncidentsListPage } from '@/pages/IncidentsListPage';
import { IncidentDetailPage } from '@/pages/IncidentDetailPage';
import { IncidentNewPage } from '@/pages/IncidentNewPage';
import { SpecialtiesPage } from '@/pages/SpecialtiesPage';

export function AppRouter() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/incidents" element={<IncidentsListPage />} />
        <Route path="/incidents/new" element={<IncidentNewPage />} />
        <Route path="/incidents/:id" element={<IncidentDetailPage />} />
        <Route path="/specialties" element={<SpecialtiesPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}
