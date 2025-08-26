import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export default function GoogleAnalyticsTracker() {
  const location = useLocation();

  // This effect runs only ONCE when the app first loads.
  // It's responsible for injecting the GA script and initializing it.
  useEffect(() => {
    // Only run this if we have a measurement ID and are in production
    if (!GA_MEASUREMENT_ID || process.env.NODE_ENV !== 'production') {
      return;
    }

    // Check if the script already exists
    if (document.querySelector(`script[src*="${GA_MEASUREMENT_ID}"]`)) {
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    
    // This makes the gtag function globally available
    window.gtag = gtag; 
    
    gtag('js', new Date());

    // Initial config call
    gtag('config', GA_MEASUREMENT_ID);

  }, []); // Empty dependency array ensures this runs only once

  // This effect runs on every page change, sending the page_view event.
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') {
      return;
    }
    
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: location.pathname + location.search,
      page_title: document.title
    });

  }, [location]); // Reruns every time the location changes

  return null; // This component does not render anything
}