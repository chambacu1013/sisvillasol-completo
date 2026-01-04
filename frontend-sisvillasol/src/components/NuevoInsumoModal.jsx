import { useEffect, useState } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Box, MenuItem, InputAdornment, IconButton 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../services/api';
import Swal from 'sweetalert2';
const NuevoInsumoModal = ({ open, onClose, productoEditar, onSuccess }) => {
    
    // Listas dinámicas desde BD
    const [listas, setListas] = useState({ categorias: [], unidades: [] });

    // Estado del formulario
    const [datos, setDatos] = useState({
        nombre: '',
        cantidad_stock: '',
        id_unidad: '',           // Ahora usamos ID
        id_categoria_insumo: '', // Ahora usamos ID
        costo_unitario_promedio: '',
        stock_minimo: 5
    });

    // 1. Cargar las listas (Categorías y Unidades) al abrir
    useEffect(() => {
        const cargarListas = async () => {
            try {
                const res = await api.get('/listas-insumos');
                setListas(res.data);
            } catch (error) { console.error("Error cargando listas:", error); }
        };
        if (open) cargarListas();
    }, [open]);

    // 2. Cargar datos si estamos editando
    useEffect(() => {
        if (productoEditar) {
            setDatos({
                nombre: productoEditar.nombre || '',
                cantidad_stock: productoEditar.cantidad_stock || '',
                id_unidad: productoEditar.id_unidad || '',
                id_categoria_insumo: productoEditar.id_categoria_insumo || '',
                costo_unitario_promedio: productoEditar.costo_unitario_promedio || '',
                stock_minimo: productoEditar.stock_minimo || 5
            });
        } else {
            setDatos({ nombre: '', cantidad_stock: '', id_unidad: '', id_categoria_insumo: '', costo_unitario_promedio: '', stock_minimo: 5 });
        }
    }, [productoEditar, open]);

    const handleGuardar = async () => {
        // 1. VALIDACIÓN (Alerta Amarilla)
        if (!datos.id_unidad || !datos.id_categoria_insumo || !datos.nombre) {
            Swal.fire({
                icon: 'warning',
                title: 'Faltan datos',
                text: 'Por favor completa el nombre, categoría y unidad.',
                confirmButtonColor: '#ff9800'
            });
            return;
        }

        try {
            if (productoEditar) {
                // EDITAR
                await api.put(`/insumos/${productoEditar.id_insumo}`, datos);
                
                // 2. ÉXITO AL EDITAR
                Swal.fire({
                    icon: 'success',
                    title: '¡Actualizado!',
                    text: 'El producto se modificó correctamente 📝',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                // CREAR
                await api.post('/insumos', datos);
                
                // 3. ÉXITO AL CREAR
                Swal.fire({
                    icon: 'success',
                    title: '¡Registrado!',
                    text: 'Nuevo insumo agregado a bodega 📦',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            
            // Cerrar y recargar
            onSuccess();
            onClose();
            
        } catch (error) { 
            console.error(error); 
            // 4. ERROR (Alerta Roja)
            Swal.fire({
                icon: 'error',
                title: 'Ups...',
                text: 'Hubo un error al guardar. Intenta nuevamente.',
                confirmButtonColor: '#d32f2f'
            });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#1b5e20', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {productoEditar ? 'Editar Producto' : 'Nuevo Insumo'}
                <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
            </DialogTitle>
            
            <DialogContent>
                {/* DISEÑO VERTICAL RÍGIDO */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                    
                    <TextField 
                        fullWidth label="Nombre del Producto" 
                        value={datos.nombre} onChange={(e) => setDatos({...datos, nombre: e.target.value})} 
                        placeholder="Ej: Fertilizante Triple 15"
                    />

                    {/* FILA: CANTIDAD y UNIDAD (Dinámico) */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField 
                            fullWidth label="Cantidad en Stock" type="number" 
                            value={datos.cantidad_stock} onChange={(e) => setDatos({...datos, cantidad_stock: e.target.value})} 
                        />
                        <TextField 
                            select fullWidth label="Unidad de Medida" 
                            value={datos.id_unidad} onChange={(e) => setDatos({...datos, id_unidad: e.target.value})}
                        >
                            {/* Mapeamos la lista de la BD */}
                            {listas.unidades.map((u) => (
                                <MenuItem key={u.id_unidad} value={u.id_unidad}>
                                    {u.nombre_unidad}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    {/* FILA: CATEGORÍA (Dinámico) y COSTO */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField 
                            select fullWidth label="Categoría" 
                            value={datos.id_categoria_insumo} onChange={(e) => setDatos({...datos, id_categoria_insumo: e.target.value})}
                        >
                            {/* Mapeamos la lista de la BD */}
                            {listas.categorias.map((c) => (
                                <MenuItem key={c.id_categoria} value={c.id_categoria}>
                                    {c.nombre_categoria}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField 
                            fullWidth label="Costo Promedio" type="number" 
                            value={datos.costo_unitario_promedio} onChange={(e) => setDatos({...datos, costo_unitario_promedio: e.target.value})} 
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} 
                        />
                    </Box>

                    <TextField 
                        fullWidth label="Stock Mínimo (Alerta)" type="number" 
                        value={datos.stock_minimo} onChange={(e) => setDatos({...datos, stock_minimo: e.target.value})} 
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} color="error" variant="outlined">Cancelar</Button>
                <Button variant="contained" onClick={handleGuardar} sx={{ bgcolor: '#1b5e20' }}>
                    {productoEditar ? 'Actualizar' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NuevoInsumoModal;