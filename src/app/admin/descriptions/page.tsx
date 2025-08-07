import { Metadata } from 'next';
import DescriptionList from '@/components/admin/DescriptionList';
import AdminNavigation from '@/components/admin/AdminNavigation';

export const metadata: Metadata = {
  title: '공휴일 설명 관리 - 어드민',
  robots: 'noindex, nofollow',
};

export default function DescriptionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation title="공휴일 설명 관리" />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <DescriptionList />
        </div>
      </main>
    </div>
  );
}