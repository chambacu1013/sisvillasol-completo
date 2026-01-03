import { useEffect, useState } from 'react';

// 1. MATERIAL UI (Solo cosas de diseño: Botones, Textos, Tablas...)
import { 
    Box, Typography, Grid, Card, CardContent, Button, Paper, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    TextField, InputAdornment, IconButton, MenuItem, Chip, TablePagination,
    GlobalStyles 
} from '@mui/material';

// 2. RECHARTS (Aquí van TODAS las gráficas: Barras y Tortas)
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell 
} from 'recharts';
// ICONOS FINANCIEROS
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; 
import ThumbDownIcon from '@mui/icons-material/ThumbDown';     
import SearchIcon from '@mui/icons-material/Search';
// ICONOS DE ACCIÓN
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

// ICONOS DE CLIMA
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
        ingresos: 0, gastos: 0, ganancia: 0, 
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
    
    // Formulario
    const [nuevaVenta, setNuevaVenta] = useState({
        fecha_venta: new Date().toISOString().split('T')[0],
        id_lote: '', cliente: '', kilos_vendidos: '', precio_total: ''
    });
    // ESTADOS PARA LAS TORTAS
    const [dataTortas, setDataTortas] = useState({ cultivos: [], gastos: [] });

    // COLORES PARA LAS GRÁFICAS
    const COLORES_CULTIVOS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    const COLORES_GASTOS = ['#FF8042', '#0088FE']; // Naranja (Mano Obra) y Azul (Insumos)
    //1. Cargas iniciales que NO cambian
    useEffect(() => {
        cargarLotes();
        obtenerClima();
    }, []);
    const cargarLotes = async () => {
        try {
            // Asumiendo que tienes un endpoint /lotes. 
            // Si no, usa el que usas en otros lados como '/actividades/datos-formulario'
            const res = await api.get('/actividades/datos-formulario');
            setListaLotes(res.data.lotes);
        } catch (error) { 
            console.error("Error cargando lotes", error); 
        }
    };
    // 2. CARGA DINÁMICA (Cosas que SÍ cambian cuando eliges 2024, 2025...)
    useEffect(() => {
        // Cuando anioSeleccionado cambia, recargamos TODO
        cargarKPIs(anioSeleccionado);
        cargarGrafica(anioSeleccionado);
        cargarDatosTortas(anioSeleccionado);
        cargarVentas(anioSeleccionado); // La tabla también debería filtrarse
    }, [anioSeleccionado]);
    // FUNCIÓN PARA CARGAR LOS DATOS (recibidas por año)
    const cargarKPIs = async (year) => { 
        try { 
            // Enviamos el año como parámetro query (?year=2025)
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
            setVentas(res.data); 
        } catch (e) { console.error(e); } 
    };

    // La gráfica ya estaba bien, pero asegurémonos
    const cargarGrafica = async (year) => { 
        try { 
            const res = await api.get(`/finanzas/grafica?year=${year}`); 
            setDatosGrafica(res.data); 
        } catch (e) { console.error(e); } 
    };
    // --- ESTADOS PARA LA TABLA DE VENTAS (Paginación y Búsqueda) ---
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [busqueda, setBusqueda] = useState('');

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    // --- LÓGICA DEL CLIMA REAL ---
    const obtenerClima = async () => {
        try {
            // la API key:
            const API_KEY = '34a2ff90985cefb448d0d5b305a26a52'; 
            const CIUDAD = 'Chitaga,CO';

            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(CIUDAD)}&units=metric&lang=es&appid=${API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                // Manejo explícito de estados comunes y logging para depuración
                console.warn('Error al consultar OpenWeatherMap', response.status, response.statusText);
                if (response.status === 401) {
                    setClima({ temp: '⏳', desc: 'Activando Clave...', icon: 'cloud', ciudad: 'Chitagá', status: 401 });
                    return;
                }
                setClima({ temp: '--', desc: 'Error clima', icon: 'cloud', ciudad: 'Chitagá', status: response.status });
                return;
            }

            const data = await response.json();
            console.debug('OpenWeatherMap response:', data);

            // Validar que traiga la estructura esperada
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
            } else {
                setClima({ temp: '--', desc: 'Sin datos', icon: 'cloud', ciudad: 'Chitagá', status: response.status });
            }
        } catch (error) {
            console.error("Error de conexión clima:", error);
        }
    };

    const getClimaIcon = (tipo) => {
        if (!tipo) return <CloudIcon sx={{ fontSize: 40, color: '#fff' }} />;
        const t = tipo.toLowerCase();
        // Inglés y español: lluvia, llovizna, nublado, nubes, claro, sol, tormenta, nieve
        if (t.includes('rain') || t.includes('drizzle') || t.includes('lluv')) return <WaterDropIcon sx={{ fontSize: 40, color: '#fff' }} />;
        if (t.includes('clear') || t.includes('sun') || t.includes('sol')) return <WbSunnyIcon sx={{ fontSize: 40, color: '#fff000' }} />;
        if (t.includes('thunder') || t.includes('torment')) return <ThunderstormIcon sx={{ fontSize: 40, color: '#fff' }} />;
        if (t.includes('snow') || t.includes('nieve')) return <AcUnitIcon sx={{ fontSize: 40, color: '#fff' }} />;
        if (t.includes('cloud') || t.includes('nub') || t.includes('nubes') || t.includes('nublado')) return <CloudIcon sx={{ fontSize: 40, color: '#fff' }} />;
        return <CloudIcon sx={{ fontSize: 40, color: '#fff' }} />;
    };

    const handleEliminarVenta = async (id) => {
        Swal.fire({
            title: '¿Eliminar venta?',
            text: "Este registro desaparecerá de la contabilidad y afectará las gráficas.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f',
            cancelButtonColor: '#1b5e20',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try { 
                    await api.delete(`/finanzas/ventas/${id}`); 
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Eliminado',
                        text: 'El registro ha sido borrado.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    recargarDatosAnuales();
                    cargarKPIs(); 
                    cargarVentas(); 
                    cargarGrafica(anioSeleccionado);
                    cargarDatosTortas();
                } catch (e) { 
                    console.error(e);
                    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar.' });
                }
            }
        });
    };
    // GENERADOR DE AÑOS AUTOMÁTICO 🧠
    const anioActual = new Date().getFullYear();
    const anioInicial = 2024; // Año en que fundaron SISVILLASOL
    const listaAnios = [];

    for (let i = anioInicial; i <= anioActual; i++) {
        listaAnios.push(i);
    }
    // --- LÓGICA DE FILTRADO ---
    // Filtramos por Cliente o Nombre del Lote
    const ventasFiltradas = ventas.filter(v => 
        (v.cliente && v.cliente.toLowerCase().includes(busqueda.toLowerCase())) ||
        (v.nombre_lote && v.nombre_lote.toLowerCase().includes(busqueda.toLowerCase()))
    );

    // Cuando cambien de año o busquen algo, regresamos a la página 0
    useEffect(() => {
        setPage(0);
    }, [anioSeleccionado, busqueda]);
    // 1. Función para recargar todo (se usa al guardar o eliminar)
    const recargarDatosAnuales = () => {
        cargarKPIs(anioSeleccionado);
        cargarGrafica(anioSeleccionado);
        cargarDatosTortas(anioSeleccionado);
        cargarVentas(anioSeleccionado);
    };

    // 2. Abrir el modal para CREAR (Limpia el formulario)
    const handleAbrirNuevo = () => {
        setVentaEditar(null);
        setModalOpen(true);
    };

    // 3. Abrir el modal para EDITAR (Carga los datos)
    const handleAbrirEditar = (venta) => {
        setVentaEditar(venta);
        setModalOpen(true);
    };
    return (
        <Box sx={{ pb: 5 }}>
            <GlobalStyles styles={{ 
                '.swal2-container': { 
                    zIndex: '2400 !important' // Mayor que el 1300 del Modal
                } 
            }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>Reportes Financieros</Typography>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#1b5e20' }} onClick={handleAbrirNuevo}>REGISTRAR VENTA</Button>
            </Box>

            {/* --- 1. TARJETAS KPI --- */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                
                {/* Ingresos */}
                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ bgcolor: '#e8f5e9', borderLeft: '4px solid #2e7d32', height: '100%' }}>
                        <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <AttachMoneyIcon sx={{ color: '#2e7d32', fontSize: 20 }} />
                                <Typography variant="caption" fontWeight="bold">Total Ingresos</Typography>
                            </Box>
                            <Typography variant="h6" fontWeight="bold" color="#2e7d32">${kpis.ingresos.toLocaleString()}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                {/* Gastos */}
                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ bgcolor: '#ffebee', borderLeft: '4px solid #d32f2f', height: '100%' }}>
                        <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <TrendingDownIcon sx={{ color: '#d32f2f', fontSize: 20 }} />
                                <Typography variant="caption" fontWeight="bold">Costos Operativos</Typography>
                            </Box>
                            <Typography variant="h6" fontWeight="bold" color="#d32f2f">${kpis.gastos.toLocaleString()}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                {/* Ganancia */}
                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ bgcolor: '#e3f2fd', borderLeft: '4px solid #0288d1', height: '100%' }}>
                        <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <TrendingUpIcon sx={{ color: '#0288d1', fontSize: 20 }} />
                                <Typography variant="caption" fontWeight="bold">Rentabilidad Neta</Typography>
                            </Box>
                            <Typography variant="h6" fontWeight="bold" color="#0288d1">${kpis.ganancia.toLocaleString()}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                {/* Mejor Lote */}
                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ bgcolor: '#fff8e1', borderLeft: '4px solid #ffb300', height: '100%' }}>
                        <CardContent sx={{ p: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <EmojiEventsIcon sx={{ color: '#ffb300', fontSize: 20 }} />
                                <Typography variant="caption" fontWeight="bold">Mejor Lote</Typography>
                            </Box>
                            <Typography variant="body2" noWrap title={kpis.mejorLote.nombre_lote}>{kpis.mejorLote.nombre_lote}</Typography>
                            <Typography variant="caption" display="block" color="textSecondary" noWrap>{kpis.mejorLote.nombre_variedad || 'Sin Cultivo'}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Peor Lote */}
                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ bgcolor: '#eceff1', borderLeft: '4px solid #607d8b', height: '100%' }}>
                        <CardContent sx={{ p: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <ThumbDownIcon sx={{ color: '#607d8b', fontSize: 20 }} />
                                <Typography variant="caption" fontWeight="bold">Menor Rend.</Typography>
                            </Box>
                            <Typography variant="body2" noWrap title={kpis.peorLote.nombre_lote}>{kpis.peorLote.nombre_lote}</Typography>
                            <Typography variant="caption" display="block" color="textSecondary" noWrap>{kpis.peorLote.nombre_variedad || 'Sin Cultivo'}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* --- TARJETA CLIMA REAL --- */}
                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ 
                        background: 'linear-gradient(135deg, #42a5f5 30%, #1e88e5 90%)', 
                        color: 'white',
                        height: '100%' 
                    }}>
                        <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="caption" sx={{ opacity: 0.9 }}>{clima.ciudad}</Typography>
                                <Typography variant="h5" fontWeight="bold">{clima.temp}°C</Typography>
                                <Typography variant="caption" sx={{ textTransform: 'capitalize', display: 'block', lineHeight: 1 }}>
                                    {clima.desc}
                                </Typography>
                                {/* Indicador cuando la API Key devuelve 401 */}
                                {clima.status === 401 && (
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Chip label="Clave OpenWeather inactiva (401)" color="warning" size="small" />
                                        <Button size="small" variant="contained" onClick={obtenerClima} sx={{ bgcolor: '#fff', color: '#1b5e20' }}>Reintentar</Button>
                                    </Box>
                                )}
                            </Box>
                            {getClimaIcon(clima.icon)}
                        </CardContent>
                    </Card>
                </Grid>

            </Grid>

            {/* --- 2. GRÁFICA --- */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#555' }}>Ingresos vs. Egresos</Typography>
                    <TextField 
                        select 
                        size="small" 
                        value={anioSeleccionado} 
                        onChange={(e) => setAnioSeleccionado(e.target.value)} 
                        sx={{ width: 100 }}
                    >
                        {/* Mapeo Automático */}
                        {listaAnios.map((anio) => (
                            <MenuItem key={anio} value={anio}>
                                {anio}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>
                <Box sx={{ height: 350, width: '100%' }}>
                    <ResponsiveContainer>
                        <BarChart data={datosGrafica}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(val) => `$${val.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="Costos" fill="#008f39" name="Egresos" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Ingresos" fill="#e91e63" name="Ingresos" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>

          {/* --- 3. TABLA DE VENTAS CON BUSCADOR Y PAGINACIÓN --- */}
            <Paper sx={{ borderRadius: 2, boxShadow: 2, mb: 8 }}>
                
                {/* BARRA DE BÚSQUEDA INTERNA */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                    <TextField
                        placeholder="Buscar por cliente o lote..."
                        size="small"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        sx={{ width: 300 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><b>Fecha</b></TableCell>
                                <TableCell><b>Lote (Cultivo)</b></TableCell>
                                <TableCell><b>Cliente</b></TableCell>
                                <TableCell><b>Kilos</b></TableCell>
                                <TableCell><b>Total Venta</b></TableCell>
                                <TableCell><b>Acciones</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ventasFiltradas
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((venta) => (
                                    <TableRow key={venta.id_venta} hover>
                                        <TableCell>{new Date(venta.fecha_venta).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">{venta.nombre_lote}</Typography>
                                            <Chip label={venta.nombre_variedad || 'Sin Cultivo'} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>{venta.cliente || '---'}</TableCell>
                                        <TableCell>{venta.kilos_vendidos} Kg</TableCell>
                                        <TableCell sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                            ${Number(venta.precio_total).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton color="primary" onClick={() => handleAbrirEditar(venta)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton color="error" onClick={() => handleEliminarVenta(venta.id_venta)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                            ))}
                            {ventasFiltradas.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        No se encontraron ventas para este año o búsqueda.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* PAGINACIÓN */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={ventasFiltradas.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </Paper>
            {/* --- 2.5 GRÁFICAS DE PASTEL (VERSIÓN FINAL: LEYENDA Y MÁS GRANDE) --- */}
            <Grid container spacing={4} justifyContent="center" sx={{ mb: 8, mt: 4 }}>

                {/* TORTA 1: DISTRIBUCIÓN DE CULTIVOS */}
                <Grid item xs={12} md={6}>
                    {/* Aumentamos altura a 450px para la leyenda */}
                    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, height: 450, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#555', mb: 1 }}>
                            🌱 Ingresos por Cultivo
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#777', mb: 2 }}>
                            (Pasa el mouse para ver valores)
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dataTortas.cultivos}
                                    cx="50%" cy="45%" // Subimos un poquito el centro para dejar espacio abajo
                                    // QUITALOS LAS ETIQUETAS DIRECTAS
                                    labelLine={false}
                                    // AUMENTAMOS EL TAMAÑO: Ahora es mucho más ancha
                                    outerRadius={120} 
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {dataTortas.cultivos.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORES_CULTIVOS[index % COLORES_CULTIVOS.length]} />
                                    ))}
                                </Pie>
                                {/* TOOLTIP MEJORADO: Muestra valor y porcentaje al pasar el mouse */}
                                <Tooltip formatter={(value, name, props) => {
                                    const total = dataTortas.cultivos.reduce((a, b) => a + b.value, 0);
                                    const percent = ((value / total) * 100).toFixed(1);
                                    return [`$${Number(value).toLocaleString()} (${percent}%)`, name];
                                }} />
                                {/* LEYENDA AGREGADA AQUI */}
                                <Legend verticalAlign="bottom" height={60} iconType="circle"/>
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* TORTA 2: INVERSIÓN (INSUMOS VS MANO DE OBRA) */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, height: 450, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#555', mb: 1 }}>
                            💸 Inversion Económica
                        </Typography>
                         <Typography variant="caption" sx={{ color: '#777', mb: 2 }}>
                            (Distribución de Gastos)
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dataTortas.gastos}
                                    cx="50%" cy="45%"
                                    innerRadius={70}
                                    outerRadius={120} // Aumentado para que coincida con la otra
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {dataTortas.gastos.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORES_GASTOS[index % COLORES_GASTOS.length]} />
                                    ))}
                                </Pie>
                                {/* TOOLTIP MEJORADO TAMBIÉN AQUÍ */}
                                <Tooltip formatter={(value, name) => {
                                     const total = dataTortas.gastos.reduce((a, b) => a + b.value, 0);
                                     const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                     return [`$${Number(value).toLocaleString()} (${percent}%)`, name];
                                }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
            {/* --- 5. MODAL CONECTADO (NUEVO COMPONENTE) --- */}
            <NuevaVentaModal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
                ventaEditar={ventaEditar} 
                onSuccess={recargarDatosAnuales} // Al guardar, recargamos gráficas y tablas
                listaLotes={listaLotes} // Le pasamos la lista para que no tenga que consultarla de nuevo
            />
        </Box>
    );
}

export default Reportes;