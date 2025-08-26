import { useEffect, useState } from 'react';

// Helper function to send events
const trackEvent = (eventName, eventParams) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, eventParams);
    }
};

export function useScrollTracking() {
    const [milestones, setMilestones] = useState({});

    useEffect(() => {
        const handleScroll = () => {
            const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollableHeight <= 0) return; // Avoid division by zero on short pages

            const scrollPercentage = Math.round((window.scrollY / scrollableHeight) * 100);

            const checkMilestone = (milestone) => {
                // Check if percentage is past the milestone AND we haven't tracked it for the current page
                if (scrollPercentage >= milestone && !milestones[milestone]) {
                    trackEvent('scroll_depth', {
                        'scroll_milestone': `${milestone}%`,
                    });
                    // Mark this milestone as reached for the current page session
                    setMilestones(prev => ({ ...prev, [milestone]: true }));
                }
            };

            checkMilestone(25);
            checkMilestone(50);
            checkMilestone(75);
            checkMilestone(90);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // Reset milestones on route change by returning a cleanup function
        return () => {
            window.removeEventListener('scroll', handleScroll);
            // We don't reset milestones here so it's per-page load, which is fine.
            // If you want to reset on every navigation, you would need to listen to location changes.
        };
    }, [milestones]); // Rerun effect if milestones change
}