// src/CalendarPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db, functions } from './firebaseClient';
import { httpsCallable } from 'firebase/functions';
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
    const [modalState, setModalState] = useState({ isOpen: false, data: null, type: null });

    useEffect(() => {
        if (!user) { setIsLoading(false); return; }
        const bookingsQuery = query(collection(db, 'bookings'), where('agentId', '==', user.uid));
        const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({
                id: doc.id, title: doc.data().title,
                start: doc.data().start.toDate(), end: doc.data().end.toDate(),
                type: doc.data().type || 'ai_booking'
            }));
            setEvents(bookingsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);
    
    const handleSelectSlot = useCallback(({ start, end }) => {
        if (start.getTime() === end.getTime()) { end.setHours(start.getHours() + 1); }
        setModalState({ isOpen: true, type: 'create', data: { title: '', start, end } });
    }, []);
    
    const handleSelectEvent = useCallback((event) => {
        setModalState({ isOpen: true, type: 'view', data: event });
    }, []);

    const handleTimeChange = (field, value) => {
        const [hours, minutes] = value.split(':');
        const newDate = new Date(modalState.data[field]);
        newDate.setHours(hours); newDate.setMinutes(minutes);
        setModalState(prev => ({ ...prev, data: { ...prev.data, [field]: newDate }}));
    };

    const handleSaveEvent = async () => {
        const { title, start, end } = modalState.data;
        if (!user || !title) { alert("A title is required."); return; }
        try {
            await addDoc(collection(db, 'bookings'), {
                agentId: user.uid, title: title, start: start, end: end,
                type: 'manual_block', createdAt: serverTimestamp()
            });
            setModalState({ isOpen: false, data: null, type: null });
        } catch (error) { console.error("Error creating manual event:", error); alert(`Failed to save event: ${error.message}`); }
    };
    
    const handleDeleteEvent = async () => {
        const { id } = modalState.data;
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            const deleteBookingFunc = httpsCallable(functions, 'deleteBooking');
            await deleteBookingFunc({ bookingId: id });
            setModalState({ isOpen: false, data: null, type: null });
        } catch (error) { console.error("Error deleting event:", error); alert(`Failed to delete event: ${error.message}`); }
    };

    const eventStyleGetter = (event) => {
        const style = {
            backgroundColor: event.type === 'manual_block' ? '#64748b' : 'var(--green)',
            borderColor: event.type === 'manual_block' ? '#475569' : 'var(--green-dark)',
        };
        return { style };
    };

    if (isLoading) { return <div style={{padding: '40px'}}>Loading Calendar...</div>; }

    return (
        <div>
            <div className="page-title-header"><h1>My Calendar</h1><p className="page-subtitle-alt">Click & drag on the calendar to block out time.</p></div>
            <div className="calendar-container">
                <Calendar localizer={localizer} events={events} startAccessor="start" endAccessor="end"
                    defaultView="month" style={{ height: 700 }} selectable
                    onSelectSlot={handleSelectSlot} onSelectEvent={handleSelectEvent} eventPropGetter={eventStyleGetter} />
            </div>
            {modalState.isOpen && (
                <Modal onClose={() => setModalState({ isOpen: false, data: null, type: null })}>
                    {modalState.type === 'create' && (
                        <>
                            <h2>Block Out Time</h2>
                            <div className="wizard-form-group"><label>Event Title</label><input type="text" placeholder="e.g., Personal Appointment" value={modalState.data.title} onChange={(e) => setModalState({...modalState, data: {...modalState.data, title: e.target.value}})} /></div>
                            <div className="time-input-grid">
                                <div className="wizard-form-group"><label>Start Time</label><input type="time" value={format(modalState.data.start, 'HH:mm')} onChange={(e) => handleTimeChange('start', e.target.value)} /></div>
                                <div className="wizard-form-group"><label>End Time</label><input type="time" value={format(modalState.data.end, 'HH:mm')} onChange={(e) => handleTimeChange('end', e.target.value)} /></div>
                            </div>
                            <p className="time-display">Date: {format(modalState.data.start, 'PPP')}</p>
                            <div className="modal-actions"><button className="btn btn-outline" onClick={() => setModalState({ isOpen: false, data: null, type: null })}>Cancel</button><button className="btn btn-primary" onClick={handleSaveEvent}>Save Event</button></div>
                        </>
                    )}
                    {modalState.type === 'view' && (
                        <>
                            <h2>Event Details</h2>
                            <h3>{modalState.data.title}</h3>
                            <p className="time-display">From: {format(modalState.data.start, 'PPP p')}<br/>To: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{format(modalState.data.end, 'PPP p')}</p>
                            <div className="modal-actions"><button className="btn btn-outline danger-btn" onClick={handleDeleteEvent}>Delete Event</button><button className="btn btn-primary" onClick={() => setModalState({ isOpen: false, data: null, type: null })}>Close</button></div>
                        </>
                    )}
                </Modal>
            )}
        </div>
    );
}