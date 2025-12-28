import React, { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const AdSenseBanner = () => {
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
      <div className="mt-6 p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 text-center text-sm text-gray-500">
        📢 AdSense Banner (Configurați NEXT_PUBLIC_ADSENSE_ID)
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden flex justify-center w-full min-h-[90px]">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        data-ad-client={`ca-pub-${adsenseId}`}
        data-ad-slot="72890" // Placeholder generic slot ID for 728x90
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

