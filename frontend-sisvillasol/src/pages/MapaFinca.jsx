import React, { useState, useEffect, useRef } from 'react'; // <--- AGREGAMOS useRef
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
    Box, Typography, Paper, Chip, CircularProgress, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider 
} from '@mui/material';
import Grid from '@mui/material/Grid'; 
import AgricultureIcon from '@mui/icons-material/Agriculture';
import BugReportIcon from '@mui/icons-material/BugReport';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ContentCutIcon from '@mui/icons-material/ContentCut';

import L from 'leaflet';
import api from '../services/api';

// --- ICONOS LEAFLET ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const MapaFinca = () => {
    const [lotes, setLotes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // ESTADOS PARA EL DETALLE
    const [loteSeleccionado, setLoteSeleccionado] = useState(null);
    const [historialLote, setHistorialLote] = useState([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);

    // REFERENCIA PARA EL AUTO-SCROLL 👇
    const detalleRef = useRef(null);

    // Coordenadas centrales
    const centroFinca = [7.1471, -72.6690]; 

    useEffect(() => {
        const cargarLotes = async () => {
            try {
                const response = await api.get('/actividades/info-lotes');
                setLotes(response.data);
            } catch (error) {
                console.error("Error cargando mapa:", error);
            } finally {
                setLoading(false);
            }
        };
        cargarLotes();
    }, []);

    // --- EFECTO DE AUTO-SCROLL MÁGICO ✨ ---
    useEffect(() => {
        if (loteSeleccionado && detalleRef.current) {
            setTimeout(() => {
                // Opción A: La que tenías (muy pegada al borde)
                // detalleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Opción B: CON MARGEN (OFFSET) 📐
                // Calculamos dónde está el elemento y le restamos 100px (o lo que quieras) para que baje
                const yOffset = -100; // <--- CAMBIA ESTE NÚMERO: Más negativo = Más abajo queda el título
                const element = detalleRef.current;
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

                window.scrollTo({ top: y, behavior: 'smooth' });
                
            }, 100);
        }
    }, [loteSeleccionado]); // Se activa cada vez que seleccionas un lote

    // FUNCIÓN AL DAR CLICK EN UN PIN 📍
    const handleSelectLote = async (lote) => {
        setLoteSeleccionado(lote);
        setLoadingHistorial(true);
        try {
            const res = await api.get(`/actividades/historial-lote/${lote.id_lote}`);
            setHistorialLote(res.data);
        } catch (error) {
            console.error("Error cargando historial del lote", error);
            setHistorialLote([]);
        } finally {
            setLoadingHistorial(false);
        }
    };

    // Helper para icono de actividad
    const getIconoActividad = (nombre) => {
        const n = nombre.toLowerCase();
        if (n.includes('fumiga')) return <BugReportIcon color="error" />;
        if (n.includes('riego') || n.includes('fertiliza')) return <WaterDropIcon color="primary" />;
        if (n.includes('poda')) return <ContentCutIcon color="warning" />;
        return <AgricultureIcon color="success" />;
    };

    if (loading) return <Box sx={{ display:'flex', justifyContent:'center', p:5 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 2, mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#1b5e20' }}>
                    🗺️ Mapa Fitosanitario - Villasol
                </Typography>

                {/* --- MAPA ESTÁTICO (NO SE MUEVE) --- */}
                <Box sx={{ height: '500px', width: '100%', borderRadius: '10px', overflow: 'hidden' }}>
                    <MapContainer 
                        center={centroFinca} 
                        zoom={24} 
                        style={{ height: '100%', width: '100%' }}
                        
                        // BLOQUEOS PARA QUE SEA ESTÁTICO 🔒
                        dragging={false} 
                        scrollWheelZoom={false} 
                        doubleClickZoom={false} 
                        touchZoom={false} 
                        zoomControl={false} 
                        keyboard={false}
                    >
                        <TileLayer
                            attribution='&copy; Esri World Imagery'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                        <TileLayer
                            attribution='&copy; OpenStreetMap'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            opacity={0.3}
                        />

                        {lotes.map((lote) => {
                            if (!lote.ubicacion) return null;
                            const partes = lote.ubicacion.split(',');
                            if (partes.length < 2) return null;
                            const lng = parseFloat(partes[0].trim());
                            const lat = parseFloat(partes[1].trim());
                            if (isNaN(lat) || isNaN(lng)) return null;

                            return (
                                <Marker 
                                    key={lote.id_lote} 
                                    position={[lat, lng]}
                                    icon={lote.estado_sanitario === 'RIESGO' ? redIcon : greenIcon}
                                    eventHandlers={{
                                        click: () => handleSelectLote(lote), // El click activa el scroll
                                    }}
                                >
                                    <Tooltip direction="top" offset={[0, -20]} opacity={1}>{lote.nombre_lote}</Tooltip>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </Box>
                
                {/* LEYENDA */}
                <Box sx={{ mt: 2, display: 'flex', gap: 3, justifyContent: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" height="25" alt="sano"/>
                        <Typography variant="body2">Sano / Óptimo</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" height="25" alt="riesgo"/>
                        <Typography variant="body2">Riesgo / Tarea Pendiente</Typography>
                    </Box>
                </Box>
            </Paper>

            {/* --- SECCIÓN DETALLE (APARECE AL DAR CLICK Y BAJA AUTOMÁTICAMENTE) --- */}
            {loteSeleccionado && (
                <div ref={detalleRef}> {/* <--- AQUÍ ESTÁ EL ANCLA PARA EL SCROLL */}
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, animation: 'fadeIn 0.5s', borderTop: '4px solid #1b5e20' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                                📍 {loteSeleccionado.nombre_lote}
                            </Typography>
                            <Chip 
                                label={loteSeleccionado.estado_sanitario || 'OPTIMO'} 
                                color={loteSeleccionado.estado_sanitario === 'RIESGO' ? 'error' : 'success'} 
                                sx={{ fontWeight: 'bold' }}
                            />
                        </Box>

                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6} sm={3}>
                                <Typography variant="subtitle2" color="textSecondary">Cultivo:</Typography>
                                <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                    {loteSeleccionado.nombre_variedad || 'Sin Cultivo'}
                                </Typography>
                            </Grid>

                            <Grid item xs={6} sm={3}>
                                <Typography variant="subtitle2" color="textSecondary">Área:</Typography>
                                <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                    {loteSeleccionado.area_hectareas} Has
                                </Typography>
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
                                            <TableCell><b>Insumos Aplicados</b></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {historialLote.length > 0 ? (
                                            historialLote.map((fila) => (
                                                <TableRow key={fila.id_tarea} hover>
                                                    <TableCell>{new Date(fila.fecha_ejecucion).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {getIconoActividad(fila.nombre_tipo_actividad)}
                                                            {fila.nombre_tipo_actividad}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{fila.nombre_agricultor}</TableCell>
                                                    <TableCell>
                                                        {fila.insumos_usados ? (
                                                            fila.insumos_usados.map((ins, idx) => (
                                                                <Chip 
                                                                    key={idx} 
                                                                    label={`${ins.nombre}: ${ins.cantidad} ${ins.unidad}`} 
                                                                    size="small" 
                                                                    variant="outlined" 
                                                                    sx={{ mr: 0.5, mb: 0.5 }} 
                                                                />
                                                            ))
                                                        ) : <Typography variant="caption" color="textSecondary">Ninguno</Typography>}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                                    No hay registros de actividades para este lote.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </div>
            )}
        </Box>
    );
};

export default MapaFinca;