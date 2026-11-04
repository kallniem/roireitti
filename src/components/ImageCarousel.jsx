import { useState } from 'react';

function ImageCarousel({ images, imagePath, trailName }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState(null);

    if (!images?.length) return null;

    const showPrevious = () => {
        setActiveIndex(index => (index - 1 + images.length) % images.length);
    };
    const showNext = () => {
        setActiveIndex(index => (index + 1) % images.length);
    };

    return (
        <div className="trail-image-carousel" role="region" aria-roledescription="carousel" aria-label={`${trailName} kuvat`}>
            <div
                className="trail-image-carousel-slide"
                onTouchStart={event => setTouchStartX(event.changedTouches[0].clientX)}
                onTouchEnd={event => {
                    if (touchStartX === null) return;
                    const touchDelta = event.changedTouches[0].clientX - touchStartX;
                    if (touchDelta > 40) showPrevious();
                    if (touchDelta < -40) showNext();
                    setTouchStartX(null);
                }}
            >
                <img
                    className="trail-image-carousel-image"
                    src={`${imagePath}/${images[activeIndex]}`}
                    alt={`${trailName}, kuva ${activeIndex + 1}`}
                />
            </div>
            {images.length > 1 && (
                <div className="trail-image-carousel-controls">
                    <button type="button" onClick={showPrevious} aria-label="Edellinen kuva">
                        &#8592;
                    </button>
                    <span aria-live="polite">{activeIndex + 1} / {images.length}</span>
                    <button type="button" onClick={showNext} aria-label="Seuraava kuva">
                        &#8594;
                    </button>
                </div>
            )}
        </div>
    );
}

export default ImageCarousel;