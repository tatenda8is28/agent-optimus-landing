import { useState } from 'react';

const PlayIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" /></svg> );

const VideoModal = ({ videoId, closeModal }) => {
  if (!videoId) return null;
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal}>&times;</button>
        <div className="video-iframe-container">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default function CaseStudiesPage() {
    const [modalVideoId, setModalVideoId] = useState(null);
    const openModal = (id) => setModalVideoId(id);
    const closeModal = () => setModalVideoId(null);

    // --- COPYWRITING UPDATES START HERE ---

    const videoData = [
        { 
            id: 'wCiD3h8BtZc', 
            title: 'The "First Handshake," Perfected.', 
            description: 'The play that guarantees every client gets an instant, professional response in under 60 seconds.' 
        },
        { 
            id: 'wCiD3h8BtZc', 
            title: 'The "Always-On" Calendar.', 
            description: 'The play that turns qualified leads into booked appointments in your calendar, hands-free.' 
        },
        { 
            id: 'wCiD3h8BtZc', 
            title: 'Your "Instant Expert."', 
            description: 'The play that provides detailed property info and answers complex questions instantly, building trust with every lead.' 
        },
        { 
            id: 'wCiD3h8BtZc', 
            title: 'The "Growth Dashboard," Live.', 
            description: 'See how every conversation is automatically synced to your Google Sheet, giving you a live view of your entire pipeline.' 
        },
        { 
            id: 'wCiD3h8BtZc', 
            title: 'The "Brokerage Multiplier."', 
            description: 'The blueprint for deploying Agent Optimus across your entire team, ensuring brand consistency and maximizing deal flow.' 
        },
        { 
            id: 'wCiD3h8BtZc', 
            title: 'The Result: 300% More Qualified Leads.', 
            description: 'Watch the full story of how Michael Stavrou (Rawson Properties) used The Optimus Method to transform his business in 30 days.' 
        },
    ];

    return (
        <main>
            <div className="page-header section">
                <div className="container text-center">
                    <h1>The Optimus Method</h1>
                    <p className="hero-sub">The Blueprints for Automating Your Deal Flow.</p>
                </div>
            </div>
            <section className="section section-muted">
                <div className="container">
                    <div className="grid three-col video-grid">
                    {videoData.map((video, index) => (
                        <div key={index} className="video-card" onClick={() => openModal(video.id)}>
                        <div className="video-thumbnail">
                            <img src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`} alt={video.title} />
                            <div className="play-icon"><PlayIcon /></div>
                        </div>
                        <div className="video-content">
                            <h3>{video.title}</h3>
                            <p>{video.description}</p>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
            </section>
            <VideoModal videoId={modalVideoId} closeModal={closeModal} />
        </main>
    );

    // --- COPYWRITING UPDATES END HERE ---
}