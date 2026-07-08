'use client';

import { ContentForm } from '@/components/admin/content-form';

export default function NewContentPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add New Content</h1>
      <ContentForm />
    </div>
  );
}
