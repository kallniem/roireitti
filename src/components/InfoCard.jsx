import { useState, useEffect } from "react";
import linkedinLogo from "../assets/linkedin.svg";
import youtubeIcon from "../assets/youtube.svg";
import instagramIcon from "../assets/instagram.svg";
import facebookIcon from "../assets/facebook.svg";
import tiktokIcon from "../assets/tiktok.svg";
import websiteIcon from "../assets/website.svg";

import cyclistProducts from "../offline-data/cyclist-certified-products.json";
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

    // reset thumbnail existence flag whenever the shown item changes
    const [hasThumb, setHasThumb] = useState(true);
    useEffect(() => {
        setHasThumb(true);
    }, [item]);

    let content = null;
    let description;
    let dataSource;

    switch (item.type) {
        case "marker":
            const title = item.object.title;
            description = item.object.description;
            dataSource = item.object.data_source;

            const raw = item.object.socialMedia;
            const socialMedia = typeof raw === "string"
            ? (() => { try { return JSON.parse(raw); } catch (e) { console.warn("socialMedia parse failed", e); return {}; } })()
            : (raw || {});

            const companyProducts = cyclistProducts.product.filter((p) => p.company.businessName === item.object.title);

            return (
                <CardBase dataSource={dataSource} onClose={onClose} isClosing={isClosing} handleAnimationEnd={handleAnimationEnd} handleClose={handleClose}>
                    <div style={{ padding: '1rem' }}>
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
                            {Object.keys(socialMedia).length > 0 && (
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
                    </div>
                </CardBase>
            )
        case "trail":
            const name = item.object.name;
            const slug = slugify(name);
            
            let category = item.object.category;
            switch (category) {
                case "road":
                    category = "Maantiepyöräily";
                    break;
                case "mtb":
                    category = "Maastopyöräily";
                    break;
                case "gravel":
                    category = "Gravel";
                    break;
                case "winter":
                    category = "Talvipyöräily";
                    break;
                case "trek":
                    category = "Retkipyöräily";
                    break;
            }

            const length = item.object.lengthKm;
            const difficulty = item.object.difficulty;
            dataSource = item.object.data_source;
            description = item.object.description;
            
            return (
                <CardBase dataSource={dataSource} onClose={onClose} isClosing={isClosing} handleAnimationEnd={handleAnimationEnd} handleClose={handleClose}>
                    <div
                        style={{
                            width: '100%',
                            height: '200px',
                            borderRadius: '1rem 1rem 0 0',
                            display: 'block',
                            backgroundColor: '#CFE0A4'}}>
                        {hasThumb && (
                            <img
                                src={`${slug}/thumb.jpg`}
                                alt={name}
                                onError={() => setHasThumb(false)}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '1rem 1rem 0 0'
                                }}
                            />
                        )}
                    </div>

                    <div className="flex-row no-stack align-center justify-space-between" style={{ padding: '1rem'}}>
                        <div>
                            <h3 style={{ margin: 6, fontSize: 'large' }}>
                                {name}
                            </h3>
                            <p style={{ fontSize: 'medium', margin: 6 }}>
                                {length} km | {category}<br/>
                            </p>
                        </div>
                        <div className="flex-column align-center justify-center">
                            <button style={{
                                backgroundColor: 'inherit',
                                border: '2px solid grey',
                                color: 'black',
                                padding: '10px 20px',
                                borderRadius: '2rem',
                                fontSize: '14px',
                                cursor: 'pointer',
                            }} onClick={() => {
                                navigate(`/trails/${slug}`);
                            }}>
                                Avaa reittikortti
                            </button>
                        </div>
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
            <div className="flex-column align-center" style={{ width: '100%' }}>
                <div
                    className={`info-card${isClosing ? ' closing' : ''}`}
                    onAnimationEnd={handleAnimationEnd}>
                    <button className="close-button" onClick={handleClose}>
                        ✕
                    </button>
                        { children }
                    <div style={{ padding: '1rem' }}>
                        {dataSource && (
                            <em style={{ color: '#666' }}>{dataSource}</em>
                        )}
                    </div>
                </div>
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
