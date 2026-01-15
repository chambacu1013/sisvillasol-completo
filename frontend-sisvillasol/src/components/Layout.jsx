import { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, Avatar, Menu, MenuItem, ListItemIcon, IconButton, CssBaseline } from '@mui/material';
import Sidebar from './Sidebar';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import EditarEmpresaModal from './EditarEmpresaModal';
// 1. IMPORTAR LA CAMPANA
import NotificationBell from './NotificationBell'; 

// Iconos
import BusinessIcon from '@mui/icons-material/Business';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu'; 

function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // ESTADOS PARA EL SIDEBAR
    const [open, setOpen] = useState(true); 
    const [mobileOpen, setMobileOpen] = useState(false); 
    const [usuarioActual, setUsuarioActual] = useState({
        nombre: 'Usuario',
        apellido: '',
        rol: 'Invitado',
        iniciales: 'US'
    });

    useEffect(() => {
        const nombre = localStorage.getItem('usuarioNombre') || 'Usuario';
        const apellido = localStorage.getItem('usuarioApellido') || '';
        const rol = localStorage.getItem('usuarioRol') || 'Invitado';
        
        const iniciales = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
        setUsuarioActual({ nombre, apellido, rol, iniciales });
    }, []);

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleDesktopToggle = () => setOpen(!open);

    const getTituloPagina = () => {
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

    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);
    const [modalOpen, setModalOpen] = useState(false);

    const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleAbrirConfig = () => { handleMenuClose(); setModalOpen(true); };
    const handleLogout = () => { localStorage.clear(); navigate('/'); };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            
            <AppBar 
                position="fixed" 
                sx={{ 
                    width: { sm: `calc(100% - ${open ? 240 : 65}px)` }, 
                    ml: { sm: `${open ? 240 : 65}px` },
                    backgroundColor: 'white', 
                    color: '#1b5e20',
                    boxShadow: '0px 1px 4px rgba(0,0,0,0.1)',
                    transition: 'width 0.3s, margin 0.3s'
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={() => {
                            if (window.innerWidth < 600) handleDrawerToggle();
                            else handleDesktopToggle();
                        }}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h5" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        {getTituloPagina()}
                    </Typography>

                    {/* --- AQUÍ INSERTAMOS LA CAMPANA --- */}
                    {/* La ponemos justo antes de la sección del usuario */}
                    <NotificationBell />

                    {/* SECCIÓN DE USUARIO */}
                    <Box 
                        sx={{ display: 'flex', alignItems: 'center', textAlign: 'right', cursor: 'pointer' }}
                        onClick={handleMenuClick}
                    >
                        <Box sx={{ marginRight: 2, display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#333' }}>
                                {usuarioActual.nombre} {usuarioActual.apellido}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                {usuarioActual.rol}
                            </Typography>
                        </Box>
                        
                        <Avatar sx={{ bgcolor: '#2e7d32' }}>
                            {usuarioActual.iniciales}
                        </Avatar>
                    </Box>

                    <Menu
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={handleMenuClose}
                        PaperProps={{ elevation: 3, sx: { mt: 1.5 } }}
                    >
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
                open={open} 
                mobileOpen={mobileOpen} 
                handleDrawerToggle={handleDrawerToggle} 
            />

            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    p: 3, 
                    backgroundColor: '#f4f6f8', 
                    minHeight: '100vh',
                    width: { sm: `calc(100% - ${open ? 240 : 65}px)` },
                    transition: 'width 0.3s',
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