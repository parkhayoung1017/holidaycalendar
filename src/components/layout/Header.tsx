import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-semibold text-gray-900">
            World Holiday Calendar
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              홈
            </Link>
            <Link href="/today" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              오늘의 공휴일
            </Link>
            <Link href="/regions" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              대륙별 공휴일
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}