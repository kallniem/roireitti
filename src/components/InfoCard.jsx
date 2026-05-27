import { useState } from "react";
import linkedinLogo from "../assets/linkedin.svg";
import youtubeIcon from "../assets/youtube.svg";
import instagramIcon from "../assets/instagram.svg";
import facebookIcon from "../assets/facebook.svg";
import tiktokIcon from "../assets/tiktok.svg";
import websiteIcon from "../assets/website.svg";

import cyclistProducts from "../cyclist-certified-products.json";
import welcomCyclistIcon from "../assets/welcome-cyclist.png";
import { useNavigate } from "react-router";
import slugify from "../functions/slugify";

function InfoCard({ item, onClose }) {
    const [isClosing, setIsClosing] = useState(false);
    const navigate = useNavigate();

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

    let content = null;
    let description;
    let dataSource;

    switch (item.type) {
        case "marker":
            const title = item.object.title;
            description = item.object.description;
            dataSource = item.object.dataSource;
            const socialMedia = item.object.socialMedia;
            const companyProducts = cyclistProducts.product.filter((p) => p.company.businessName === item.object.title);

            return (
                <CardBase dataSource={dataSource} onClose={onClose} isClosing={isClosing} handleAnimationEnd={handleAnimationEnd} handleClose={handleClose}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 'large' }}>
                        {title}
                    </h3>
                    <ProductsCarousel products={companyProducts} />
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
                </CardBase>
            )
        case "trail":
            const name = item.object.name;
            const category = item.object.category;
            const length = item.object.lengthKm;
            const difficulty = item.object.difficulty;
            dataSource = "LIPAS";
            description = item.object.description;
            
            return (
                <CardBase dataSource={dataSource} onClose={onClose} isClosing={isClosing} handleAnimationEnd={handleAnimationEnd} handleClose={handleClose}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 'large' }}>
                        {name}
                    </h3>
                    <p style={{ fontSize: 'medium', margin: '0 0 8px 0' }}>
                        <strong>Kategoria:</strong> {category}<br/>
                        <strong>Pituus:</strong> {length} km<br/>
                        <strong>Vaikeus:</strong> --<br/><br/>
                    </p>
                    {description?.length > 0 &&
                    <div style={{ maxHeight: '10rem', overflowY: 'scroll', margin: '1rem' }}>
                        <p style={{ fontSize: 'medium', margin: '0 0 8px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {description}
                        </p>
                    </div>
                    }
                    <div className="flex-column align-center justify-center">
                        <button style={{
                            backgroundColor: 'inherit',
                            border: '2px solid grey',
                            color: 'black',
                            padding: '10px 20px',
                            borderRadius: '2rem',
                            fontSize: '14px',
                            cursor: 'pointer',
                            marginTop: '1rem'
                        }} onClick={() => {
                            navigate(`/trails/${slugify(name)}`);
                        }}>
                            Avaa reittikortti
                        </button>
                    </div>
                </CardBase>
            )
        default:
            console.warn("no type defined for info")
            return null;
    }
}

export default InfoCard;

function CardBase({ children, dataSource = "Please set the data source", onClose, isClosing, handleAnimationEnd, handleClose }) {
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
                    padding: '1rem',
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
                    zIndex: 10,
                    borderTop: '1px solid #ddd',
                    borderRadius: '1rem 1rem 0 0',
                }}>
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        width: '34px',
                        height: '34px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ccc',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center'
                    }}
                >
                    ✕
                </button>
                    { children }
                    {dataSource && (
                        <em style={{ color: '#666' }}>{dataSource}</em>
                    )}
            </div>
    )
}

function ProductsCarousel({ products }) {
    if (!products || products.length === 0) return null;

    const welcomeCyclistCertified = products.find(p => p.productCertificates?.[0]?.certificate === "welcome_cyclist_certificate");

    return (
        <>
        {welcomeCyclistCertified && (
            <img src={welcomCyclistIcon} alt="Welcome Cyclist Certified" style={{ width: 64, marginBottom: '0.5rem' }} />
        )}

        <div style={{ display: 'flex', overflowX: 'auto', gap: '1rem', padding: '0.5rem 0' }}>
            {products.map((product, index) => (
                <div key={index} style={{ flex: '0 0 auto' }}>
                    <h4>{product.productInformations[0].name}</h4>
                </div>
            ))}
        </div>
        </>
    );
}
