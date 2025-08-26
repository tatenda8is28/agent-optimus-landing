import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export default function GoogleAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Make sure the gtag function is available
    if (typeof window.gtag === 'function') {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]); // Rerun this effect every time the location changes

  return null; // This component doesn't render anything
}