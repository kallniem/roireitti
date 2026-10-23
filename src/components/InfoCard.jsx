import { useState, useEffect } from "react";
import linkedinLogo from "../assets/social/linkedin.svg";
import youtubeIcon from "../assets/social/youtube.svg";
import instagramIcon from "../assets/social/instagram.svg";
import twitterIcon from "../assets/social/twitter.svg";
import facebookIcon from "../assets/social/facebook.svg";
import tiktokIcon from "../assets/social/tiktok.svg";
import websiteIcon from "../assets/social/website.svg";

import cyclistProducts from "../offline-data/cyclist-certified-products.json";
import welcomCyclistIcon from "../assets/welcome-cyclist.png";
import { useNavigate } from "react-router";
import slugify from "../functions/slugify";
import trailTypes from "../trailTypes";

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

            const website = item.object.websiteUrl;
            const socialMedia = typeof item.object.socialMedia === "string"
            ? (() => { try { return JSON.parse(item.object.socialMedia); } catch (e) { console.warn("socialMedia parse failed", e); return {}; } })()
            : (item.object.socialMedia || {});

            const companyProducts = cyclistProducts.filter((p) => p.company.businessName === item.object.title);

            return (
                <CardBase dataSource={dataSource} onClose={onClose} isClosing={isClosing} handleAnimationEnd={handleAnimationEnd} handleClose={handleClose}>
                    <div style={{ padding: '1rem' }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: 'large' }}>
                            {title}
                        </h3>
                        <ProductsCarousel key={title} products={companyProducts} />
                        <div style={{ maxHeight: '10rem', overflowY: 'scroll', margin: '1rem' }}>
                            <p style={{ fontSize: 'medium', margin: '0 0 8px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {description}
                            </p>
                        </div>
                        <div className='flex-row align-center no-stack' style={{gap: '0.5rem'}}>

                            <a
                                href={website}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'inline-block', margin: 4 }}>
                                <img
                                    src={websiteIcon}
                                    alt={'website'}
                                    style={{ width: 24, cursor: 'pointer' }}
                                />
                            </a>

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
                                    case 'twitter':
                                        icon = twitterIcon
                                        break
                                    case 'facebook':
                                        icon = facebookIcon
                                        break
                                    case 'tik_tok':
                                        icon = tiktokIcon
                                        break
                                    default:
                                        return;
                                }

                                return (
                                    <a
                                    key={index}
                                    href={link.verifiedLink.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'inline-block', margin: 4 }}>
                                    <img
                                        src={icon}
                                        alt={link.linkType ?? 'social media'}
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
                            backgroundColor: trailTypes[item.object.category]?.color || 'grey'}}>
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
                            <em>{dataSource}</em>
                        )}
                    </div>
                </div>
            </div>
    )
}

function ProductsCarousel({ products }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState(null);
    if (!products || products.length === 0) return null;

    const welcomeCyclistCertified = products.find(p => p.productCertificates?.[0]?.certificate === "welcome_cyclist_certificate");
    const activeProduct = products[activeIndex];
    const productInfo = activeProduct.productInformations?.find(info => info.language === "fi")
        || activeProduct.productInformations?.[0];
    const images = activeProduct.productImages || [];
    const image = images.find(productImage => productImage.coverPhoto)
        || [...images].sort((first, second) => first.orderIndex - second.orderIndex)[0];

    const showPrevious = () => setActiveIndex(index => Math.max(0, index - 1));
    const showNext = () => setActiveIndex(index => Math.min(products.length - 1, index + 1));

    return (
        <div className="service-carousel">
            <div
                className="service-carousel-slide"
                onTouchStart={event => setTouchStartX(event.changedTouches[0].clientX)}
                onTouchEnd={event => {
                    if (touchStartX === null) return;
                    const touchDelta = event.changedTouches[0].clientX - touchStartX;
                    if (touchDelta > 40) showPrevious();
                    if (touchDelta < -40) showNext();
                    setTouchStartX(null);
                }}
            >
                {image && (
                    <img
                        className="service-carousel-image"
                        src={image.largeUrl || image.thumbnailUrl}
                        alt={image.altText || productInfo?.name || ""}
                    />
                )}
                {welcomeCyclistCertified && (
                    <img className="service-carousel-certificate" src={welcomCyclistIcon} alt="Welcome Cyclist Certified" />
                )}
                <div className="service-carousel-caption" aria-live="polite">
                    <h4>{productInfo?.name || "Palvelu"}</h4>
                    {image?.copyright && <small>{image.copyright}</small>}
                </div>
            </div>
            {products.length > 1 && (
                <div className="service-carousel-controls">
                    <button type="button" onClick={showPrevious} disabled={activeIndex === 0} aria-label="Edellinen palvelu">
                        &#8592;
                    </button>
                    <span aria-live="polite">{activeIndex + 1} / {products.length}</span>
                    <button type="button" onClick={showNext} disabled={activeIndex === products.length - 1} aria-label="Seuraava palvelu">
                        &#8594;
                    </button>
                </div>
            )}
        </div>
    );
}
