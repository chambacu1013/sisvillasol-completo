import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
    Box, Typography, Paper, Chip, CircularProgress, Popover,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, Button
} from '@mui/material';
import Grid from '@mui/material/Grid'; 
import AgricultureIcon from '@mui/icons-material/Agriculture';
import BugReportIcon from '@mui/icons-material/BugReport';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import InfoIcon from '@mui/icons-material/Info'; 
import UpdateIcon from '@mui/icons-material/Update';
import Swal from 'sweetalert2';
import L from 'leaflet';
import api from '../services/api';

// --- IMPORTAMOS EL NUEVO COMPONENTE ---
import ActualizarEstadoModal from '../components/ActualizarEstadoModal';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const MapaFinca = () => {
    const [lotes, setLotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loteSeleccionado, setLoteSeleccionado] = useState(null);
    const [historialLote, setHistorialLote] = useState([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null); 
    const [descripcionActiva, setDescripcionActiva] = useState(''); 
    const detalleRef = useRef(null);
    const centroFinca = [7.1473, -72.6690]; 

    // --- ESTADOS PARA ACTUALIZAR ESTADO AGRONÓMICO ---
    const [catalogoEstados, setCatalogoEstados] = useState([]);
    const [modalEstadoOpen, setModalEstadoOpen] = useState(false);
    const [clasificacionFiltro, setClasificacionFiltro] = useState('OPTIMO');
    const [idEstadoSeleccionado, setIdEstadoSeleccionado] = useState('');

    useEffect(() => {
        cargarLotes();
        cargarCatalogo();
    }, []);

    const cargarLotes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/lotes'); 
            setLotes(response.data);
        } catch (error) {
            console.error("Error cargando mapa:", error);
        } finally {
            setLoading(false);
        }
    };

    const cargarCatalogo = async () => {
        try {
            const response = await api.get('/lotes/catalogo-estados');
            setCatalogoEstados(response.data);
        } catch (error) {
            console.error("Error cargando catálogo agronómico:", error);
        }
    };

    useEffect(() => {
        if (loteSeleccionado && detalleRef.current) {
            setTimeout(() => {
                const yOffset = -100; 
                const element = detalleRef.current;
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }, 100);
        }
    }, [loteSeleccionado]);

    const handleSelectLote = async (lote) => {
        setLoteSeleccionado(lote);
        setLoadingHistorial(true);
        try {
            const res = await api.get(`/actividades/historial-lote/${lote.id_lote}`);
            setHistorialLote(res.data);
        } catch (error) {
            console.error("Error cargando historial", error);
            setHistorialLote([]);
        } finally {
            setLoadingHistorial(false);
        }
    };

    const handleClickDescripcion = (event, descripcion) => {
        setAnchorEl(event.currentTarget); 
        setDescripcionActiva(descripcion || 'Sin detalles adicionales registrados.');
    };

    const handleClosePopover = () => {
        setAnchorEl(null); setDescripcionActiva('');
    };
    const openPopover = Boolean(anchorEl);

    const getIconoActividad = (nombre) => {
        const n = nombre.toLowerCase();
        if (n.includes('fumiga')) return <BugReportIcon color="error" />;
        if (n.includes('riego') || n.includes('fertiliza')) return <WaterDropIcon color="primary" />;
        if (n.includes('poda')) return <ContentCutIcon color="warning" />;
        return <AgricultureIcon color="success" />;
    };

    // --- FUNCIÓN PARA GUARDAR EL NUEVO ESTADO ---
    const handleGuardarEstado = async () => {
        if (!idEstadoSeleccionado) {
            Swal.fire('Error', 'Debes seleccionar un estado de la lista', 'warning');
            return;
        }
        try {
            await api.put(`/lotes/estado/${loteSeleccionado.id_lote}`, { id_estado_actual: idEstadoSeleccionado });
            Swal.fire({ icon: 'success', title: '¡Actualizado!', text: 'El estado del lote ha sido modificado.', timer: 2000, showConfirmButton: false });
            setModalEstadoOpen(false);
            
            // Recargamos el mapa y cerramos el detalle temporalmente para que se refresque
            cargarLotes();
            setLoteSeleccionado(null);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
        }
    };

    // Filtrar catálogo según si eligió VERDE (Optimo) o ROJO (Alerta)
    const estadosFiltrados = catalogoEstados.filter(e => e.clasificacion === clasificacionFiltro);

    if (loading) return <Box sx={{ display:'flex', justifyContent:'center', p:5 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 2, mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#1b5e20' }}>
                    🗺️ Mapa Agronómico y Fitosanitario
                </Typography>

                <Box sx={{ height: '500px', width: '100%', borderRadius: '10px', overflow: 'hidden' }}>
                    <MapContainer 
                        center={centroFinca} zoom={24} style={{ height: '100%', width: '100%' }}
                        dragging={false} scrollWheelZoom={false} doubleClickZoom={false} 
                        touchZoom={false} zoomControl={false} keyboard={false}
                    >
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" opacity={0.3} />

                        {lotes.map((lote) => {
                            if (!lote.coordenadas) return null;
                            const partes = lote.coordenadas.split(',');
                            if (partes.length < 2) return null;
                            const lng = parseFloat(partes[0].trim()); const lat = parseFloat(partes[1].trim());
                            if (isNaN(lat) || isNaN(lng)) return null;

                            return (
                                <Marker 
                                    key={lote.id_lote} position={[lat, lng]}
                                    icon={lote.estado_sanitario === 'ALERTA' ? redIcon : greenIcon}
                                    eventHandlers={{ click: () => handleSelectLote(lote) }}
                                >
                                    <Tooltip direction="top" offset={[0, -20]} opacity={1}>{lote.nombre_lote}</Tooltip>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 3, justifyContent: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" height="25" alt="sano"/>
                        <Typography variant="body2">Ciclo Productivo Normal</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" height="25" alt="riesgo"/>
                        <Typography variant="body2">Alerta Fitosanitaria</Typography>
                    </Box>
                </Box>
            </Paper>

            {loteSeleccionado && (
                <div ref={detalleRef}> 
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, animation: 'fadeIn 0.5s', borderTop: '4px solid #1b5e20' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                                    📍 {loteSeleccionado.nombre_lote}
                                </Typography>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontStyle: 'italic', mt: 0.5 }}>
                                    Etapa Actual: <b>{loteSeleccionado.nombre_estado || 'Desconocida'}</b>
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
                                    {loteSeleccionado.descripcion_estado}
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                                <Chip 
                                    label={loteSeleccionado.estado_sanitario === 'ALERTA' ? '🔴 ALERTA' : '🟢 ÓPTIMO'} 
                                    color={loteSeleccionado.estado_sanitario === 'ALERTA' ? 'error' : 'success'} 
                                    sx={{ fontWeight: 'bold' }}
                                />
                                <Button 
                                    variant="outlined" size="small" startIcon={<UpdateIcon />}
                                    onClick={() => {
                                        setClasificacionFiltro(loteSeleccionado.estado_sanitario || 'OPTIMO');
                                        setIdEstadoSeleccionado('');
                                        setModalEstadoOpen(true);
                                    }}
                                >
                                    Actualizar Estado
                                </Button>
                            </Box>
                        </Box>

                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6} sm={3}>
                                <Typography variant="subtitle2" color="textSecondary">Cultivo:</Typography>
                                <Typography variant="h6" sx={{ fontSize: '1rem' }}>{loteSeleccionado.nombre_variedad || 'Sin Cultivo'}</Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Typography variant="subtitle2" color="textSecondary">Área:</Typography>
                                <Typography variant="h6" sx={{ fontSize: '1rem' }}>{loteSeleccionado.area_hectareas} Has</Typography>
                            </Grid>
                            
                            {/* COLUMNA NUEVA DE ÁRBOLES 🌳 */}
                            <Grid item xs={6} sm={3}>
                                <Typography variant="subtitle2" color="textSecondary">N° Árboles:</Typography>
                                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold', color: '#2e7d32' }}>
                                    {loteSeleccionado.cantidad_arboles || 0} 🌳
                                </Typography>
                            </Grid>

                            <Grid item xs={6} sm={3}>
                                <Typography variant="subtitle2" color="textSecondary">Cosecha Estimada:</Typography>
                                <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                    {loteSeleccionado.dias_estimados_cosecha || 'N/A'} días
                                </Typography>
                            </Grid>
                        </Grid>

                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="h6" sx={{ mb: 2, color: '#1b5e20', display: 'flex', alignItems: 'center', gap: 1 }}>
                            📋 Historial de Labores
                        </Typography>

                        {loadingHistorial ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={30} /></Box>
                        ) : (
                            <TableContainer sx={{ maxHeight: 400 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><b>Fecha</b></TableCell>
                                            <TableCell><b>Actividad</b></TableCell>
                                            <TableCell><b>Agricultor</b></TableCell>
                                            <TableCell><b>Insumos</b></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {historialLote.length > 0 ? (
                                            historialLote.map((fila) => (
                                                <TableRow key={fila.id_tarea} hover>
                                                    <TableCell>{new Date(fila.fecha_ejecucion).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</TableCell>
                                                    <TableCell 
                                                        onClick={(e) => handleClickDescripcion(e, fila.descripcion)}
                                                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' }, textDecoration: 'underline dotted', textDecorationColor: '#999' }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {getIconoActividad(fila.nombre_tipo_actividad)}
                                                            <Typography variant="body2" sx={{ fontWeight: '500' }}>{fila.nombre_tipo_actividad}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{fila.nombre_agricultor}</TableCell>
                                                    <TableCell>
                                                        {fila.insumos_usados ? (
                                                            fila.insumos_usados.map((ins, idx) => (
                                                                <Chip key={idx} label={`${ins.nombre}: ${ins.cantidad} ${ins.unidad}`} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                                                            ))
                                                        ) : <Typography variant="caption" color="textSecondary">Ninguno</Typography>}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>No hay registros de actividades para este lote.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </div>
            )}

            <Popover
                open={openPopover} anchorEl={anchorEl} onClose={handleClosePopover}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{ sx: { p: 2, maxWidth: 300, bgcolor: '#fffde7', border: '1px solid #fbc02d' } }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#f57f17', mb: 0.5 }}>📝 Detalles:</Typography>
                <Typography variant="body2" sx={{ color: '#333' }}>{descripcionActiva}</Typography>
            </Popover>

            {/* ---SE RENDERIZA EL NUEVO COMPONENTE --- */}
            <ActualizarEstadoModal 
                open={modalEstadoOpen}
                onClose={() => setModalEstadoOpen(false)}
                loteSeleccionado={loteSeleccionado}
                clasificacionFiltro={clasificacionFiltro}
                setClasificacionFiltro={setClasificacionFiltro}
                idEstadoSeleccionado={idEstadoSeleccionado}
                setIdEstadoSeleccionado={setIdEstadoSeleccionado}
                estadosFiltrados={estadosFiltrados}
                handleGuardarEstado={handleGuardarEstado}
            />

        </Box>
    );
};

export default MapaFinca;