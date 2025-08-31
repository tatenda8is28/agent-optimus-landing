// src/CalendarPage.jsx
import { useState } from 'react';
import './CalendarPage.css'; // We will create this next

export default function CalendarPage() {
    const [activeTab, setActiveTab] = useState('schedule');

    return (
        <div>
            <div className="page-title-header">
                <h1>My Calendar & Availability</h1>
                {/* A button could go here later, e.g., "Add Manual Booking" */}
            </div>
            <p className="page-subtitle">Manage your weekly schedule and view appointments booked by your AI agent.</p>

            <div className="build-agent-tabs">
                <button onClick={() => setActiveTab('schedule')} className={activeTab === 'schedule' ? 'active' : ''}>Weekly Schedule</button>
                <button onClick={() => setActiveTab('overrides')} className={activeTab === 'overrides' ? 'active' : ''}>Date Overrides</button>
            </div>

            <div className="tab-content-wrapper">
                {activeTab === 'schedule' && (
                    <div className="tab-content">
                        <h2>Set Your Recurring Weekly Availability</h2>
                        <p className="tab-description">Click a day to set the time slots when your agent can book viewings.</p>
                        <div className="weekly-schedule-grid">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                <div key={day} className="day-slot">
                                    <h3>{day}</h3>
                                    <div className="time-slots">
                                        <div className="time-slot">09:00 AM - 12:00 PM</div>
                                        <div className="time-slot">02:00 PM - 05:00 PM</div>
                                        <span className="add-slot-btn">+ Add Slot</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                         <div className="quick-set-actions">
                            <button className="btn btn-outline">Apply to all weekdays</button>
                        </div>
                    </div>
                )}
                {activeTab === 'overrides' && (
                    <div className="tab-content">
                        <h2>Date Overrides & Bookings</h2>
                        <p className="tab-description">Block off specific dates or view confirmed appointments.</p>
                        {/* Placeholder for a real calendar component */}
                        <div className="calendar-placeholder">
                            <p>Full Monthly Calendar View (Coming Soon)</p>
                            <p>This will show confirmed bookings and allow you to set unavailability.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}