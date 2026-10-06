import { Routes, Route, Link, Navigate, Outlet } from 'react-router';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import TrailPage from './pages/TrailPage';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';
import StreetViewPage from './pages/StreetViewPage';

function App() {
  return (
      <div className="wrapper">
        {/* Persistent Elements */}
        <PwaUpdatePrompt />

        {/* Routes */}
        <Routes>
            <Route element={<DefaultLayout />}>
                
            </Route>

            <Route element={<FullscreenLayout />}>
                <Route path="/" element={<MapPage />} />
                <Route path="/trails/:slug" element={<TrailPage />} />
                <Route path="/trails/:slug/streetview" element={<StreetViewPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
  );
}

export default App;

function DefaultLayout() {
  return (
    <>
      {/* Navigation */}
      <div className="page-header">
          <nav className="flex-row justify-space-between"  style={{gap: "2rem", padding: "0 2rem", minHeight: 60, alignItems: "center"  }}>

              <Link className="logo" to="/">RoiReitti</Link>

              <div className="flex-row align-center"  style={{gap: "2rem"}}>
              <Link to="/">Kartta</Link>
              </div>
          </nav>
      </div>
      <div className="page-body" style={{padding: "0.5rem"}}>
        <Outlet />
      </div>
      <div className="page-footer" style={{padding: "1rem"}}>
          <span>Frostbit Software Laboratory, Lapin ammattikorkeakoulu</span>
      </div>
    </>
  );
}

function FullscreenLayout() {
  return <Outlet />;
}