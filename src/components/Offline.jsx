import useOnlineStatus from '../hooks/useOnlineStatus';

function Offline() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1>🔌 Offline-tilassa</h1>
      <p>Tarkista verkkoyhteys.</p>
      <p>Jotkut toiminnot ovat edelleen käytettävissä ilman verkkoyhteyttä.</p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Yritä uudestaan
      </button>
    </div>
  );
}

export default Offline;