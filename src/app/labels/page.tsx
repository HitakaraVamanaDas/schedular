
'use client';

import PrivateRoute from '@/components/private-route';
import LabelManagementPageContent from '@/components/label-management-page-content';

export default function LabelsPage() {
  return (
    <PrivateRoute>
        <LabelManagementPageContent />
    </PrivateRoute>
  );
}
