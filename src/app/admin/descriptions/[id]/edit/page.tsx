import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DescriptionEditor from '@/components/admin/DescriptionEditor';
import AdminNavigation from '@/components/admin/AdminNavigation';

export const metadata: Metadata = {
  title: '설명 편집 - 어드민',
  robots: 'noindex, nofollow',
};

interface EditDescriptionPageProps {
  params: {
    id: string;
  };
}

export default function EditDescriptionPage({ params }: EditDescriptionPageProps) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation title="설명 편집" />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <DescriptionEditor descriptionId={id} />
        </div>
      </main>
    </div>
  );
}