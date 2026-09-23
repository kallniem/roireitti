import { useEffect, useState } from 'react';

function PwaUpdatePrompt() {
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    const handleUpdate = (event) => {
      setRegistration(event.detail.registration);
    };

    window.addEventListener('pwa-update-available', handleUpdate);

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdate);
    };
  }, []);

  const refreshApp = async () => {
    if (!registration) {
      return;
    }

    await registration.update();
    window.location.reload();
  };

  if (!registration) {
    return null;
  }

  return (
    <div className="pwa-update-backdrop" role="presentation">
      <div
        className="pwa-update-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-update-title"
      >
        <h2 id="pwa-update-title">Uusi versio saatavilla</h2>
        <p>RoiReitti on päivittynyt. Lataa uusin versio käyttöön.</p>
        <div className="pwa-update-actions">
          <button type="button" onClick={() => setRegistration(null)}>
            Myöhemmin
          </button>
          <button type="button" className="pwa-update-confirm" onClick={refreshApp}>
            Päivitä nyt
          </button>
        </div>
      </div>
    </div>
  );
}

export default PwaUpdatePrompt;