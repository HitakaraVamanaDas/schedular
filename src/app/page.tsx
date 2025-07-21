
'use client';

import PrivateRoute from '@/components/private-route';
import MainLayout from '@/components/main-layout';

export default function SchedulePage() {
  return (
    <PrivateRoute>
      <MainLayout />
    </PrivateRoute>
  );
}
