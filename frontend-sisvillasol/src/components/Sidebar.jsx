import React from 'react';
import { 
    Box, Drawer, List, ListItem, ListItemButton, 
    ListItemIcon, ListItemText, Toolbar, Divider, Typography 
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

// Iconos
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment'; // Actividades
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'; // Finanzas
import MapIcon from '@mui/icons-material/Map'; // Mapas
import LogoutIcon from '@mui/icons-material/Logout';
import AgricultureIcon from '@mui/icons-material/Agriculture';

const drawerWidth = 240;

// 1. AQUÍ ESTABA EL ERROR: Faltaba recibir las props dentro de las llaves { }
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

    // Contenido del menú (común para móvil y escritorio)
    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{ bgcolor: '#2e7d32', color: 'white' }}>
                <AgricultureIcon sx={{ mr: 2 }} />
                <Typography variant="h6" noWrap component="div">
                    SISVILLASOL
                </Typography>
            </Toolbar>
            <Divider />
            
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                            sx={{
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2.5,
                                    backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                                }}
                            onClick={() => {
                                navigate(item.path);
                                // 2. CORRECCIÓN: Si estamos en móvil, cerramos el menú al hacer clic
                                if (mobileOpen && handleDrawerToggle) {
                                    handleDrawerToggle();
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: location.pathname === item.path ? '#2e7d32' : '#757575' }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={item.text} 
                                primaryTypographyProps={{ 
                                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                                    color: location.pathname === item.path ? '#2e7d32' : 'inherit'
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Box sx={{ flexGrow: 1 }} />
            <Divider />
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={handleLogout}>
                        <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
                        <ListItemText primary="Cerrar Sesión" sx={{ color: '#d32f2f' }} />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
            
            {/* --- CAJÓN MÓVIL (TEMPORAL) --- */}
            <Drawer
                variant="temporary"
                open={mobileOpen}  // <--- ¡AQUÍ ES DONDE OBEDECE AL LAYOUT!
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }} // Mejor rendimiento en móviles
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* --- CAJÓN ESCRITORIO (PERMANENTE) --- */}
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