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

// RECIBIMOS LAS PROPIEDADES DEL LAYOUT (ESTO FALTABA PARA QUE NO SE TOTEE)
const Sidebar = ({ mobileOpen = false, handleDrawerToggle = () => {} }) => { 
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
                            // --- TUS ESTILOS ORIGINALES RESTAURADOS ---
                            sx={{
                                minHeight: 48,
                                justifyContent: 'initial',
                                px: 2.5,
                                // Tu diseño original: fondo transparente con tinte verde suave y borde izquierdo
                                bgcolor: location.pathname === item.path ? 'rgba(27, 94, 32, 0.1)' : 'transparent', 
                                borderLeft: location.pathname === item.path ? '4px solid #1b5e20' : '4px solid transparent'
                            }}
                            // ------------------------------------------
                            onClick={() => {
                                navigate(item.path);
                                // LA LÓGICA CORREGIDA: Solo intenta cerrar si la función existe y estamos en modo móvil
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
                                    // Tu color original para iconos
                                    color: location.pathname === item.path ? '#1b5e20' : '#757575'
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={item.text} 
                                primaryTypographyProps={{ 
                                    // Tu tipografía original
                                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                                    color: location.pathname === item.path ? '#1b5e20' : 'inherit'
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
            {/* --- DRAWER MÓVIL --- */}
            <Drawer
                variant="temporary"
                open={!!mobileOpen} // Doble negación para asegurar que sea booleano y no se totee
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* --- DRAWER ESCRITORIO --- */}
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