// src/CalendarPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// --- NEW CALENDAR IMPORTS ---
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import './CalendarPage.css';

// --- SETUP FOR react-big-calendar ---
const locales = { 'en-US': require('date-fns/locale/en-US') };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// --- Placeholder events ---
const placeholderEvents = [
    {
        title: 'Viewing: H001 - Tate',
        start: new Date(2025, 7, 5, 17, 0, 0), // Note: Month is 0-indexed, so 7 = August
        end: new Date(2025, 7, 5, 18, 0, 0),
    },
     {
        title: 'Viewing: H022 - Tate',
        start: new Date(2025, 7, 6, 12, 30, 0),
        end: new Date(2025, 7, 6, 13, 30, 0),
    },
];


export default function CalendarPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overrides'); // Default to the new calendar view
    const [events, setEvents] = useState(placeholderEvents); // State for bookings
    // ... (availability state and handlers can be added back later)
    
    return (
        <div>
            <div className="page-title-header">
                <h1>My Calendar & Availability</h1>
                <button className="btn btn-primary">Save All Changes</button>
            </div>
            <p className="page-subtitle">Manage your weekly schedule and view appointments booked by your AI agent.</p>

            <div className="build-agent-tabs">
                <button onClick={() => setActiveTab('schedule')} className={activeTab === 'schedule' ? 'active' : ''}>Weekly Schedule</button>
                <button onClick={() => setActiveTab('overrides')} className={activeTab === 'overrides' ? 'active' : ''}>Bookings Calendar</button>
            </div>

            <div className="tab-content-wrapper">
                {activeTab === 'schedule' && (
                    <div className="tab-content">
                        <h2>Set Your Recurring Weekly Availability</h2>
                        {/* Placeholder for the weekly schedule editor */}
                        <div className="calendar-placeholder">Weekly Schedule Editor (Coming Soon)</div>
                    </div>
                )}
                {activeTab === 'overrides' && (
                    <div className="tab-content">
                        <h2>Bookings Calendar</h2>
                        <p className="tab-description">View confirmed appointments and add date-specific overrides.</p>
                        <div className="calendar-container">
                            <Calendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                defaultView="month"
                                style={{ height: 650 }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}