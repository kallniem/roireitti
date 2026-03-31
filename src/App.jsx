import TrailsPage from './pages/TrailsPage';
import { Routes, Route, Link } from 'react-router';
import HomePage from './pages/HomePage';

function App() {
  return (
      <div className="wrapper">

            {/* Navigation */}
            <div className="page-header">
                <nav className="flex-row justify-space-between"  style={{gap: "2rem", padding: "0 2rem", minHeight: 60, alignItems: "center"  }}>

                    <Link className="logo" to="/">RoiReitti</Link>

                    <div className="flex-row align-center"  style={{gap: "2rem"}}>
                    <Link to="/trails">Reitit</Link>
                    <Link to="/map">Kartta</Link>
                    </div>
                </nav>
            </div>


        <div className="page-body" style={{padding: "2rem"}}>
        
        {/* Routes */}
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/trails" element={<TrailsPage />} />
            <Route path="/trails/:slug" element={<TrailsPage />} />
            <Route path="/map" element={<div />} />
        </Routes>

        </div>
        <div className="page-footer" style={{padding: "1rem"}}>
          <span>Frostbit Software Laboratory, Lapin ammattikorkeakoulu</span>
        </div>
      </div>
  );
}

export default App;