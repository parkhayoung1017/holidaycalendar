'use client';

interface AdPlaceholderProps {
  type: 'responsive' | 'inline' | 'display' | 'sidebar';
  className?: string;
}

const adSizes = {
  responsive: { width: '100%', height: '250px' },
  inline: { width: '100%', height: '200px' },
  display: { width: '728px', height: '90px' },
  sidebar: { width: '300px', height: '600px' }
};

const adLabels = {
  responsive: 'Responsive Banner',
  inline: 'Inline Banner', 
  display: 'Display Banner',
  sidebar: 'Sidebar Banner'
};

export default function AdPlaceholder({ type, className = '' }: AdPlaceholderProps) {
  const size = adSizes[type];
  const label = adLabels[type];
  
  return (
    <div 
      className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}
      style={{ 
        width: size.width, 
        height: size.height,
        maxWidth: '100%'
      }}
    >
      <div className="text-center text-gray-500">
        <div className="text-lg font-medium mb-2">📢 광고 영역</div>
        <div className="text-sm">{label}</div>
        <div className="text-xs mt-1">
          {size.width} × {size.height}
        </div>
      </div>
    </div>
  );
}