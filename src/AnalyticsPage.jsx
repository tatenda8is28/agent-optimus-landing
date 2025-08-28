// src/AnalyticsPage.jsx
import MetricCard from './MetricCard.jsx';

export default function AnalyticsPage() {
    return (
        <div>
            <div className="page-title-header">
                <h1>Analytics</h1>
            </div>
            <div className="metrics-grid">
                <MetricCard title="Conversion Rate (Inquiry to Viewing)" value="12%" />
                <MetricCard title="Most Popular Property" value="123 Main St" />
                <MetricCard title="Busiest Day" value="Saturday" />
                <MetricCard title="Total Offers Made" value="3" />
            </div>
            {/* Placeholder for charts */}
            <div style={{marginTop: '40px', padding: '40px', backgroundColor: 'var(--bg-white)', borderRadius: '12px', textAlign: 'center', color: 'var(--ink-light)'}}>
                <p>Lead Funnel and Performance Charts (Coming Soon)</p>
            </div>
        </div>
    );
}