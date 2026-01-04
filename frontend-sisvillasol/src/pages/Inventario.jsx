import { useEffect, useState } from 'react';
import { 
    Box, Grid, Paper, Typography, Button, TextField, InputAdornment, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Chip, IconButton, Card, CardContent, GlobalStyles
} from '@mui/material';
import { TablePagination } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'; // Usaremos este icono que ya tienes
import api from '../services/api';
import Swal from 'sweetalert2';
// IMPORTAMOS EL COMPONENTE DEL MODAL 
import NuevoInsumoModal from '../components/NuevoInsumoModal.jsx';

function Inventario() {
    const [insumos, setInsumos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    
    // Estados para la paginación
    const [page, setPage] = useState(0); 
    const [rowsPerPage, setRowsPerPage] = useState(10); 
    
    // Estados del Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [insumoAEditar, setInsumoAEditar] = useState(null);

    // 1. Cargar datos del Backend
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

    const handleEditar = (insumo) => {
        setInsumoAEditar(insumo); // Guardamos los datos de la fila
        setModalOpen(true);       // Abrimos el modal
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
                    Swal.fire('¡Eliminado!', 'El producto ha sido borrado.', 'success');
                    cargarInsumos(); 
                } catch (error) {
                    console.error(error);
                    Swal.fire('Error', 'No se pudo eliminar el producto.', 'error');
                }
            }
        });
    };

    // 2. Cálculos para las Tarjetas de Arriba (KPIs)
    const totalProductos = insumos.length;
    
    // CORREGIDO: Ahora usamos una sola variable "stockBajo" para todo
    const stockBajo = insumos.filter(i => Number(i.cantidad_stock) <= Number(i.stock_minimo));
    const alertasStock = stockBajo.length;
    
    const valorTotal = insumos.reduce((acc, item) => acc + (Number(item.costo_unitario_promedio || 0)), 0);

    // 3. Filtrado para la tabla (Búsqueda)
    const insumosFiltrados = insumos.filter(item => 
        item.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    useEffect(() => { setPage(0); }, [busqueda]);

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
                        <Typography variant="subtitle1">Total de productos</Typography>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Buscar producto..."
                    variant="outlined" size="small"
                    sx={{ width: '300px', bgcolor: 'white' }}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                    }}
                />
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
                            <TableCell sx={{ fontWeight: 'bold' }}>Stock Actual/dosis</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Stock Mínimo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Precio Unit</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {insumosFiltrados
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row) => {
                                const esBajoStock = Number(row.cantidad_stock) <= Number(row.stock_minimo);
                                return (
                                    <TableRow key={row.id_insumo} hover>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{row.nombre}</TableCell>
                                        <TableCell><Chip label={row.nombre_categoria || 'Sin Cat.'} size="small" variant="outlined" /></TableCell>
                                        <TableCell>
                                            <Typography fontWeight="bold" color={esBajoStock ? 'error' : 'inherit'}>
                                                {row.cantidad_stock} {row.nombre_unidad || ''}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{row.stock_minimo}</TableCell>
                                        <TableCell>
                                            <Chip label={esBajoStock ? "BAJO STOCK" : "NORMAL"} color={esBajoStock ? "error" : "success"} size="small" sx={{ fontWeight: 'bold' }} />
                                        </TableCell>
                                        <TableCell>${Number(row.costo_unitario_promedio).toLocaleString('es-CO')}</TableCell>
                                        <TableCell>
                                            <IconButton size="small" color="primary" onClick={() => handleEditar(row)}><EditIcon /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleEliminar(row.id_insumo, row.nombre)}><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
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
                                        
                                        {/* BOTÓN ARREGLADO */}
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