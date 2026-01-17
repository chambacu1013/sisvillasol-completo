import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Inicio from './pages/Inicio';
import Inventario from './pages/Inventario';
import Layout from './components/Layout';
import Usuarios from './pages/Usuarios';
import Calendario from './pages/Calendario';
import Reportes from './pages/Reportes';
import MapaFinca from './pages/MapaFinca';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route element={<Layout />}>
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/inventario" element={<Inventario />} /> 
            <Route path="/lotes" element={<MapaFinca />} />
            <Route path="/reportes" element={<Reportes/>} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/calendario" element={<Calendario />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;