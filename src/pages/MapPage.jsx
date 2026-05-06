import MapView from '../components/MapView';

const businessMarkerStyle = {
    width: '28px',
    height: '28px',
    backgroundColor: '#2563EB',
    color: 'white',
    border: '3px solid white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.25)',
};

const hutMarkerStyle = {
    width: '28px',
    height: '28px',
    backgroundColor: '#009900',
    color: 'white',
    border: '3px solid white',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.25)',
};

function MapPage() {
    return (
        <div
            className="flex-column justify-center align-center"
            style={{
                width: "100%",
                height: "100%",
            }}
        >
            <MapView
                interactiveLayerIds={[/* layer ids here */]}
            />
        </div>
    );
}

export default MapPage;