import React from 'react';
import { 
    Box, Drawer, List, ListItem, ListItemButton, 
    ListItemIcon, ListItemText, Toolbar, Divider, Typography 
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

// Iconos
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import MapIcon from '@mui/icons-material/Map';
import LogoutIcon from '@mui/icons-material/Logout';
import AgricultureIcon from '@mui/icons-material/Agriculture';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => { 
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { text: 'Resumen', icon: <DashboardIcon />, path: '/home' },
        { text: 'Actividades', icon: <AssignmentIcon />, path: '/actividades' },
        { text: 'Finanzas', icon: <MonetizationOnIcon />, path: '/finanzas' },
        { text: 'Mapa', icon: <MapIcon />, path: '/mapa' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    // Diseño del Menú (Contenido)
    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Encabezado del Sidebar */}
            <Toolbar sx={{ bgcolor: '#1b5e20', color: 'white', justifyContent: 'center' }}>
                <AgricultureIcon sx={{ mr: 1 }} />
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
                    SISVILLASOL
                </Typography>
            </Toolbar>
            <Divider />
            
            <List sx={{ p: 1 }}> {/* Un poco de padding para que los botones no toquen los bordes */}
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                            <ListItemButton
                                sx={{
                                    minHeight: 48,
                                    borderRadius: 2, // Bordes redondeados modernos
                                    justifyContent: 'initial',
                                    px: 2.5,
                                    // --- CORRECCIÓN DE COLORES ---
                                    bgcolor: isActive ? '#2e7d32' : 'transparent', // Verde sólido si está activo
                                    color: isActive ? 'white' : 'inherit',          // Letra blanca si está activo
                                    '&:hover': {
                                        bgcolor: isActive ? '#1b5e20' : 'rgba(0, 0, 0, 0.04)', // Oscurecer al pasar mouse
                                    }
                                }}
                                onClick={() => {
                                    navigate(item.path);
                                    // Cierra el menú móvil solo si estamos en modo móvil
                                    if (mobileOpen && typeof handleDrawerToggle === 'function') {
                                        handleDrawerToggle();
                                    }
                                }}
                            >
                                <ListItemIcon 
                                    sx={{ 
                                        minWidth: 0,
                                        mr: 2,
                                        justifyContent: 'center',
                                        // Icono blanco si está activo, gris si no
                                        color: isActive ? 'white' : '#757575' 
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontWeight: isActive ? 'bold' : 'normal',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Box sx={{ flexGrow: 1 }} />
            <Divider />
            
            {/* Botón Salir */}
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={handleLogout} sx={{ '&:hover': { bgcolor: '#ffebee' } }}>
                        <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
                        <ListItemText primary="Cerrar Sesión" sx={{ color: '#d32f2f', fontWeight: 'bold' }} />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
            
            {/* --- VERSIÓN MÓVIL (TEMPORAL) --- */}
            <Drawer
                variant="temporary"
                open={Boolean(mobileOpen)} // Validamos que sea booleano para evitar crashes
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }} // Mejor rendimiento en celular
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* --- VERSIÓN ESCRITORIO (PERMANENTE) --- */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
};

export default Sidebar;