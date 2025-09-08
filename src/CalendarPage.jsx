// src/CalendarPage.jsx (FINAL, UNIFIED CALENDAR VERSION)
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import './CalendarPage.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const Modal = ({ children, onClose }) => ( <div className="modal-overlay" onClick={onClose}><div className="modal-content" onClick={(e) => e.stopPropagation()}><button className="modal-close-btn" onClick={onClose}>&times;</button>{children}</div></div> );

export default function CalendarPage() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // --- NEW STATE FOR THE MODAL ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', start: new Date(), end: new Date() });

    useEffect(() => {
        if (!user) { setIsLoading(false); return; }
        setIsLoading(true);
        const bookingsQuery = query(collection(db, 'bookings'), where('agentId', '==', user.uid));
        const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title,
                start: doc.data().start.toDate(),
                end: doc.data().end.toDate(),
                type: doc.data().type || 'ai_booking' // Differentiate event types
            }));
            setEvents(bookingsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);
    
    // --- NEW HANDLER FOR SELECTING SLOTS ---
    const handleSelectSlot = useCallback(({ start, end }) => {
        setNewEvent({ title: '', start, end });
        setIsModalOpen(true);
    }, []);

    // --- NEW HANDLER FOR SAVING MANUAL EVENTS ---
    const handleSaveEvent = async () => {
        if (!user || !newEvent.title) {
            alert("A title is required to block out time.");
            return;
        }
        try {
            await addDoc(collection(db, 'bookings'), {
                agentId: user.uid,
                title: newEvent.title,
                start: newEvent.start,
                end: newEvent.end,
                type: 'manual_block', // Mark as a manual event
                createdAt: serverTimestamp()
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error creating manual event:", error);
            alert("Failed to save event.");
        }
    };

    // --- NEW STYLING LOGIC ---
    const eventStyleGetter = (event) => {
        const style = {
            backgroundColor: event.type === 'manual_block' ? '#64748b' : 'var(--green)', // Grey for manual, Green for AI
            borderColor: event.type === 'manual_block' ? '#475569' : 'var(--green-dark)',
        };
        return { style };
    };

    if (isLoading) {
        return <div style={{padding: '40px'}}>Loading Calendar...</div>;
    }

    return (
        <div>
            <div className="page-title-header">
                <h1>My Calendar</h1>
                <p className="page-subtitle-alt">Click & drag on the calendar to block out time.</p>
            </div>

            <div className="calendar-container">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    defaultView="month"
                    style={{ height: 700 }}
                    selectable // <-- Enable click and drag
                    onSelectSlot={handleSelectSlot}
                    eventPropGetter={eventStyleGetter}
                />
            </div>

            {isModalOpen && (
                <Modal onClose={() => setIsModalOpen(false)}>
                    <h2>Block Out Time</h2>
                    <div className="wizard-form-group">
                        <label>Event Title</label>
                        <input 
                            type="text" 
                            placeholder="e.g., Personal Appointment"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                        />
                    </div>
                    <p className="time-display">
                        From: {format(newEvent.start, 'PPP p')} <br/>
                        To: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{format(newEvent.end, 'PPP p')}
                    </p>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSaveEvent}>Save Event</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}