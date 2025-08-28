// src/BuildAgentPage.jsx
import { useState } from 'react';
import './BuildAgentPage.css';

export default function BuildAgentPage() {
    const [activeTab, setActiveTab] = useState('knowledge');
    
    return (
        <div>
            <div className="page-title-header">
                <h1>Build My Agent</h1>
                <button className="btn btn-primary">Save All Changes</button>
            </div>
            <p className="page-subtitle">This is your AI Studio. Customize your agent's knowledge, sales script, and personality to perfectly match your brand.</p>

            <div className="build-agent-tabs">
                <button onClick={() => setActiveTab('knowledge')} className={activeTab === 'knowledge' ? 'active' : ''}>Knowledge Base</button>
                <button onClick={() => setActiveTab('playbook')} className={activeTab === 'playbook' ? 'active' : ''}>Sales Playbook</button>
                <button onClick={() => setActiveTab('personality')} className={activeTab === 'personality' ? 'active' : ''}>Personality</button>
                <button onClick={() => setActiveTab('dnc')} className={activeTab === 'dnc' ? 'active' : ''}>Do Not Contact</button>
            </div>

            <div className="tab-content-wrapper">
                {activeTab === 'knowledge' && (
                    <div className="tab-content">
                        <h2>The Brain: What your agent needs to know</h2>
                        <p className="tab-description">Upload documents, add links, or type answers to common questions.</p>
                        <div className="form-card">
                            <label>Upload Knowledge Files (PDF, DOCX, TXT)</label>
                            <div className="file-drop-zone">Drag & Drop Files Here or Click to Browse</div>
                        </div>
                    </div>
                )}
                {activeTab === 'playbook' && (
                    <div className="tab-content">
                        <h2>The Script: How your agent should sell</h2>
                        <p className="tab-description">Customize the exact questions and statements in your sales funnel.</p>
                         <div className="form-card">
                            <label>Initial Greeting</label>
                            <input type="text" defaultValue="Hi [Buyer Name]! Michael here from Rawson Properties..." />
                         </div>
                    </div>
                )}
                 {activeTab === 'personality' && (
                    <div className="tab-content">
                        <h2>The Vibe: Define your agent's personality</h2>
                        <p className="tab-description">Adjust the sliders to match your brand's tone of voice.</p>
                         <div className="form-card">
                            <label>Professionalism</label>
                            <input type="range" className="personality-slider" />
                            <div className="slider-labels"><span>Formal</span><span>Casual & Friendly</span></div>
                         </div>
                    </div>
                )}
                {activeTab === 'dnc' && (
                    <div className="tab-content">
                        <h2>Do Not Contact List</h2>
                        <p className="tab-description">Add WhatsApp numbers that your agent should never contact. Add one number per line.</p>
                         <div className="form-card">
                            <label htmlFor="dnc-list">Enter numbers below</label>
                            <textarea 
                                id="dnc-list"
                                className="dnc-textarea"
                                placeholder="e.g. +27821234567&#10;+27831234568"
                                rows="10"
                            ></textarea>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
}