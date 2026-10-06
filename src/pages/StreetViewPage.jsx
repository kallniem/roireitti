import { useNavigate, useParams, useSearchParams } from "react-router";
import StreetView from "../components/StreetView";
import { useEffect} from "react";

import backIcon from '../assets/back.svg'

function StreetViewPage({}) {

    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (!searchParams.get("point")) {
            setSearchParams("?point=1");
        }
    }, [])

    const handleMove = (value) => {
        const newIdx = Number(searchParams.get("point")) + value
        setSearchParams(`?point=${newIdx}`);
    }

    return (
        <>
            <div className='flex-row no-stack align-center justify-space-between top-menu'>
                <img className='icon-button' src={backIcon} alt="Back" onClick={() => navigate(`/trails/${slug}/`)} />
            </div>
            <StreetView
                hideMenu
                idx={Number(searchParams.get("point"))}
                style={{
                    height: '100%'
                    }}/>
            <div className='flex-column align-center justify-center' style={{
                    position: 'absolute',
                    bottom: '5rem',
                    width: '100%'}}>
                <div className='flex-column align-center justify-center'
                    style={{ 
                        gap: '1rem',
                        padding: '2rem',
                        aspectRatio: '1/1',
                        borderRadius: '5rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.2'
                }}>
                    <h3 style={{cursor: 'pointer', margin: 0, color: 'white'}} onClick={() => handleMove(1)}>∧</h3>
                    <h1 style={{cursor: 'pointer', margin: 0, color: 'white'}} onClick={() => handleMove(-1)}>∨</h1>
                </div>
            </div>
        </>
    )
}

export default StreetViewPage;