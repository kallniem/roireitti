import { useState } from "react";
import linkedinLogo from "../assets/linkedin.svg";
import youtubeIcon from "../assets/youtube.svg";
import instagramIcon from "../assets/instagram.svg";
import facebookIcon from "../assets/facebook.svg";
import tiktokIcon from "../assets/tiktok.svg";
import websiteIcon from "../assets/website.svg";

function InfoCard({ item, onClose }) {
    const [isClosing, setIsClosing] = useState(false);

    const title = item.title;
    const description = item.description;
    const dataSource = item.dataSource;
    const socialMedia = item.socialMedia;

    const handleClose = () => {
        if (!isClosing) {
            setIsClosing(true);
        }
    };

    const handleAnimationEnd = (event) => {
        if (isClosing && event.currentTarget === event.target) {
            onClose?.();
        }
    };

    return (
        <div
            className={`info-card${isClosing ? ' closing' : ''}`}
            onAnimationEnd={handleAnimationEnd}
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'white',
                padding: '15px',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
                zIndex: 10,
                borderTop: '1px solid #ddd',
                borderRadius: '1rem 1rem 0 0',
                margin: '0 0.5rem 0 0.5rem'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 'large' }}>
                        {title}
                    </h3>
                    <div style={{ maxHeight: '10rem', overflowY: 'scroll', margin: '1rem' }}>
                        <p style={{ fontSize: 'medium', margin: '0 0 8px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {description}
                        </p>
                    </div>
                    <div className='flex-row align-center no-stack' style={{gap: '0.5rem'}}>
                        {socialMedia && (
                        socialMedia.socialMediaLinks.map((link, index) => 
                        {
                            let icon = '';
                            switch (link.linkType) {
                                case 'linkedin':
                                    icon = linkedinLogo
                                    break
                                case 'youtube':
                                    icon = youtubeIcon
                                    break
                                case 'instagram':
                                    icon = instagramIcon
                                    break
                                case 'facebook':
                                    icon = facebookIcon
                                    break
                                case 'tik_tok':
                                    icon = tiktokIcon
                                    break
                                default:
                                    icon = websiteIcon
                            }

                            return (
                                <a
                                key={link.id ?? index}                     // <-- always give a stable key
                                href={link.verifiedLink.url}
                                target="_blank"                            // open in a new tab
                                rel="noopener noreferrer"                  // security + performance
                                style={{ display: 'inline-block', margin: 4 }} // optional spacing
                                >
                                <img
                                    src={icon}
                                    alt={link.linkType ?? 'social media'}   // accessibility
                                    style={{ width: 24, cursor: 'pointer' }}
                                />
                                </a>
                            )
                        }
                        ))}
                    </div>
                    {dataSource && (
                        <em style={{ color: '#666' }}>{dataSource}</em>
                    )}
                </div>
                <button 
                    onClick={handleClose}
                    style={{
                        aspectRatio: '1/1',
                        marginLeft: '15px',
                        padding: '5px 10px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ccc',
                        borderRadius: '50%',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>
            </div>
        </div>
    )
}

export default InfoCard;