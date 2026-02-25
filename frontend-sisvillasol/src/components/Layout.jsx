import { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, Avatar, Menu, MenuItem, ListItemIcon, IconButton, CssBaseline } from '@mui/material';
import Sidebar from './Sidebar';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import EditarEmpresaModal from './EditarEmpresaModal';
import NotificationBell from './NotificationBell'; 

// Iconos
import BusinessIcon from '@mui/icons-material/Business';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu'; 

const drawerWidth = 240; // ANCHO FIJO DEL MENÚ

function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // YA NO USAMOS 'open' PARA COLAPSAR. EL MENÚ SIEMPRE ESTÁ ABIERTO EN PC.
    // Solo manejamos el estado móvil.
    const [mobileOpen, setMobileOpen] = useState(false); 
    
    const [usuarioActual, setUsuarioActual] = useState({
        nombre: 'Usuario',
        apellido: '',
        rol: 'Invitado',
        iniciales: 'US'
    });

    // Estado para el menú del perfil (Avatar)
    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);

    // Estado Modal Empresa
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const nombre = localStorage.getItem('usuarioNombre') || 'Usuario';
        const apellido = localStorage.getItem('usuarioApellido') || '';
        const rol = localStorage.getItem('usuarioRol') || 'Invitado';
        
        const iniciales = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
        setUsuarioActual({ nombre, apellido, rol, iniciales });
    }, []);

    // --- FUNCIÓN ÚNICA: ABRIR/CERRAR MENÚ MÓVIL ---
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Funciones del menú perfil
    const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };
    const handleAbrirConfig = () => {
        setModalOpen(true);
        handleMenuClose();
    };

    // Título dinámico según la ruta
    const getTitulo = () => {
        switch(location.pathname) {
            case '/dashboard': return 'Panel de Control'; 
            case '/inicio': return 'Identidad Corporativa';
            case '/lotes': return 'Gestión de Lotes (Mapa)';
            case '/calendario': return 'Calendario de Actividades';
            case '/inventario': return 'Inventario de Insumos';
            case '/reportes': return 'Reportes Financieros';
            case '/usuarios': return 'Gestión de Usuarios';
            default: return 'Sistema SISVILLASOL';
        }
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />

            {/* --- BARRA SUPERIOR (NAVBAR) --- */}
            <AppBar 
                position="fixed" 
                sx={{ 
                    // EN PC: Ancho total MENOS el menú (que ahora es fijo)
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    // EN PC: Empuja la barra a la derecha
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: '#fff', 
                    color: '#333',
                    boxShadow: 1
                }}
            >
                <Toolbar>
                    {/* BOTÓN HAMBURGUESA (3 RAYITAS) */}
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }} 
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* TÍTULO */}
                    <Typography 
                        variant="h6" 
                        noWrap 
                        component="div" 
                        sx={{ 
                            flexGrow: 1, 
                            fontWeight: 'bold', 
                            color: '#1b5e20',
                            // En celular, hacemos la letra un poco más pequeña para que no empuje todo
                            fontSize: { xs: '1.1rem', sm: '1.25rem' } 
                        }}
                    >
                        {getTitulo()}
                    </Typography>

                    {/* CAMPANA Y PERFIL (CONTENEDOR RÍGIDO) */}
                    {/* Añadimos flexShrink: 0 para que NUNCA se encoja ni se mueva */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexShrink: 0 }}>
                        <NotificationBell />
                        
                        {/* Quitamos el ml: 2 de aquí porque el gap de arriba ya hace el trabajo */}
                        <IconButton onClick={handleMenuClick} size="small" sx={{ p: 0.5 }}>
                            <Avatar sx={{ bgcolor: '#1b5e20', width: 35, height: 35, fontSize: '0.9rem' }}>
                                {usuarioActual.iniciales}
                            </Avatar>
                        </IconButton>
                    </Box>

                    {/* MENÚ DESPLEGABLE PERFIL */}
                    <Menu
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={handleMenuClose}
                        onClick={handleMenuClose}
                        // 🚨 ESTA ES LA LÍNEA MÁGICA QUE EVITA EL SALTO EN CELULARES 🚨
                        disableScrollLock={true} 
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                overflow: 'visible',
                                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                mt: 1.5,
                                '&:before': {
                                    content: '""', display: 'block', position: 'absolute', top: 0, right: 14, width: 10, height: 10, bgcolor: 'background.paper', transform: 'translateY(-50%) rotate(45deg)', zIndex: 0,
                                },
                            },
                        }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem disabled>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#333' }}>
                                    {usuarioActual.nombre} {usuarioActual.apellido}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#666' }}>
                                    {usuarioActual.rol}
                                </Typography>
                            </Box>
                        </MenuItem>
                        <MenuItem onClick={handleAbrirConfig}>
                            <ListItemIcon><BusinessIcon fontSize="small" /></ListItemIcon>
                            Configurar identidad corporativa
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                            Salir
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* --- SIDEBAR --- */}
            <Sidebar 
                open={true} 
                mobileOpen={mobileOpen} 
                handleDrawerToggle={handleDrawerToggle} 
            />

            {/* --- CONTENIDO PRINCIPAL --- */}
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    p: 3, 
                    bgcolor: '#f4f6f8', 
                    minHeight: '100vh',
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    marginTop: '64px' 
                }}
            >
                <Outlet />
                
                <EditarEmpresaModal 
                    open={modalOpen} 
                    onClose={() => setModalOpen(false)}
                    alGuardar={() => window.location.reload()} 
                />
            </Box>
        </Box>
    );
}

export default Layout;