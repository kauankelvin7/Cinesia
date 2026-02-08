import { useEffect, useState } from 'react';

// Hook para detectar layout mobile ou desktop baseado na classe do body
export function useDeviceLayout() {
  const [layout, setLayout] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.body.classList.contains('mobile-layout') ? 'mobile' : 'desktop';
    }
    return 'desktop';
  });

  useEffect(() => {
    const updateLayout = () => {
      setLayout(document.body.classList.contains('mobile-layout') ? 'mobile' : 'desktop');
    };
    window.addEventListener('resize', updateLayout);
    updateLayout();
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  return layout;
}
