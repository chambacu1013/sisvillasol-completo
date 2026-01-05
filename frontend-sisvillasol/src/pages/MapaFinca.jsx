import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Paper, Chip, CircularProgress } from '@mui/material';
import L from 'leaflet';
import api from '../services/api';

// --- ARREGLO PARA QUE LOS ICONOS DE LEAFLET SE VEAN BIEN EN REACT ---
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

// Icono Rojo para RIESGO
const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Icono Verde para OPTIMO
const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
// -------------------------------------------------------------------

const MapaFinca = () => {
    const [lotes, setLotes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Coordenadas centrales aproximadas (Calculadas con tus datos)
    const centroFinca = [7.1470, -72.6690]; 

    useEffect(() => {
        const cargarLotes = async () => {
            try {
                // Usamos la ruta existente que trae "ubicacion" y "estado_sanitario"
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

    if (loading) return <Box sx={{ display:'flex', justifyContent:'center', p:5 }}><CircularProgress /></Box>;

    return (
        <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#1b5e20' }}>
                🗺️ Mapa Fitosanitario - Villasol
            </Typography>

            {/* CONTENEDOR DEL MAPA (IMPORTANTE DARLE ALTURA) */}
            <Box sx={{ height: '500px', width: '100%', borderRadius: '10px', overflow: 'hidden' }}>
                <MapContainer center={centroFinca} zoom={16} style={{ height: '100%', width: '100%' }}>
                    
                    {/* Capa de Satélite (Esri World Imagery) para que parezca Google Earth */}
                    <TileLayer
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    
                    {/* Capa de etiquetas (Calles y nombres) opcional para guiarse */}
                     <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        opacity={0.3} // Transparente para ver el satélite abajo
                    />

                    {lotes.map((lote) => {
                        // 1. FILTRAR: Si no tiene coma (como 'Áreas comunes'), lo saltamos
                        if (!lote.ubicacion || !lote.ubicacion.includes(',')) return null;

                        // 2. PARSEO: Convertir string a numeros
                        // Tu BD tiene: "LONGITUD, LATITUD" -> "-72.669..., 7.146..."
                        const [longitudStr, latitudStr] = lote.ubicacion.split(',');
                        
                        const lat = parseFloat(latitudStr); // 7.14...
                        const lng = parseFloat(longitudStr); // -72.66...

                        // Leaflet necesita [LAT, LNG]
                        const posicion = [lat, lng];

                        return (
                            <Marker 
                                key={lote.id_lote} 
                                position={posicion}
                                icon={lote.estado_sanitario === 'RIESGO' ? redIcon : greenIcon}
                            >
                                {/* Tooltip se ve al pasar el mouse */}
                                <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                                    {lote.nombre_lote}
                                </Tooltip>

                                {/* Popup se abre al hacer click */}
                                <Popup>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            {lote.nombre_lote}
                                        </Typography>
                                        <Typography variant="caption" display="block">
                                            Cultivo: {lote.nombre_variedad || 'Sin siembra'}
                                        </Typography>
                                        <Typography variant="caption" display="block" sx={{ mb:1 }}>
                                            {lote.area_hectareas} Hectáreas
                                        </Typography>
                                        
                                        <Chip 
                                            label={lote.estado_sanitario || 'OPTIMO'} 
                                            color={lote.estado_sanitario === 'RIESGO' ? 'error' : 'success'} 
                                            size="small" 
                                        />
                                    </Box>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </Box>

            {/* LEYENDA */}
            <Box sx={{ mt: 2, display: 'flex', gap: 3, justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" height="25" />
                    <Typography variant="body2">Sano / Óptimo</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" height="25" />
                    <Typography variant="body2">Riesgo / Tarea Pendiente</Typography>
                </Box>
            </Box>
        </Paper>
    );
};

export default MapaFinca;