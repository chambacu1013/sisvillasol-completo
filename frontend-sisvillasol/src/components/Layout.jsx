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

const drawerWidth = 240; 

function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [mobileOpen, setMobileOpen] = useState(false); 
    
    const [usuarioActual, setUsuarioActual] = useState({
        nombre: 'Usuario',
        apellido: '',
        rol: 'Invitado',
        iniciales: 'US'
    });

    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const nombre = localStorage.getItem('usuarioNombre') || 'Usuario';
        const apellido = localStorage.getItem('usuarioApellido') || '';
        const rol = localStorage.getItem('usuarioRol') || 'Invitado';
        
        const iniciales = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
        setUsuarioActual({ nombre, apellido, rol, iniciales });
    }, []);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

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

    const getTitulo = () => {
        switch(location.pathname) {
            case '/dashboard': return 'Panel de Control'; 
            case '/inicio': return 'Identidad Corporativa';
            case '/lotes': return 'Gestión de Lotes';
            case '/calendario': return 'Calendario de Actividades';
            case '/inventario': return 'Inventario de Insumos';
            case '/reportes': return 'Reportes Financieros';
            case '/usuarios': return 'Gestión de Usuarios';
            default: return 'Sistema SISVILLASOL';
        }
    };

    return (
        // 🚨 CAMBIO 1: Bloqueo absoluto de scroll horizontal a nivel de la raíz 🚨
        <Box sx={{ display: 'flex', width: '100vw', overflowX: 'hidden' }}>
            <CssBaseline />

            {/* --- BARRA SUPERIOR (NAVBAR) --- */}
            <AppBar 
                position="fixed" 
                sx={{ 
                    width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: '#fff', 
                    color: '#333',
                    boxShadow: 1,
                    right: 0 // Forzamos a que nunca pase del borde derecho
                }}
            >
                {/* 🚨 CAMBIO 2: Padding reducido en móvil para ganar espacio */}
                <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
                    
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: { xs: 1, sm: 2 }, display: { sm: 'none' } }} 
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* 🚨 CAMBIO 3: Magia para que el texto NO empuje al Avatar 🚨 */}
                    <Typography 
                        variant="h6" 
                        noWrap 
                        component="div" 
                        sx={{ 
                            flexGrow: 1, 
                            fontWeight: 'bold', 
                            color: '#1b5e20',
                            fontSize: { xs: '1rem', sm: '1.25rem' }, // Letra un poco menor en celular
                            minWidth: 0, // <--- ESTO ES VITAL: Obliga al texto a encogerse si no hay espacio
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            mr: 1
                        }}
                    >
                        {getTitulo()}
                    </Typography>

                    {/* 🚨 CAMBIO 4: blindamos la caja de iconos para que sea intocable */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 }, flexShrink: 0 }}>
                        <NotificationBell />
                        
                        <IconButton onClick={handleMenuClick} size="small" sx={{ p: 0.5 }}>
                            <Avatar sx={{ bgcolor: '#1b5e20', width: { xs: 32, sm: 35 }, height: { xs: 32, sm: 35 }, fontSize: '0.9rem' }}>
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
                        disableScrollLock={true} // Evita el salto al hacer clic
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
                    p: { xs: 2, sm: 3 }, // Menos margen en celular para aprovechar pantalla
                    bgcolor: '#f4f6f8', 
                    minHeight: '100vh',
                    width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
                    marginTop: '64px',
                    overflowX: 'hidden' // Evita que tablas largas creen scroll horizontal global
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