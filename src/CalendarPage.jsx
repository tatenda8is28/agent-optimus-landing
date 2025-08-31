// src/CalendarPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

// --- CORRECT CALENDAR IMPORTS ---
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import './CalendarPage.css';

// --- SETUP FOR react-big-calendar ---
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const defaultAvailability = () => ({ monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] });

const DaySchedule = ({ day, slots, onAddSlot, onRemoveSlot, onSlotChange }) => (
    <div className="day-slot">
        <h3>{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
        <div className="time-slots">
            {slots.length > 0 ? (
                slots.map((slot, index) => (
                    <div key={index} className="time-slot-editor">
                        <input type="time" value={slot.start} onChange={(e) => onSlotChange(index, 'start', e.target.value)} />
                        <span>-</span>
                        <input type="time" value={slot.end} onChange={(e) => onSlotChange(index, 'end', e.target.value)} />
                        <button onClick={() => onRemoveSlot(index)} className="remove-slot-btn" title="Remove slot">&times;</button>
                    </div>
                ))
            ) : ( <p className="no-slots-text">Unavailable</p> )}
            <button onClick={onAddSlot} className="add-slot-btn">+ Add Slot</button>
        </div>
    </div>
);

export default function CalendarPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('bookings');
    const [availability, setAvailability] = useState(defaultAvailability());
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        const unsubscribers = [];

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const availabilityRef = doc(db, 'agent_availability', user.uid);
                const availabilitySnap = await getDoc(availabilityRef);
                if (isMounted) {
                    if (availabilitySnap.exists()) {
                        const data = availabilitySnap.data();
                        const fullData = {};
                        daysOfWeek.forEach(day => { fullData[day] = data[day] || []; });
                        setAvailability(fullData);
                    } else {
                        setAvailability(defaultAvailability());
                    }
                }
            } catch (error) {
                console.error("Error fetching availability:", error);
            }
        };

        const listenForBookings = () => {
            const bookingsQuery = query(collection(db, 'bookings'), where('agentId', '==', user.uid));
            const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
                const bookingsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    title: doc.data().title,
                    start: doc.data().start.toDate(),
                    end: doc.data().end.toDate(),
                }));
                if (isMounted) {
                    setBookings(bookingsData);
                    setIsLoading(false);
                }
            });
            unsubscribers.push(unsubscribe);
        };
        
        fetchData();
        listenForBookings();

        return () => {
            isMounted = false;
            unsubscribers.forEach(unsub => unsub());
        };
    }, [user]);
    
    const handleAddSlot = (day) => setAvailability(prev => ({ ...prev, [day]: [...(prev[day] || []), { start: '09:00', end: '17:00' }] }));
    const handleRemoveSlot = (day, index) => setAvailability(prev => ({ ...prev, [day]: prev[day].filter((_, i) => i !== index) }));
    const handleSlotChange = (day, index, field, value) => {
        const updatedSlots = [...availability[day]];
        updatedSlots[index][field] = value;
        setAvailability(prev => ({ ...prev, [day]: updatedSlots }));
    };
    const handleApplyToWeekdays = () => {
        const fridaySlots = JSON.parse(JSON.stringify(availability.friday || []));
        setAvailability(prev => ({ ...prev, monday: fridaySlots, tuesday: fridaySlots, wednesday: fridaySlots, thursday: fridaySlots }));
    };
    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        setSaveMessage('');
        try {
            const docRef = doc(db, 'agent_availability', user.uid);
            await setDoc(docRef, { agentId: user.uid, ...availability }, { merge: true });
            setSaveMessage('Availability saved successfully!');
        } catch (error) {
            console.error("Error saving availability:", error);
            setSaveMessage('Error: Could not save changes.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    if (isLoading) {
        return <div style={{padding: '40px'}}>Loading Calendar...</div>;
    }

    return (
        <div>
            <div className="page-title-header">
                <h1>My Calendar & Availability</h1>
                {activeTab === 'schedule' && (
                    <button className="btn btn-primary" onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save All Changes'}
                    </button>
                )}
            </div>
            <p className="page-subtitle">Manage your weekly schedule and view appointments booked by your AI agent.</p>
            {saveMessage && <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>{saveMessage}</div>}

            <div className="build-agent-tabs">
                <button onClick={() => setActiveTab('schedule')} className={activeTab === 'schedule' ? 'active' : ''}>Weekly Schedule</button>
                <button onClick={() => setActiveTab('bookings')} className={activeTab === 'bookings' ? 'active' : ''}>Bookings Calendar</button>
            </div>

            <div className="tab-content-wrapper">
                {activeTab === 'schedule' && (
                    <div className="tab-content">
                        <h2>Set Your Recurring Weekly Availability</h2>
                        <div className="weekly-schedule-grid">
                            {daysOfWeek.map(day => (
                                <DaySchedule key={day} day={day} slots={availability[day]}
                                    onAddSlot={() => handleAddSlot(day)}
                                    onRemoveSlot={(index) => handleRemoveSlot(day, index)}
                                    onSlotChange={(index, field, value) => handleSlotChange(day, index, field, value)} />
                            ))}
                        </div>
                         <div className="quick-set-actions">
                            <button className="btn btn-outline" onClick={handleApplyToWeekdays}>Apply Friday's schedule to all weekdays</button>
                        </div>
                    </div>
                )}
                {activeTab === 'bookings' && (
                    <div className="tab-content">
                        <h2>Bookings Calendar</h2>
                        <div className="calendar-container">
                            <Calendar
                                localizer={localizer}
                                events={bookings}
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