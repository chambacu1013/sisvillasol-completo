import { useState, useEffect } from 'react';
import { 
    IconButton, Badge, Menu, MenuItem, ListItemIcon, 
    ListItemText, Typography, Box, Divider 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// ÍCONOS
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningIcon from '@mui/icons-material/Warning'; // Stock bajo
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'; // Sanidad
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import api from '../services/api';

const NotificationBell = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [alertas, setAlertas] = useState([]);
    
    const open = Boolean(anchorEl);

    useEffect(() => {
        cargarAlertas();
        // Recargar cada 2 minutos por si actualizan tareas
        const intervalo = setInterval(cargarAlertas, 100000); 
        return () => clearInterval(intervalo);
    }, []);

    const cargarAlertas = async () => {
        const nuevasAlertas = [];

        try {
            // 1. OBTENER INSUMOS (Stock Bajo)
            const resInsumos = await api.get('/insumos');
            resInsumos.data.forEach(insumo => {
                // CORRECCIÓN AQUÍ: Agregamos la validación del estado
                // Solo mostramos alerta si el stock es bajo Y el estado NO es "Fuera de mercado"
                if (['BAJO STOCK'].includes(insumo.estado_insumo)) {
                    nuevasAlertas.push({
                        tipo: 'STOCK',
                        titulo: 'Stock Crítico',
                        mensaje: `El insumo ${insumo.nombre} requiere atencion.`,
                        ruta: '/inventario'
                    });
                }
            });

            // 2. OBTENER LOTES CON PROBLEMAS (Actualizados por la lógica SQL)
            // Asegúrate de que este endpoint traiga el campo 'estado_sanitario'
            const resLotes = await api.get('/actividades/datos-formulario'); 
            const lotes = resLotes.data.lotes || [];

            lotes.forEach(lote => {
                // Si el SQL lo marcó como EN_TRATAMIENTO o CUARENTENA
                if (['EN_TRATAMIENTO', 'CUARENTENA', 'RIESGO'].includes(lote.estado_sanitario)) {
                    nuevasAlertas.push({
                        id: `lote-${lote.id_lote}`,
                        tipo: 'LOTE',
                        titulo: `¡Lote en ${lote.estado_sanitario}!`,
                        mensaje: `${lote.nombre_lote} tiene tareas atrasadas o químicos.`,
                        ruta: '/lotes'
                    });
                }
            });

            setAlertas(nuevasAlertas);

        } catch (error) {
            console.error("Error cargando notificaciones:", error);
        }
    };

    const handleClick = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleIrA = (ruta) => {
        navigate(ruta);
        handleClose();
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleClick} sx={{ mr: 1 }}>
                <Badge badgeContent={alertas.length} color="error">
                    <NotificationsIcon /> 
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    elevation: 4,
                    sx: { width: 320, maxHeight: 400, mt: 1.5 }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ p: 2, pb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Notificaciones</Typography>
                    <Typography variant="caption" color="textSecondary">
                        {alertas.length > 0 ? `Atención requerida en ${alertas.length} items` : 'Todo en orden'}
                    </Typography>
                </Box>
                <Divider />

                {alertas.length === 0 ? (
                    <MenuItem onClick={handleClose}>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText primary="Sin novedades" secondary="La finca opera al 100%" />
                    </MenuItem>
                ) : (
                    alertas.map((alerta, index) => (
                        <MenuItem key={index} onClick={() => handleIrA(alerta.ruta)}>
                            <ListItemIcon>
                                {alerta.tipo === 'STOCK' ? 
                                    <WarningIcon sx={{ color: '#ff9800' }} /> : 
                                    <HealthAndSafetyIcon sx={{ color: '#d32f2f' }} />
                                }
                            </ListItemIcon>
                            <ListItemText 
                                primary={
                                    <Typography variant="body2" fontWeight="bold" color="textPrimary">
                                        {alerta.titulo}
                                    </Typography>
                                } 
                                secondary={
                                    <Typography 
                                        variant="caption" 
                                        color="textSecondary"
                                        sx={{ 
                                            display: 'block',       // Comportamiento de bloque
                                            whiteSpace: 'normal',   // PERMITE SALTO DE LÍNEA
                                            wordBreak: 'break-word' // Evita que se salga del recuadro
                                        }}
                                    >
                                        {alerta.mensaje}
                                    </Typography>
                                } 
                            />
                        </MenuItem>
                    ))
                )}
            </Menu>
        </>
    );
};

export default NotificationBell;