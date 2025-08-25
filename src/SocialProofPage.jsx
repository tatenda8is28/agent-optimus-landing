import { Link } from "react-router-dom";

export default function SocialProofPage() {
    const testimonials = [
        {
            quote: "Agent Optimus is a game-changer. I'm closing deals I would have missed entirely. My response time is now instant, 24/7.",
            name: "Michael Stavrou",
            company: "Rawson Properties",
            image: "/images/michael-stavrou.jpg" // Correct, professional path
        },
        {
            quote: "The ability to have my calendar fill up with qualified appointments while I'm in the field is incredible. It's the best assistant I've ever had.",
            name: "Jessica Miller",
            company: "Prestige Realty",
            image: "/images/jessica-miller.jpg" // Correct, professional path
        },
        {
            quote: "I was skeptical about AI, but this is different. It understands real estate. My clients are impressed, and my pipeline has never been fuller.",
            name: "David Chen",
            company: "Urban Dwellings",
            image: "/images/david-chen.jpg" // Correct, professional path
        },
        {
            quote: "The lead qualification is top-notch. It saves me hours every single week by weeding out the tire-kickers automatically.",
            name: "Sarah Jenkins",
            company: "Luxe Homes Inc.",
            image: "/images/sarah-jenkins.jpg" 
        },
        {
            quote: "Our entire brokerage runs on Agent Optimus. It's standardized our client intake and made our whole team more efficient.",
            name: "Tom Richardson",
            company: "The Agency Group",
            image: "/images/tom-richardson.jpg"
        },
        {
            quote: "Seeing every lead and conversation logged automatically in a Google Sheet gives me a perfect overview of my business. It's unbelievably powerful.",
            name: "Emily Rodriguez",
            company: "Coastal Properties",
            image: "/images/emily-rodriguez.jpg"
        }
    ];

    return (
        <main>
            <div className="page-header section">
                <div className="container text-center">
                    <h1>Trusted by Top-Performing Agents</h1>
                    <p className="hero-sub">Agent Optimus is the unfair advantage for agents who refuse to settle for average.</p>
                </div>
            </div>

            <section className="section section-muted">
                <div className="container">
                    <div className="grid three-col testimonial-grid">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="testimonial-card">
                                <p className="testimonial-quote">"{testimonial.quote}"</p>
                                <div className="testimonial-author">
                                    <img src={testimonial.image} alt={testimonial.name} className="author-img" />
                                    <div>
                                        <p className="author-name">{testimonial.name}</p>
                                        <p className="author-company">{testimonial.company}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- NEW, FINAL CTA SECTION --- */}
            <section id="demo" className="section cta-section">
                <div className="container text-center">
                    <h2>Ready to Create Your Own Success Story?</h2>
                    <p className="cta-sub">Join the top-performing agents who are closing more deals with less effort.</p>
                    <Link className="btn btn-primary btn-large" to="/activate">Start Your Free 60-Day Trial</Link>
                </div>
            </section>
        </main>
    );
}