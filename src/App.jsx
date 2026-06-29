import { Routes, Route, Link, Outlet } from 'react-router';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import TrailPage from './pages/TrailPage';

function App() {
  return (
      <div className="wrapper">

        {/* Navigation */}
        <div className="page-header">
            <nav className="flex-row justify-space-between"  style={{gap: "2rem", padding: "0 2rem", minHeight: 60, alignItems: "center"  }}>

                <Link className="logo" to="/">RoiReitti</Link>

                <div className="flex-row align-center"  style={{gap: "2rem"}}>
                <Link to="/map">Kartta</Link>
                </div>
            </nav>
        </div>


        {/* Routes */}
        <Routes>
            <Route element={<DefaultLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/trails/:slug" element={<TrailPage />} />
            </Route>

            <Route element={<FullscreenLayout />}>
                <Route path="/map" element={<MapPage />} />
            </Route>
        </Routes>
      </div>
  );
}

export default App;

function DefaultLayout() {
  return (
    <>
    <div className="page-body" style={{padding: "2rem"}}>
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