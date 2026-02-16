import { useEffect, useState } from 'react';

// 1. MATERIAL UI
import { 
    Box, Typography, Grid, Card, CardContent, Button, Paper, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    TextField, InputAdornment, IconButton, MenuItem, Chip, TablePagination,
    GlobalStyles 
} from '@mui/material';

// 2. RECHARTS
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell 
} from 'recharts';

// ICONOS
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; 
import ThumbDownIcon from '@mui/icons-material/ThumbDown';     
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import WaterDropIcon from '@mui/icons-material/WaterDrop';

import api from '../services/api';
import Swal from 'sweetalert2';
import NuevaVentaModal from '../components/NuevaVentaModal';

function Reportes() {
    // --- ESTADOS ---
    const [kpis, setKpis] = useState({ 
        ingresos: 0, gastos: 0,  
        mejorLote: { nombre_lote: '---', nombre_variedad: '', total: 0 }, 
        peorLote: { nombre_lote: '---', nombre_variedad: '', total: 0 } 
    });
    const [ventas, setVentas] = useState([]);
    const [datosGrafica, setDatosGrafica] = useState([]);
    const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
    
    // Estado del Clima
    const [clima, setClima] = useState({ temp: '--', desc: 'Esperando activación...', icon: 'cloud', ciudad: 'Chitagá', status: null });

    // Listas y Modales
    const [listaLotes, setListaLotes] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [ventaEditar, setVentaEditar] = useState(null);
    
    // Formulario (no usado aquí directamente, pero declarado)
    const [nuevaVenta, setNuevaVenta] = useState({
        fecha_venta: new Date().toLocaleDateString('en-CA'),
        id_lote: '', cliente: '', kilos_vendidos: '', precio_total: ''
    });
    // ESTADOS PARA LAS TORTAS
    const [dataTortas, setDataTortas] = useState({ cultivos: [], gastos: [] });
    // ESTADO PARA BARRAS KILOS
    const [dataKilos, setDataKilos] = useState([]);

    // COLORES
    const COLORES_CULTIVOS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    const COLORES_GASTOS = ['#FF8042', '#0088FE']; 

    useEffect(() => {
        cargarLotes();
        obtenerClima();
    }, []);

    useEffect(() => {
        recargarDatosAnuales();
    }, [anioSeleccionado]);

    const cargarLotes = async () => {
        try {
            const res = await api.get('/actividades/datos-formulario');
            setListaLotes(res.data.lotes);
        } catch (error) { console.error("Error cargando lotes", error); }
    };

    const recargarDatosAnuales = () => {
        cargarKPIs(anioSeleccionado);
        cargarGrafica(anioSeleccionado);
        cargarDatosTortas(anioSeleccionado);
        cargarVentas(anioSeleccionado);
    };

    const cargarKPIs = async (year) => { 
        try { 
            const res = await api.get(`/finanzas/resumen?year=${year}`); 
            setKpis(res.data); 
        } catch (e) { console.error(e); } 
    };

    const cargarDatosTortas = async (year) => {
        try {
            const res = await api.get(`/finanzas/distribucion?year=${year}`);
            setDataTortas(res.data);
        } catch (error) { console.error("Error cargando tortas", error); }
    };

    const cargarVentas = async (year) => { 
        try { 
            const res = await api.get(`/finanzas/ventas?year=${year}`); 
            if (res.data.ventas) setVentas(res.data.ventas);
            else if (Array.isArray(res.data)) setVentas(res.data);

            if (res.data.kilosPorLote) {
                setDataKilos(res.data.kilosPorLote);
            }
        } catch (e) { console.error(e); } 
    };

    const cargarGrafica = async (year) => { 
        try { 
            const res = await api.get(`/finanzas/grafica?year=${year}`); 
            setDatosGrafica(res.data); 
        } catch (e) { console.error(e); } 
    };

    // --- TABLA ---
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [busqueda, setBusqueda] = useState('');

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const ventasFiltradas = ventas.filter(v => 
        (v.cliente && v.cliente.toLowerCase().includes(busqueda.toLowerCase())) ||
        (v.nombre_lote && v.nombre_lote.toLowerCase().includes(busqueda.toLowerCase()))
    );

    useEffect(() => { setPage(0); }, [anioSeleccionado, busqueda]);

    // --- CLIMA ---
    const obtenerClima = async () => {
        try {
            const API_KEY = '34a2ff90985cefb448d0d5b305a26a52'; 
            const CIUDAD = 'Chitaga,CO';
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(CIUDAD)}&units=metric&lang=es&appid=${API_KEY}`;
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 401) {
                    setClima({ temp: '⏳', desc: 'Clave pendiente...', icon: 'cloud', ciudad: 'Chitagá', status: 401 });
                    return;
                }
                setClima({ temp: '--', desc: 'Error clima', icon: 'cloud', ciudad: 'Chitagá', status: response.status });
                return;
            }
            const data = await response.json();
            if (data && data.main && data.weather && data.weather.length > 0) {
                const weatherMain = (data.weather[0].main || '').toLowerCase();
                const weatherDesc = (data.weather[0].description || '').toLowerCase();
                const iconKey = weatherMain || weatherDesc;
                setClima({
                    temp: Math.round(data.main.temp),
                    desc: data.weather[0].description,
                    icon: iconKey,
                    ciudad: 'Chitagá',
                    status: response.status
                });
            }
        } catch (error) { console.error("Error clima:", error); }
    };

    const getClimaIcon = (tipo) => {
        if (!tipo) return <CloudIcon sx={{ fontSize: 40, color: '#fff' }} />;
        const t = tipo.toLowerCase();
        if (t.includes('rain') || t.includes('lluv')) return <WaterDropIcon sx={{ fontSize: 40, color: '#fff' }} />;
        if (t.includes('clear') || t.includes('sol')) return <WbSunnyIcon sx={{ fontSize: 40, color: '#fff000' }} />;
        if (t.includes('thunder') || t.includes('torment')) return <ThunderstormIcon sx={{ fontSize: 40, color: '#fff' }} />;
        if (t.includes('snow') || t.includes('nieve')) return <AcUnitIcon sx={{ fontSize: 40, color: '#fff' }} />;
        return <CloudIcon sx={{ fontSize: 40, color: '#fff' }} />;
    };

    // --- MODALES ---
    const handleAbrirNuevo = () => { setVentaEditar(null); setModalOpen(true); };
    const handleAbrirEditar = (venta) => { setVentaEditar(venta); setModalOpen(true); };
    const handleEliminarVenta = async (id) => {
        Swal.fire({
            title: '¿Eliminar?', text: "Se borrará permanentemente.", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d32f2f', confirmButtonText: 'Sí, eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try { await api.delete(`/finanzas/ventas/${id}`); recargarDatosAnuales(); 
                Swal.fire('Eliminado', '', 'success'); } catch (e) { Swal.fire('Error', '', 'error'); }
            }
        });
    };

    const listaAnios = [];
    for (let i = 2024; i <= new Date().getFullYear(); i++) listaAnios.push(i);

    return (
        <Box sx={{ pb: 5 }}>
            <GlobalStyles styles={{ '.swal2-container': { zIndex: '2400 !important' } }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>Reportes Financieros</Typography>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#1b5e20' }} onClick={handleAbrirNuevo}>REGISTRAR VENTA</Button>
            </Box>

            {/* --- 1. TARJETAS KPI --- */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#e8f5e9', borderLeft: '4px solid #2e7d32', height: '100%' }}>
                        <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AttachMoneyIcon sx={{ color: '#2e7d32' }} />
                                <Typography variant="caption" fontWeight="bold">Ingresos</Typography>
                            </Box>
                            <Typography variant="h6" fontWeight="bold" color="#2e7d32">${kpis.ingresos.toLocaleString()}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#ffebee', borderLeft: '4px solid #d32f2f', height: '100%' }}>
                        <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TrendingDownIcon sx={{ color: '#d32f2f' }} />
                                <Typography variant="caption" fontWeight="bold">Gastos</Typography>
                            </Box>
                            <Typography variant="h6" fontWeight="bold" color="#d32f2f">${kpis.gastos.toLocaleString()}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#fff8e1', borderLeft: '4px solid #ffb300', height: '100%' }}>
                        <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmojiEventsIcon sx={{ color: '#ffb300' }} />
                                <Typography variant="caption" fontWeight="bold">Mejor Lote</Typography>
                            </Box>
                            <Typography variant="body2" noWrap>{kpis.mejorLote.nombre_lote}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #42a5f5 30%, #1e88e5 90%)', color: 'white', height: '100%' }}>
                        <CardContent sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="caption">{clima.ciudad}</Typography>
                                <Typography variant="h5" fontWeight="bold">{clima.temp}°C</Typography>
                            </Box>
                            {getClimaIcon(clima.icon)}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* --- 2. GRÁFICA GENERAL --- */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#555' }}>Balance General</Typography>
                    <TextField select size="small" value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(e.target.value)} sx={{ width: 100 }}>
                        {listaAnios.map((anio) => <MenuItem key={anio} value={anio}>{anio}</MenuItem>)}
                    </TextField>
                </Box>
                <Box sx={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer>
                        <BarChart data={datosGrafica}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(val) => `$${val.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="Costos" fill="#e91e63" name="Egresos" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Ingresos" fill="#008f39" name="Ingresos" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>

            {/* --- 3. SECCIÓN DE GRÁFICAS ESPECÍFICAS (CORREGIDA) --- */}
            
            {/* SPACING = 3 (NO 10). Esto permite que las gráficas respiren y se expandan */}
            <Grid container spacing={3} sx={{ mb: 8 }}>
                
                {/* --- FILA 1: LAS DOS TORTAS (Mitad y Mitad) --- */}
                
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 3, height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#555', mb: 2 }}>🌱 Ingresos por Cultivo</Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={dataTortas.cultivos} 
                                    cx="50%" cy="50%" 
                                    outerRadius={110} // Tamaño ajustado
                                    fill="#8884d8" 
                                    dataKey="value" 
                                    stroke="none"
                                >
                                    {dataTortas.cultivos.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES_CULTIVOS[index % COLORES_CULTIVOS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 3, height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#555', mb: 2 }}>💸 Inversión (Gastos)</Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={dataTortas.gastos} 
                                    cx="50%" cy="50%" 
                                    innerRadius={65} 
                                    outerRadius={110} // Tamaño ajustado
                                    dataKey="value" 
                                    stroke="none"
                                >
                                    {dataTortas.gastos.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES_GASTOS[index % COLORES_GASTOS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* --- FILA 2: GRÁFICA DE BARRAS (Ancho Total) --- */}
                {/* md={12} asegura que ocupe todo el ancho de la pantalla */}
                <Grid item xs={12} md={12}>
                    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, height: 500, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f57f17' }}>⚖️ Kilos Vendidos por Lote</Typography>
                        <Typography variant="caption" sx={{ mb: 2, color: '#666' }}>Comparativa de producción física</Typography>
                        
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={dataKilos} 
                                margin={{ top: 20, right: 30, left: 20, bottom: 70 }} // Margen inferior para que quepan los nombres inclinados
                                barCategoryGap="20%"
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="nombre_lote" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    interval={0} 
                                    height={100} // Altura extra para el texto inclinado
                                    tick={{fontSize: 12, fill: '#333'}} 
                                />
                                <YAxis />
                                <Tooltip content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                                                <p style={{ fontWeight: 'bold', margin: 0 }}>{label}</p>
                                                <p style={{ color: 'green', margin: 0 }}>🌱 {data.nombre_variedad || 'Sin variedad'}</p>
                                                <p style={{ color: 'orange', fontWeight: 'bold', margin: 0 }}>⚖️ {Number(data.total_kilos).toLocaleString()} Kg</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }} />
                                <Bar dataKey="total_kilos" name="Kilos" fill="#ffb300" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* --- 4. TABLA DE VENTAS --- */}
            <Paper sx={{ borderRadius: 2, boxShadow: 2, mb: 8 }}>
                <Box sx={{ p: 2 }}>
                    <TextField 
                        placeholder="Buscar..." size="small" value={busqueda} 
                        onChange={(e) => setBusqueda(e.target.value)} sx={{ width: 300 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} 
                    />
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><b>Fecha</b></TableCell>
                                <TableCell><b>Lote</b></TableCell>
                                <TableCell><b>Cliente</b></TableCell>
                                <TableCell><b>Kilos</b></TableCell>
                                <TableCell><b>Total</b></TableCell>
                                <TableCell><b>Acciones</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ventasFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((venta) => (
                                <TableRow key={venta.id_venta} hover>
                                    <TableCell>{new Date(venta.fecha_venta).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">{venta.nombre_lote}</Typography>
                                        <Chip label={venta.nombre_variedad || '---'} size="small" />
                                    </TableCell>
                                    <TableCell>{venta.cliente}</TableCell>
                                    <TableCell>{venta.kilos_vendidos} Kg</TableCell>
                                    <TableCell sx={{ color: 'green', fontWeight: 'bold' }}>${Number(venta.precio_total).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <IconButton color="primary" onClick={() => handleAbrirEditar(venta)}><EditIcon /></IconButton>
                                        <IconButton color="error" onClick={() => handleEliminarVenta(venta.id_venta)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]} component="div"
                    count={ventasFiltradas.length} rowsPerPage={rowsPerPage} page={page}
                    onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            <NuevaVentaModal open={modalOpen} onClose={() => setModalOpen(false)} ventaEditar={ventaEditar} onSuccess={recargarDatosAnuales} listaLotes={listaLotes} />
        </Box>
    );
}

export default Reportes;