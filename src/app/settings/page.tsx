
'use client';

import PrivateRoute from '@/components/private-route';
import SettingsPageContent from '@/components/settings-page-content';

export default function SettingsPage() {
  return (
    <PrivateRoute>
      <SettingsPageContent />
    </PrivateRoute>
  );
}
