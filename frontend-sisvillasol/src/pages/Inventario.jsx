import { useEffect, useState } from 'react';
import { 
    Box, Grid, Paper, Typography, Button, TextField, InputAdornment, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Chip, IconButton, Card, CardContent, GlobalStyles, Tooltip
} from '@mui/material';
import { TablePagination } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CircleIcon from '@mui/icons-material/Circle';
import api from '../services/api';
import Swal from 'sweetalert2';
import NuevoInsumoModal from '../components/NuevoInsumoModal';

function Inventario() {
    const [insumos, setInsumos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    
    // 1. NUEVO ESTADO PARA CATEGORÍA
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");

    // Estados para la paginación
    const [page, setPage] = useState(0); 
    const [rowsPerPage, setRowsPerPage] = useState(10); 
    
    // Estados del Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [insumoAEditar, setInsumoAEditar] = useState(null);

    // Cargar datos del Backend
    useEffect(() => {
        cargarInsumos();
    }, []);

    const cargarInsumos = async () => {
        try {
            const response = await api.get('/insumos');
            setInsumos(response.data);
        } catch (error) {
            console.error("Error cargando inventario", error);
        }
    };
    // --- 1. FUNCIÓN DE SEMÁFORO TOXICIDAD (OMS) ---
    const getToxicidadInfo = (nivel) => {
        // Normalizamos a mayúsculas por si acaso
        const n = nivel ? nivel.toString() : ""; 
        switch (n) {
            case 'Ia': return { color: '#d32f2f', texto: 'Extremadamente Peligroso (Ia)', bg: '#ffcdd2' }; // Rojo Fuerte
            case 'Ib': return { color: '#c62828', texto: 'Altamente Peligroso (Ib)', bg: '#ef9a9a' }; // Rojo
            case 'II': return { color: '#fbc02d', texto: 'Moderadamente Peligroso (II)', bg: '#fff9c4' }; // Amarillo
            case 'III': return { color: '#1976d2', texto: 'Ligeramente Peligroso (III)', bg: '#bbdefb' }; // Azul
            case 'U':  return { color: '#388e3c', texto: 'Poco probable de Riesgo Agudo (U)', bg: '#c8e6c9' }; // Verde
            default:   return { color: '#9e9e9e', texto: 'No Clasificado (N)', bg: '#f5f5f5' };
        }
    };
// --- 2. FUNCIÓN COLOR DE ESTADO (Backend) ---
    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'NORMAL': return 'success';
            case 'BAJO STOCK': return 'warning'; // Amarillo/Naranja
            case 'FUERA DE MERCADO': return 'error'; // Rojo (Descontinuado)
            default: return 'default';
        }
    };
    const handleEditar = (insumo) => {
        setInsumoAEditar(insumo); 
        setModalOpen(true);       
    };

    const handleEliminar = async (id, nombre) => {
        Swal.fire({
            title: '¿Eliminar producto?',
            text: `Vas a borrar "${nombre}" del inventario. Esto no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f', 
            cancelButtonColor: '#1b5e20',  
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/insumos/${id}`);
                    Swal.fire('¡Eliminado!', 'El Insumo ha sido borrado.', 'success');
                    cargarInsumos(); 
                } catch (error) {
                    console.error(error);
                    Swal.fire('Error', 'No se pudo eliminar el Insumo.', 'error');
                }
            }
        });
    };

    // Cálculos para las Tarjetas de Arriba (KPIs)
    const totalProductos = insumos.length;
    const stockBajo = insumos.filter(i => i.estado_insumo === 'BAJO STOCK');
    const alertasStock = stockBajo.length;
    const valorTotal = insumos.reduce((acc, item) => acc + (Number(item.costo_unitario_promedio || 0)), 0);
    // 2. EXTRAER CATEGORÍAS ÚNICAS (Para llenar el select)
    const categoriasUnicas = [...new Set(insumos.map(item => item.nombre_categoria).filter(Boolean))];

    // 3. FILTRADO ACTUALIZADO (Búsqueda + Categoría)
    const insumosFiltrados = insumos.filter(item => {
        const coincideBusqueda = item.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const coincideCategoria = categoriaSeleccionada 
            ? item.nombre_categoria === categoriaSeleccionada 
            : true;
        
        return coincideBusqueda && coincideCategoria;
    });

    useEffect(() => { setPage(0); }, [busqueda, categoriaSeleccionada]);

    const handleChangePage = (event, newPage) => { setPage(newPage); };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box>
            <GlobalStyles styles={{ 
                '.swal2-container': { zIndex: '2400 !important' } 
            }} />
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1b5e20' }}>
                Inventario de Insumos
            </Typography>

            {/* SECCIÓN 1: TARJETAS DE RESUMEN (KPIs) */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e9', color: '#1b5e20' }}>
                        <Typography variant="subtitle1">Total de Insumos</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{totalProductos}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#ffebee', color: '#c62828' }}>
                        <Typography variant="subtitle1">Alertas de Stock</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{alertasStock}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e3f2fd', color: '#0d47a1' }}>
                        <Typography variant="subtitle1">Valor Total de Inventario</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                            ${valorTotal.toLocaleString('es-CO')}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* SECCIÓN 2: BARRA DE HERRAMIENTAS */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                
                {/* GRUPO DE FILTROS: SELECT + BUSCADOR */}
                <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                    {/* 4. SELECTOR DE CATEGORÍA (HTML Nativo) */}
                    <select
                        value={categoriaSeleccionada}
                        onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                        style={{
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #c4c4c4',
                            backgroundColor: 'white',
                            fontSize: '16px',
                            minWidth: '150px',
                            height: '40px' // Misma altura visual que el TextField small
                        }}
                    >
                        <option value="">Todas las Categorías</option>
                        {categoriasUnicas.map((cat, index) => (
                            <option key={index} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>

                    <TextField
                        placeholder="Buscar Insumo..."
                        variant="outlined" size="small"
                        sx={{ width: '300px', bgcolor: 'white' }}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        InputProps={{
                            startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                        }}
                    />
                </Box>

                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    sx={{ bgcolor: '#1b5e20', '&:hover': { bgcolor: '#2e7d32' } }}
                    onClick={() => { setInsumoAEditar(null); setModalOpen(true); }}
                >
                    AGREGAR INSUMO
                </Button>
            </Box>

            {/* SECCIÓN 3: TABLA */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Insumo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Toxicidad (OMS)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Stock Actual/dosis</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Precio Unit</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                       {insumosFiltrados.length > 0 ? (
                            insumosFiltrados
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row) => {
                                    // Obtenemos info del semáforo para esta fila
                                    const toxicidad = getToxicidadInfo(row.nivel_toxicidad);
                                    return (
                                        <TableRow key={row.id_insumo} hover>
                                            <TableCell 
                                                sx={{ 
                                                    fontWeight: 'bold',
                                                    whiteSpace: 'normal',   
                                                    wordBreak: 'break-word', 
                                                    maxWidth: '250px'       
                                                }}
                                            >
                                                {row.nombre}
                                            </TableCell>
                                            <TableCell><Chip label={row.nombre_categoria || 'Sin Cat.'} size="small" variant="outlined" /></TableCell>
                                            <TableCell>
                                                <Tooltip title={toxicidad.texto} arrow>
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: 1, 
                                                        bgcolor: toxicidad.bg, 
                                                        px: 1, py: 0.5,
                                                        borderRadius: 4,
                                                        width: 'fit-content',
                                                        border: `1px solid ${toxicidad.color}40`
                                                    }}>
                                                        <CircleIcon sx={{ color: toxicidad.color, fontSize: 14 }} />
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#333' }}>
                                                            {row.nivel_toxicidad || "N/A"}
                                                        </Typography>
                                                    </Box>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontWeight="bold">
                                                    {row.cantidad_stock} {row.nombre_unidad || ''}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Mín: {row.stock_minimo}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={row.estado_insumo || "NORMAL"} 
                                                    color={getEstadoColor(row.estado_insumo)} 
                                                    size="small" 
                                                    sx={{ fontWeight: 'bold' }} 
                                                />
                                            </TableCell>
                                            <TableCell>${Number(row.costo_unitario_promedio).toLocaleString('es-CO')}</TableCell>
                                            <TableCell>
                                                <IconButton size="small" color="primary" onClick={() => handleEditar(row)}><EditIcon /></IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleEliminar(row.id_insumo, row.nombre)}><DeleteIcon /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body1" color="textSecondary">
                                        No se encontraron resultados para la búsqueda.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]} component="div"
                count={insumosFiltrados.length} rowsPerPage={rowsPerPage} page={page}
                onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}
            />

           {/* Alertas Stock Bajo */}
            {stockBajo.length > 0 && (
                <Box sx={{ mt: 4, mb: 4 }}>
                    <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}><WarningIcon sx={{ mr: 1 }} /> Atención: Insumos por Agotarse</Typography>
                    <Grid container spacing={2}>
                        {stockBajo.map((insumo) => (
                            <Grid item xs={12} sm={6} md={3} key={insumo.id_insumo}>
                                <Card sx={{ bgcolor: '#ffebee', borderLeft: '6px solid #d32f2f', boxShadow: 2 }}>
                                    <CardContent>
                                        <Typography variant="caption" fontWeight="bold" color="error">STOCK BAJO</Typography>
                                        <Typography variant="h6" fontWeight="bold">{insumo.nombre}</Typography>
                                        <Typography variant="body2" sx={{ mb: 2 }}>Stock: <b>{insumo.cantidad_stock} {insumo.nombre_unidad}</b></Typography>
                                        
                                        <Button 
                                            variant="outlined" color="error" size="small" fullWidth startIcon={<ShoppingCartIcon />}
                                            onClick={() => {
                                                console.log("Abriendo modal COMPRA para:", insumo.nombre);
                                                setInsumoAEditar(insumo);
                                                setModalOpen(true);
                                            }}
                                        >
                                            SOLICITAR COMPRA
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* MODAL EXTERNO CONECTADO */}
            <NuevoInsumoModal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)}
                onSuccess={cargarInsumos} 
                productoEditar={insumoAEditar} 
            />
        </Box>
    );
}

export default Inventario;