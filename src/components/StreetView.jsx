import { useEffect, useState } from 'react'

function StreetView({ trail, idx = null, style = {} }) {

    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        setIsLoaded(false)
    }, [idx]);

    return (
        <img
            onLoad={() => setIsLoaded(true)}
            src={`${trail}/trickplay/preview_${String(idx).padStart(3, '0')}.jpg`}
            style={isLoaded? style : {...style, filter: 'brightness(50%)'}}/>
    )
}

export default StreetView;