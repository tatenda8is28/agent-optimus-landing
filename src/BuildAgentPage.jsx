// src/BuildAgentPage.jsx
import { useState } from 'react';
import './BuildAgentPage.css'; // We will create this

export default function BuildAgentPage() {
    const [activeTab, setActiveTab] = useState('knowledge');
    return (
        <div>
            <div className="page-title-header">
                <h1>Build My Agent</h1>
                <button className="btn btn-primary">Save Changes</button>
            </div>

            <div className="build-agent-tabs">
                <button onClick={() => setActiveTab('knowledge')} className={activeTab === 'knowledge' ? 'active' : ''}>Knowledge Base</button>
                <button onClick={() => setActiveTab('playbook')} className={activeTab === 'playbook' ? 'active' : ''}>Sales Playbook</button>
                <button onClick={() => setActiveTab('personality')} className={activeTab === 'personality' ? 'active' : ''}>Personality</button>
            </div>

            <div className="tab-content">
                {activeTab === 'knowledge' && (
                    <div>
                        <h2>The Brain: What your agent needs to know</h2>
                        <p className="page-subtitle">Upload documents, add links, or type answers to common questions.</p>
                        <div className="form-card">
                            <label>Upload Knowledge Files (PDF, DOCX, TXT)</label>
                            <div className="file-drop-zone">Drag & Drop Files Here or Click to Browse</div>
                        </div>
                    </div>
                )}
                {activeTab === 'playbook' && (
                    <div>
                        <h2>The Script: How your agent should sell</h2>
                        <p className="page-subtitle">Customize the exact questions and statements in your sales funnel.</p>
                         <div className="form-card">
                            <label>Initial Greeting</label>
                            <input type="text" defaultValue="Hi [Buyer Name]! Michael here from Rawson Properties..." />
                         </div>
                    </div>
                )}
                 {activeTab === 'personality' && (
                    <div>
                        <h2>The Vibe: Define your agent's personality</h2>
                        <p className="page-subtitle">Adjust the sliders to match your brand's tone of voice.</p>
                         <div className="form-card">
                            <label>Professionalism</label>
                            <input type="range" className="personality-slider" />
                            <div className="slider-labels"><span>Formal</span><span>Casual</span></div>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
}