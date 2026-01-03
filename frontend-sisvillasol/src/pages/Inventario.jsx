import { useEffect, useState } from 'react';
import { 
    Box, Grid, Paper, Typography, Button, TextField, InputAdornment, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Chip, IconButton, Card, CardContent 
} from '@mui/material';
import { TablePagination } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import api from '../services/api';
import Swal from 'sweetalert2';
// IMPORTAMOS EL COMPONENTE DEL MODAL (Asegúrate de que la ruta sea correcta)
import NuevoInsumoModal from '../components/NuevoInsumoModal';

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
    // 1. PRIMER ALERTA: Confirmación
        Swal.fire({
            title: '¿Eliminar producto?',
            text: `Vas a borrar "${nombre}" del inventario. Esto no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f', // Rojo para peligro
            cancelButtonColor: '#1b5e20',  // Verde para cancelar
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // 2. SI DIJO QUE SÍ: Llamamos a la API
                    await api.delete(`/insumos/${id}`);
                    
                    // 3. ÉXITO: Alerta verde
                    Swal.fire(
                        '¡Eliminado!',
                        'El producto ha sido borrado.',
                        'success'
                    );
                    cargarInsumos(); // Recargamos la tabla
                } catch (error) {
                    console.error(error);
                    // 4. ERROR: Alerta roja
                    Swal.fire(
                        'Error',
                        'No se pudo eliminar el producto. Puede que ya tenga movimientos asociados.',
                        'error'
                    );
                }
            }
        });
    };

    // 2. Cálculos para las Tarjetas de Arriba (KPIs)
    const totalProductos = insumos.length;
    
    // Filtrar productos con bajo stock (convertimos a número por seguridad)
    const productosBajoStock = insumos.filter(i => Number(i.cantidad_stock) <= Number(i.stock_minimo));
    const alertasStock = productosBajoStock.length;
    
    // Calculamos el valor total del inventario
    const valorTotal = insumos.reduce((acc, item) => acc + (Number(item.costo_unitario_promedio || 0)), 0);
    //const valorTotal = insumos.reduce((acc, item) => acc + (Number(item.cantidad_stock) * Number(item.costo_unitario_promedio || 0)), 0);

    // 3. Filtrado para la tabla (Búsqueda)
    const insumosFiltrados = insumos.filter(item => 
        item.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    // Si cambio la búsqueda, regreso a la primera página
    useEffect(() => {
        setPage(0);
    }, [busqueda]);

    // Paginación
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1b5e20' }}>
                Inventario de Insumos
            </Typography>

            {/* SECCIÓN 1: TARJETAS DE RESUMEN (KPIs) */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Total Productos */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e9', color: '#1b5e20' }}>
                        <Typography variant="subtitle1">Total de productos</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{totalProductos}</Typography>
                    </Paper>
                </Grid>
                {/* Alertas de Stock */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#ffebee', color: '#c62828' }}>
                        <Typography variant="subtitle1">Alertas de Stock</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{alertasStock}</Typography>
                    </Paper>
                </Grid>
                {/* Valor Total */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e3f2fd', color: '#0d47a1' }}>
                        <Typography variant="subtitle1">Valor Total de Inventario</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                            ${valorTotal.toLocaleString('es-CO')}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* SECCIÓN 2: BARRA DE HERRAMIENTAS (Buscar y Agregar) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Buscar producto..."
                    variant="outlined"
                    size="small"
                    sx={{ width: '300px', bgcolor: 'white' }}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
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
                                        {/* Usamos los nombres traídos por el JOIN */}
                                        <TableCell>
                                            <Chip label={row.nombre_categoria || 'Sin Cat.'} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontWeight="bold" color={esBajoStock ? 'error' : 'inherit'}>
                                                {row.cantidad_stock} {row.nombre_unidad || ''}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{row.stock_minimo}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={esBajoStock ? "BAJO STOCK" : "NORMAL"} 
                                                color={esBajoStock ? "error" : "success"}
                                                size="small"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        </TableCell>
                                        <TableCell>${Number(row.costo_unitario_promedio).toLocaleString('es-CO')}</TableCell>
                                        <TableCell>
                                            <IconButton size="small" color="primary" onClick={() => handleEditar(row)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                color="error" 
                                                onClick={() => handleEliminar(row.id_insumo, row.nombre)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        {insumosFiltrados.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    No hay insumos registrados. ¡Agrega el primero!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]} 
                component="div"
                count={insumosFiltrados.length} 
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:" 
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />

            {/* SECCIÓN 4: ALERTAS INFERIORES (Stock Bajo) */}
            {productosBajoStock.length > 0 && (
                <Box sx={{ mt: 5 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', color: '#d32f2f' }}>
                        <WarningIcon sx={{ mr: 1 }} /> Atención: Insumos por Agotarse
                    </Typography>
                    <Grid container spacing={2}>
                        {productosBajoStock.map((item) => (
                            <Grid item xs={12} sm={6} md={3} key={item.id_insumo}>
                                <Card sx={{ borderLeft: '5px solid #d32f2f', bgcolor: '#ffebee' }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="error" fontWeight="bold">
                                            STOCK BAJO
                                        </Typography>
                                        <Typography variant="h6" sx={{ my: 1 }}>
                                            {item.nombre.toUpperCase()}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Tienes: <strong>{item.cantidad_stock} {item.nombre_unidad}</strong> (Mín: {item.stock_minimo})
                                        </Typography>
                                        <Button 
                                            variant="outlined" color="error" size="small" fullWidth 
                                            sx={{ mt: 2, bgcolor: 'white' }}
                                            startIcon={<ShoppingCartIcon />}
                                        >
                                            Solicitar Compra
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
                // OJO: En tu componente modal pusiste "onSuccess", no "alGuardar".
                // Debemos usar el mismo nombre que definimos en el componente hijo.
                onSuccess={cargarInsumos} 
                
                // Mapeo importante: En el componente modal esperamos "productoEditar",
                // pero aquí en la página se llama "insumoAEditar". Lo pasamos así:
                productoEditar={insumoAEditar} 
            />
        </Box>
    );
}

export default Inventario;