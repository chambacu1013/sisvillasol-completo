import React from 'react';
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

const drawerWidth = 240; // Ancho FIJO siempre

const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, path: '/inicio' },
    { text: 'Lotes (Mapa)', icon: <MapIcon />, path: '/lotes' },
    { text: 'Calendario', icon: <CalendarTodayIcon />, path: '/calendario' },
    { text: 'Inventario', icon: <InventoryIcon />, path: '/inventario' },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/reportes' },
    { text: 'Gestión de usuarios', icon: <PeopleIcon />, path: '/usuarios' },
];

// NOTA: Ya no usamos 'open' para nada visual. Solo 'mobileOpen'.
function Sidebar({ mobileOpen = false, handleDrawerToggle = () => {} }) {
    const navigate = useNavigate();
    const location = useLocation();

    // Contenido del Drawer (IGUAL PARA AMBOS, SIEMPRE EXPANDIDO)
    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1b5e20', color: 'white' }}>
            
            {/* 1. CABECERA LOGO (SIEMPRE GRANDE) */}
            <Box 
                sx={{ 
                    height: 140, // Altura fija
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: '#144a17',
                }}
            >
                <Box 
                    component="img"
                    src="/logo1.png" 
                    alt="Logo Villasol"
                    sx={{ width: '90%', height: 'auto', objectFit: 'contain' }}
                />
            </Box>

            {/* 2. LISTA DE MÓDULOS */}
            <List sx={{ flexGrow: 1, pt: 2 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                            sx={{
                                minHeight: 48,
                                justifyContent: 'initial', // Siempre alineado a la izquierda
                                px: 2.5,
                                backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                            }}
                            onClick={() => {
                                navigate(item.path); 
                                // CIERRE AUTOMÁTICO SOLO EN MÓVIL
                                if (mobileOpen) {
                                    handleDrawerToggle();
                                }
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: 3, // Margen fijo siempre
                                    justifyContent: 'center',
                                    color: 'white'
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            {/* TEXTO SIEMPRE VISIBLE */}
                            <ListItemText primary={item.text} sx={{ opacity: 1 }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            
            {/* 3. BOTÓN SALIR */}
            <List>
                <ListItemButton 
                    onClick={() => { localStorage.clear(); navigate('/'); }}
                    sx={{ minHeight: 48, justifyContent: 'initial', px: 2.5 }}
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: 'center', color: '#ffcdd2' }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Salir" sx={{ opacity: 1, color: '#ffcdd2' }} />
                </ListItemButton>
            </List>

            {/* Copyright */}
            <Box sx={{ p: 2, textAlign: 'center', fontSize: '0.5rem', opacity: 0.7 }}>
                <Typography variant="caption" display="block">SISVILLASOL 2026</Typography>
            </Box>
        </Box>
    );

    return (
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
            
            {/* --- DRAWER MÓVIL (TEMPORAL) --- 
                Este es el que se abre con el botón de las 3 rayitas */}
            <Drawer
                variant="temporary"
                open={!!mobileOpen} 
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* --- DRAWER ESCRITORIO (FIJO) --- 
                Siempre visible en pantallas grandes */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth, // ANCHO FIJO, NADA DE 65px
                        borderRight: 'none'
                    },
                }}
                open // Siempre abierto en PC
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}

export default Sidebar;