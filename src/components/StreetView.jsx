import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router';

import panoramaIcon from '../assets/ui/panorama.svg';

function StreetView({ idx, hideMenu = false, style = { width: '100%' } }) {

    const { slug } = useParams();
    const navigate = useNavigate();
    const [isLoaded, setIsLoaded] = useState(false)
    const [internalIdx, setInternalIdx] = useState(1)

    useEffect(() => {
        if (idx) {
            setIsLoaded(false)
            setInternalIdx(idx)
        }
    }, [idx]);

    return (
        <div style={{ ...style, position: 'relative', overflow: 'hidden', backgroundColor: 'black' }}>
            <img
                onLoad={() => setIsLoaded(true)}
                src={`${slug}/trickplay/preview_${String(internalIdx).padStart(3, '0')}.jpg`}
                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}/>
                {!isLoaded &&
                    <div 
                        style={{ 
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: 0,
                            color: 'white',
                            backdropFilter: 'blur(10px)'
                            }}>
                    </div>
                }

                {!hideMenu &&
                <div className='top-menu' style={{ color: 'white'}}>
                    <img className='icon-button' src={panoramaIcon} alt="Back" onClick={() => navigate(`/trails/${slug}/streetview?point=${internalIdx}`)} />
                </div>
                }
        </div>
    )
}

export default StreetView;