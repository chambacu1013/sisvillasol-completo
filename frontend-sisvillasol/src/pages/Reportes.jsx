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
    
    // Formulario
    const [nuevaVenta, setNuevaVenta] = useState({
        fecha_venta: new Date().toLocaleDateString('en-CA'),
        id_lote: '', cliente: '', kilos_vendidos: '', precio_total: ''
    });
    // ESTADOS PARA LAS TORTAS
    const [dataTortas, setDataTortas] = useState({ cultivos: [], gastos: [] });
    //grafica de barras para kilos por lote hasta qui me enrede gemini!!!!!
    const [dataKilos, setDataKilos] = useState([]);

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
            if (res.data.ventas) setVentas(res.data.ventas);
            else if (Array.isArray(res.data)) setVentas(res.data);

            if (res.data.kilosPorLote) {
                setDataKilos(res.data.kilosPorLote);
            }
        } catch (e) { console.error(e); } 
    };

    // La gráfica
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

            // Procesamiento real
            const temp = Math.round(data.main.temp);
            const desc = data.weather[0].description;
            let icon = 'cloud';
            const weatherMain = data.weather[0].main.toLowerCase();

            if (weatherMain.includes('clear')) icon = 'sunny';
            else if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) icon = 'rainy';
            else if (weatherMain.includes('thunder')) icon = 'storm';
            else if (weatherMain.includes('snow')) icon = 'snow';

            setClima({ 
                temp: `${temp}°C`, 
                desc: desc.charAt(0).toUpperCase() + desc.slice(1), 
                icon, 
                ciudad: 'Chitagá',
                status: 200 
            });

        } catch (error) {
            console.error('Error obteniendo clima:', error);
            setClima({ temp: '--', desc: 'Error clima', icon: 'cloud', ciudad: 'Chitagá', status: null });
        }
    };
    // --- RECARGAS ---
    const recargarDatosAnuales = () => {
        // Cuando haces cambios (agregar/editar/eliminar venta), recargamos todo del año actual
        cargarKPIs(anioSeleccionado);
        cargarGrafica(anioSeleccionado);
        cargarDatosTortas(anioSeleccionado);
        cargarVentas(anioSeleccionado);
    };

    // --- MODAL ---
    const handleAbrirModal = () => {
        setVentaEditar(null); // Limpiamos edición anterior
        setModalOpen(true);
    };

    const handleAbrirEditar = (venta) => {
        setVentaEditar(venta);
        setModalOpen(true);
    };

    const handleEliminarVenta = async (id_venta) => {
        const resultado = await Swal.fire({
            title: '¿Eliminar esta venta?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (resultado.isConfirmed) {
            try {
                await api.delete(`/finanzas/ventas/${id_venta}`);
                Swal.fire('Eliminado', 'La venta se eliminó correctamente', 'success');
                recargarDatosAnuales();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No se pudo eliminar la venta', 'error');
            }
        }
    };
    // FILTRADO de ventas por búsqueda
    const ventasFiltradas = ventas.filter((venta) => 
        venta.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        venta.nombre_lote.toLowerCase().includes(busqueda.toLowerCase())
    );
    // Cálculo de ganancias netas con validación
    const ganancia = (kpis.ingresos || 0) - (kpis.gastos || 0);
    const esPositiva = ganancia >= 0;

    // --- ICONO DE CLIMA ---
    const renderIconoClima = () => {
        const iconStyle = { fontSize: 80, color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' };
        switch (clima.icon) {
            case 'sunny':  return <WbSunnyIcon sx={iconStyle} />;
            case 'rainy':  return <WaterDropIcon sx={iconStyle} />;
            case 'storm':  return <ThunderstormIcon sx={iconStyle} />;
            case 'snow':   return <AcUnitIcon sx={iconStyle} />;
            default:       return <CloudIcon sx={iconStyle} />;
        }
    };

    // Opciones de año (ej. 2020 a año actual + 1)
    const añosDisponibles = Array.from(
        { length: (new Date().getFullYear() + 1) - 2020 + 1 }, 
        (_, i) => 2020 + i
    );

    return (
        <Box sx={{ px: 4, py: 3 }}>
            {/* ESTILOS GLOBALES MUY IMPORTANTES */}
            <GlobalStyles styles={{ '*': { scrollbarWidth: 'none' } }} />

            {/* --- 0. SELECTOR DE AÑO (ARRIBA DE TODO) --- */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <TextField
                    select
                    label="Año"
                    value={anioSeleccionado}
                    onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                    variant="outlined"
                    size="small"
                    sx={{ width: 120 }}
                >
                    {añosDisponibles.map((año) => (
                        <MenuItem key={año} value={año}>{año}</MenuItem>
                    ))}
                </TextField>
            </Box>

            {/* --- 1. TARJETAS FINANCIERAS (KPI's) --- */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {/* Total Ingresos */}
                <Grid item xs={12} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)', color: 'white', borderRadius: 2, boxShadow: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Ingresos</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                        ${(kpis.ingresos || 0).toLocaleString()}
                                    </Typography>
                                </Box>
                                <AttachMoneyIcon sx={{ fontSize: 50, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Total Gastos */}
                <Grid item xs={12} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #EF5350 0%, #E53935 100%)', color: 'white', borderRadius: 2, boxShadow: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Inversión</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                        ${(kpis.gastos || 0).toLocaleString()}
                                    </Typography>
                                </Box>
                                <TrendingDownIcon sx={{ fontSize: 50, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Mejor Lote */}
                <Grid item xs={12} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)', color: 'white', borderRadius: 2, boxShadow: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Mejor Lote</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                        {kpis.mejorLote.nombre_lote || '---'}
                                    </Typography>
                                    {kpis.mejorLote.nombre_variedad && (
                                        <Typography variant="caption">
                                            {kpis.mejorLote.nombre_variedad}
                                        </Typography>
                                    )}
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                        ${Number(kpis.mejorLote.total || 0).toLocaleString()}
                                    </Typography>
                                </Box>
                                <EmojiEventsIcon sx={{ fontSize: 50, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Peor Lote */}
                <Grid item xs={12} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #FF7043 0%, #F4511E 100%)', color: 'white', borderRadius: 2, boxShadow: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Peor Lote</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                        {kpis.peorLote.nombre_lote || '---'}
                                    </Typography>
                                    {kpis.peorLote.nombre_variedad && (
                                        <Typography variant="caption">
                                            {kpis.peorLote.nombre_variedad}
                                        </Typography>
                                    )}
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                        ${Number(kpis.peorLote.total || 0).toLocaleString()}
                                    </Typography>
                                </Box>
                                <ThumbDownIcon sx={{ fontSize: 50, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* --- 2. GRÁFICA DE INGRESOS vs GASTOS + CLIMA --- */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {/* Gráfica Principal */}
                <Grid item xs={12} md={9}>
                    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>
                            Ingresos vs Inversión Mensual
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={datosGrafica} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip 
                                    formatter={(value) => `$${Number(value).toLocaleString()}`}
                                    contentStyle={{ borderRadius: 8 }}
                                />
                                <Legend wrapperStyle={{ fontSize: '14px' }} />
                                <Bar dataKey="ingresos" fill="#4CAF50" name="Ingresos" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="gastos" fill="#F44336" name="Inversión" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Tarjeta del Clima */}
                <Grid item xs={12} md={3}>
                    <Paper 
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            boxShadow: 3,
                            background: 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)',
                            color: 'white',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 280
                        }}
                    >
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            {clima.ciudad}
                        </Typography>
                        {renderIconoClima()}
                        <Typography variant="h3" sx={{ fontWeight: 'bold', my: 2 }}>
                            {clima.temp}
                        </Typography>
                        <Typography variant="body1" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                            {clima.desc}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* --- 3. GANANCIAS NETAS --- */}
            <Paper sx={{ p: 3, mb: 6, borderRadius: 2, boxShadow: 3, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#555', mb: 1 }}>
                    Ganancia Neta
                </Typography>
                <Typography 
                    variant="h3" 
                    sx={{ fontWeight: 'bold', color: esPositiva ? '#4CAF50' : '#F44336' }}
                >
                    ${ganancia.toLocaleString()}
                </Typography>
            </Paper>

            {/* --- 4. TABLA DE VENTAS --- */}
            <Paper sx={{ p: 3, mb: 6, borderRadius: 2, boxShadow: 3 }}>
                {/* BARRA SUPERIOR: Título, Buscador y Botón */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                        Historial de Ventas
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* Buscador */}
                        <TextField
                            variant="outlined"
                            size="small"
                            placeholder="Buscar cliente o lote..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                            sx={{ width: 250 }}
                        />
                        {/* Botón Nueva Venta */}
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAbrirModal}
                            sx={{
                                backgroundColor: '#4CAF50',
                                '&:hover': { backgroundColor: '#45a049' },
                                textTransform: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            Nueva Venta
                        </Button>
                    </Box>
                </Box>

                {/* TABLA */}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Lote</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Kilos</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Precio Total</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ventasFiltradas
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((venta) => (
                                    <TableRow key={venta.id_venta} hover>
                                        <TableCell>{new Date(venta.fecha_venta).toLocaleDateString('es-ES')}</TableCell>
                                        <TableCell>{venta.nombre_lote}</TableCell>
                                        <TableCell>{venta.cliente}</TableCell>
                                        <TableCell align="right">{Number(venta.kilos_vendidos).toLocaleString()}</TableCell>
                                        <TableCell align="right">
                                            <Chip 
                                                label={`$${Number(venta.precio_total).toLocaleString()}`} 
                                                color="success" 
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell align="center">
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

         {/* --- SECCIÓN UNIFICADA: TORTAS Y BARRAS (3 EN LINEA CON ANCHO COMPLETO) --- */}
            <Grid container spacing={2} sx={{ mb: 8, mt: 4 }}>

                {/* 1. TORTA CULTIVOS (md={4}) */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        boxShadow: 3, 
                        height: 420, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center' 
                    }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#555', mb: 1 }}>
                            🌱 Ingresos / Cultivo
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dataTortas.cultivos}
                                    cx="50%" cy="50%"
                                    labelLine={false}
                                    outerRadius={110}
                                    fill="#8884d8"
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {dataTortas.cultivos.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORES_CULTIVOS[index % COLORES_CULTIVOS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* 2. TORTA GASTOS (md={4}) */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        boxShadow: 3, 
                        height: 420, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center' 
                    }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#555', mb: 1 }}>
                            💸 Inversión
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dataTortas.gastos}
                                    cx="50%" cy="50%"
                                    innerRadius={50}
                                    outerRadius={110}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {dataTortas.gastos.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORES_GASTOS[index % COLORES_GASTOS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* 3. GRÁFICA BARRAS KILOS (md={4}) */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        boxShadow: 3, 
                        height: 420, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center' 
                    }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#f57f17', mb: 1 }}>
                            ⚖️ Kilos Vendidos
                        </Typography>
                        
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={dataKilos}
                                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="nombre_lote" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    interval={0} 
                                    height={60} 
                                    tick={{fontSize: 10}}
                                />
                               <YAxis tick={{fontSize: 11}} width={35} />
                                
                                {/* TOOLTIP para las barras */}
                                <Tooltip 
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{label}</p>
                                                    <p style={{ margin: '4px 0', color: '#2e7d32', fontSize: '0.8rem' }}>
                                                        🌱 {data.nombre_variedad || 'Sin variedad'}
                                                    </p>
                                                    <p style={{ margin: 0, color: '#f57f17', fontWeight: 'bold' }}>
                                                        ⚖️ {Number(data.total_kilos).toLocaleString()} Kg
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                
                                <Bar 
                                    dataKey="total_kilos" 
                                    name="Kilos" 
                                    fill="#ffb300" 
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

            </Grid>
            
            {/* --- 5. MODAL CONECTADO (NUEVO COMPONENTE) --- */}
            <NuevaVentaModal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
                ventaEditar={ventaEditar} 
                onSuccess={recargarDatosAnuales}
                listaLotes={listaLotes}
            />
        </Box>
    );
}

export default Reportes;
