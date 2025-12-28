import React, { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const AdSenseSkyscraper = () => {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  useEffect(() => {
    if (typeof window !== 'undefined' && adsenseId) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [adsenseId]);

  if (!adsenseId) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 text-center text-sm text-gray-500 min-h-[600px] flex items-center justify-center">
          📢 AdSense Skyscraper (Configurați NEXT_PUBLIC_ADSENSE_ID)
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-2 border border-gray-100 flex justify-center overflow-hidden min-h-[600px]">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minWidth: '160px', width: '100%' }}
        data-ad-client={`ca-pub-${adsenseId}`}
        data-ad-slot="300600" // Placeholder generic slot ID for 300x600
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

