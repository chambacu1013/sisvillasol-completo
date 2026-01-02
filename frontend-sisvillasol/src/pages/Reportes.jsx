import { useEffect, useState } from 'react';
import { 
    Box, Typography, Grid, Card, CardContent, Button, Paper, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment, IconButton, MenuItem, Chip 
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ICONOS FINANCIEROS
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; 
import ThumbDownIcon from '@mui/icons-material/ThumbDown';     

// ICONOS DE ACCIÓN
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit'; 
import CloseIcon from '@mui/icons-material/Close';

// ICONOS DE CLIMA
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import WaterDropIcon from '@mui/icons-material/WaterDrop';

import api from '../services/api';

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
    const [clima, setClima] = useState({ temp: '--', desc: 'Esperando activación...', icon: 'cloud', ciudad: 'Chitagá' });

    // Listas y Modales
    const [listaLotes, setListaLotes] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [ventaEditar, setVentaEditar] = useState(null);
    
    // Formulario
    const [nuevaVenta, setNuevaVenta] = useState({
        fecha_venta: new Date().toISOString().split('T')[0],
        id_lote: '', cliente: '', kilos_vendidos: '', precio_total: ''
    });

    useEffect(() => {
        cargarKPIs();
        cargarVentas();
        cargarLotes();
        obtenerClima(); 
    }, []);

    useEffect(() => { cargarGrafica(anioSeleccionado); }, [anioSeleccionado]);

    // --- CARGAS DE DATOS ---
    const cargarKPIs = async () => { try { const res = await api.get('/finanzas/resumen'); setKpis(res.data); } catch (e) { console.error(e); } };
    const cargarGrafica = async (year) => { try { const res = await api.get(`/finanzas/grafica?year=${year}`); setDatosGrafica(res.data); } catch (e) { console.error(e); } };
    const cargarVentas = async () => { try { const res = await api.get('/finanzas/ventas'); setVentas(res.data); } catch (e) { console.error(e); } };
    const cargarLotes = async () => { try { const res = await api.get('/actividades/datos-formulario'); setListaLotes(res.data.lotes); } catch (e) { console.error(e); } };

    // --- LÓGICA DEL CLIMA REAL ---
    const obtenerClima = async () => {
        try {
            // la API key:
            const API_KEY = '34a2ff90985cefb448d0d5b305a26a52'; 
            const CIUDAD = 'Chitaga,CO'; 

            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CIUDAD}&units=metric&lang=es&appid=${API_KEY}`);
            
            if (response.status === 401) {
                console.warn("La API Key aún no se activa. Espera unos minutos.");
                setClima({ temp: '⏳', desc: 'Activando Clave...', icon: 'cloud', ciudad: 'Chitagá' });
                return;
            }

            const data = await response.json();
            
            if (data.main) {
                setClima({
                    temp: Math.round(data.main.temp), 
                    desc: data.weather[0].description, 
                    icon: data.weather[0].main.toLowerCase(), 
                    ciudad: 'Chitagá'
                });
            } 
        } catch (error) {
            console.error("Error de conexión clima:", error);
        }
    };

    const getClimaIcon = (tipo) => {
        if (!tipo) return <CloudIcon sx={{ fontSize: 40, color: '#fff' }} />;
        const t = tipo.toLowerCase();
        if (t.includes('rain') || t.includes('drizzle')) return <WaterDropIcon sx={{ fontSize: 40, color: '#fff' }} />;
        if (t.includes('clear') || t.includes('sun')) return <WbSunnyIcon sx={{ fontSize: 40, color: '#fff000' }} />;
        if (t.includes('thunder')) return <ThunderstormIcon sx={{ fontSize: 40, color: '#fff' }} />;
        if (t.includes('snow')) return <AcUnitIcon sx={{ fontSize: 40, color: '#fff' }} />;
        return <CloudIcon sx={{ fontSize: 40, color: '#fff' }} />;
    };

    // --- ACCIONES FORMULARIO ---
    const handleAbrirEditar = (venta) => {
        setVentaEditar(venta);
        setNuevaVenta({
            fecha_venta: new Date(venta.fecha_venta).toISOString().split('T')[0],
            id_lote: venta.id_lote,
            cliente: venta.cliente || '',
            kilos_vendidos: venta.kilos_vendidos,
            precio_total: venta.precio_total
        });
        setModalOpen(true);
    };

    const handleAbrirNuevo = () => {
        setVentaEditar(null);
        setNuevaVenta({ fecha_venta: new Date().toISOString().split('T')[0], id_lote: '', cliente: '', kilos_vendidos: '', precio_total: '' });
        setModalOpen(true);
    };

    const handleGuardarVenta = async () => {
        if(!nuevaVenta.id_lote || !nuevaVenta.kilos_vendidos || !nuevaVenta.precio_total) return alert("Faltan datos obligatorios");
        try {
            if (ventaEditar) {
                await api.put(`/finanzas/ventas/${ventaEditar.id_venta}`, nuevaVenta);
                alert('¡Venta actualizada! 📝');
            } else {
                await api.post('/finanzas/ventas', nuevaVenta);
                alert('¡Venta registrada! 💰');
            }
            setModalOpen(false);
            cargarKPIs(); cargarVentas(); cargarGrafica(anioSeleccionado);
        } catch (error) { console.error(error); alert('Error al guardar'); }
    };

    const handleEliminarVenta = async (id) => {
        if(!window.confirm('¿Eliminar registro?')) return;
        try { await api.delete(`/finanzas/ventas/${id}`); cargarKPIs(); cargarVentas(); cargarGrafica(anioSeleccionado); } catch (e) { console.error(e); }
    };

    return (
        <Box sx={{ pb: 5 }}>
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
                    <TextField select size="small" value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(e.target.value)} sx={{ width: 100 }}>
                        <MenuItem value={2024}>2024</MenuItem>
                        <MenuItem value={2025}>2025</MenuItem>
                        <MenuItem value={2026}>2026</MenuItem>
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
                            <Bar dataKey="Egresos" fill="#008f39" name="Egresos" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Ingresos" fill="#e91e63" name="Ingresos" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>

            {/* --- 3. TABLA --- */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
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
                        {ventas.map((venta) => (
                            <TableRow key={venta.id_venta} hover>
                                <TableCell>{new Date(venta.fecha_venta).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="bold">{venta.nombre_lote}</Typography>
                                    <Chip label={venta.nombre_variedad || 'Sin Cultivo'} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell>{venta.cliente || '---'}</TableCell>
                                <TableCell>{venta.kilos_vendidos} Kg</TableCell>
                                <TableCell sx={{ color: '#2e7d32', fontWeight: 'bold' }}>${Number(venta.precio_total).toLocaleString()}</TableCell>
                                <TableCell>
                                    <IconButton color="primary" onClick={() => handleAbrirEditar(venta)}><EditIcon /></IconButton>
                                    <IconButton color="error" onClick={() => handleEliminarVenta(venta.id_venta)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- MODAL --- */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#1b5e20', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                    {ventaEditar ? 'Editar Venta' : 'Registrar Venta'}
                    <IconButton onClick={() => setModalOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                        <TextField label="Fecha" type="date" fullWidth InputLabelProps={{ shrink: true }} value={nuevaVenta.fecha_venta} onChange={(e) => setNuevaVenta({...nuevaVenta, fecha_venta: e.target.value})} />
                        <TextField select fullWidth label="Lote Cosechado" value={nuevaVenta.id_lote} onChange={(e) => setNuevaVenta({...nuevaVenta, id_lote: e.target.value})}>
                            {listaLotes.map((lote) => (
                                <MenuItem key={lote.id_lote} value={lote.id_lote}>{lote.nombre_lote} - {lote.nombre_variedad || 'Sin Cultivo'}</MenuItem>
                            ))}
                        </TextField>
                        <TextField label="Cliente" fullWidth value={nuevaVenta.cliente} onChange={(e) => setNuevaVenta({...nuevaVenta, cliente: e.target.value})} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Cantidad (Kg)" type="number" fullWidth value={nuevaVenta.kilos_vendidos} onChange={(e) => setNuevaVenta({...nuevaVenta, kilos_vendidos: e.target.value})} />
                            <TextField label="Total ($)" type="number" fullWidth InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} value={nuevaVenta.precio_total} onChange={(e) => setNuevaVenta({...nuevaVenta, precio_total: e.target.value})} />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setModalOpen(false)} color="error">Cancelar</Button>
                    <Button variant="contained" onClick={handleGuardarVenta} sx={{ bgcolor: '#1b5e20' }}>Guardar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Reportes;