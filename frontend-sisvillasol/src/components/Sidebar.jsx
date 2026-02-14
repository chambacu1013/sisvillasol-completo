import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Box, Divider, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

// Iconos
import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InventoryIcon from '@mui/icons-material/Inventory2';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
const drawerWidth = 240; // Ancho cuando está abierto

const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, path: '/inicio' },
    { text: 'Lotes (Mapa)', icon: <MapIcon />, path: '/lotes' },
    { text: 'Calendario', icon: <CalendarTodayIcon />, path: '/calendario' },
    { text: 'Inventario', icon: <InventoryIcon />, path: '/inventario' },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/reportes' },
    { text: 'Gestión de usuarios', icon: <PeopleIcon />, path: '/usuarios' },
];

function Sidebar({ open, mobileOpen, handleDrawerToggle }) {
    const navigate = useNavigate();
    const location = useLocation();

    // Contenido del Drawer (Lo separamos para usarlo en móvil y escritorio)
    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1b5e20', color: 'white' }}>
            
            {/* 1. CABECERA LOGO (Sin Padding, pegado arriba) */}
            <Box 
                sx={{ 
                    height: open ? 140 : 64, // Se encoge si está colapsado
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: '#144a17', // Un verde un poco más oscuro para el logo
                    transition: '0.3s',
                    overflow: 'hidden'
                }}
            >
                {open ? (
                     // LOGO GRANDE (Cuando está abierto)
                    <Box 
                        component="img"
                        src="/logo1.png" 
                        alt="Logo Villasol"
                        sx={{ width: '99%', height: 'auto', objectFit: 'contain' }}
                    />
                ) : (
                    // LOGO PEQUEÑO O TEXTO (Cuando está cerrado)
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>FV</Typography>
                )}
            </Box>

            {/* 2. LISTA DE MÓDULOS */}
            <List sx={{ flexGrow: 1, pt: 2 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                        <Tooltip title={!open ? item.text : ""} placement="right">
                            <ListItemButton
                                sx={{
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2.5,
                                    backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                                }}
                                onClick={() => {
                                navigate(item.path); // 1. Navega a la ruta
                                if (mobileOpen) {
                                    handleDrawerToggle(); // 2. Si es móvil (está abierto), CIÉRRALO.
                                }
                            }}
                                
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
                                        justifyContent: 'center',
                                        color: 'white'
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                            </ListItemButton>
                        </Tooltip>
                    </ListItem>
                ))}
            </List>

            {/* 3. BOTÓN SALIR Y PIE DE PÁGINA */}
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            
            <List>
                <ListItemButton 
                    onClick={() => { localStorage.clear(); navigate('/'); }}
                    sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center', color: '#ffcdd2' }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Salir" sx={{ opacity: open ? 1 : 0, color: '#ffcdd2' }} />
                </ListItemButton>
            </List>

            {/* Texto de Copyright (Solo visible si está abierto) */}
            {open && (
                <Box sx={{ p: 2, textAlign: 'center', fontSize: '0.5rem', opacity: 0.7 }}>
                    <Typography variant="caption" display="block">SISVILLASOL Vereda de Bartaquí, Chitagá</Typography>
                    <Typography variant="caption" display="block">Norte de Santander 2026</Typography>
                </Box>
            )}
        </Box>
    );

    return (
        <Box component="nav" sx={{ width: { sm: open ? drawerWidth : 65 }, flexShrink: { sm: 0 }, transition: 'width 0.3s' }}>
            {/* Drawer Temporal para Móviles (Se abre encima de todo) */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Drawer Permanente para Escritorio (Se encoge) */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: open ? drawerWidth : 65, // AQUÍ ESTÁ LA MAGIA DEL ANCHO
                        transition: 'width 0.3s',
                        overflowX: 'hidden',
                        borderRight: 'none'
                    },
                }}
                open={open}
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}

export default Sidebar;