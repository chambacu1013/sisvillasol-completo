import { useEffect, useState } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Box, MenuItem, InputAdornment, IconButton 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CircleIcon from '@mui/icons-material/Circle'; 
import api from '../services/api';
import Swal from 'sweetalert2';

const NuevoInsumoModal = ({ open, onClose, productoEditar, onSuccess }) => {
    
    // Listas dinámicas desde BD
    const [listas, setListas] = useState({ categorias: [], unidades: [] });

    // Estado del formulario
    const [datos, setDatos] = useState({
        nombre: '',
        cantidad_stock: '',
        id_unidad: '',
        id_categoria_insumo: '',
        costo_unitario_promedio: '',
        stock_minimo: 0.5,
        nivel_toxicidad: 'U'
    });

    // Estado para saber si debemos mostrar/habilitar el campo toxicidad
    const [requiereToxicidad, setRequiereToxicidad] = useState(false);

    // 1. CARGAR LISTAS
    useEffect(() => {
        const cargarListas = async () => {
            try {
                const res = await api.get('/insumos/datos-formulario');
                setListas(res.data);
            } catch (error) { 
                console.error("Error cargando listas:", error); 
            }
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
                stock_minimo: productoEditar.stock_minimo || 0.5,
                nivel_toxicidad: productoEditar.nivel_toxicidad || 'U'
            });
            verificarCategoria(productoEditar.id_categoria_insumo, listas.categorias);
        } else {
            // Limpiar si es nuevo
            setDatos({
                nombre: '',
                cantidad_stock: '',
                id_unidad: '',
                id_categoria_insumo: '',
                costo_unitario_promedio: '',
                stock_minimo: 0.5,
                nivel_toxicidad: 'U'
            });
            setRequiereToxicidad(false);
        }
    }, [productoEditar, open, listas.categorias]);

    // --- Verificar Categoría (Para activar Toxicidad) ---
    const verificarCategoria = (idCat, categoriasDisponibles) => {
        if (!categoriasDisponibles) return;
        const catSeleccionada = categoriasDisponibles.find(c => c.id_categoria === idCat);
        
        if (catSeleccionada) {
            const nombre = catSeleccionada.nombre_categoria.toLowerCase();
            if (['fungicida', 'insecticida', 'herbicida', 'fertilizante'].some(t => nombre.includes(t))) {
                setRequiereToxicidad(true);
            } else {
                setRequiereToxicidad(false);
                setDatos(prev => ({ ...prev, nivel_toxicidad: 'U' }));
            }
        }
    };

    const handleChangeCategoria = (e) => {
        const nuevoId = e.target.value;
        setDatos({ ...datos, id_categoria_insumo: nuevoId });
        verificarCategoria(nuevoId, listas.categorias);
    };

    const handleGuardar = async () => {
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
            // Validamos que los números sean positivos
            if (parseFloat(datos.costo_unitario_promedio) < 0 || parseFloat(datos.cantidad_stock) < 0) {
                Swal.fire('Error', 'Los valores no pueden ser negativos', 'error');
                return;
            }

            if (productoEditar) {
                await api.put(`/insumos/${productoEditar.id_insumo}`, datos);
                Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1500, showConfirmButton: false });
            } else {
                await api.post('/insumos', datos);
                Swal.fire({ icon: 'success', title: 'Registrado', timer: 1500, showConfirmButton: false });
            }
            onSuccess();
            onClose();
        } catch (error) { 
            console.error(error); 
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar.', confirmButtonColor: '#d32f2f' });
        }
    };

    const opcionesToxicidad = [
        { value: 'Ia', label: 'Ia - Extremadamente Tóxico', color: '#d32f2f' },
        { value: 'Ib', label: 'Ib - Altamente Tóxico', color: '#c62828' },
        { value: 'II', label: 'II - Moderadamente Tóxico', color: '#fbc02d' },
        { value: 'III', label: 'III - Ligeramente Tóxico', color: '#1976d2' },
        { value: 'U', label: 'U - No Tóxico / Otro', color: '#388e3c' }
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#1b5e20', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {productoEditar ? 'Editar Producto' : 'Nuevo Insumo'}
                <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                    
                    <TextField 
                        fullWidth label="Nombre del Producto" 
                        value={datos.nombre} onChange={(e) => setDatos({...datos, nombre: e.target.value})} 
                        placeholder="Ej: Fertilizante Triple 15"
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField 
                            select fullWidth label="Categoría" 
                            value={datos.id_categoria_insumo} 
                            onChange={handleChangeCategoria} 
                        >
                            {listas.categorias.map((c) => (
                                <MenuItem key={c.id_categoria} value={c.id_categoria}>
                                    {c.nombre_categoria}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField 
                            select fullWidth label="Toxicidad (OMS)" 
                            value={datos.nivel_toxicidad} 
                            onChange={(e) => setDatos({...datos, nivel_toxicidad: e.target.value})}
                            disabled={!requiereToxicidad}
                            helperText={!requiereToxicidad ? "Automático: Sin Riesgo (U)" : "Requerido para agroquímicos"}
                        >
                            {opcionesToxicidad.map((op) => (
                                <MenuItem key={op.value} value={op.value} sx={{ display: 'flex', gap: 1 }}>
                                    <CircleIcon sx={{ color: op.color, fontSize: 16 }} /> {op.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField 
                            fullWidth label="Cantidad en Stock (Total)" type="number" 
                            value={datos.cantidad_stock} onChange={(e) => setDatos({...datos, cantidad_stock: e.target.value})} 
                            placeholder="Ej: 500"
                        />
                        <TextField 
                            select fullWidth label="Unidad de Medida" 
                            value={datos.id_unidad} onChange={(e) => setDatos({...datos, id_unidad: e.target.value})}
                        >
                            {listas.unidades.map((u) => (
                                <MenuItem key={u.id_unidad} value={u.id_unidad}>
                                    {u.nombre_unidad}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField 
                            fullWidth label="Costo Unitario Promedio" type="number" 
                            value={datos.costo_unitario_promedio} onChange={(e) => setDatos({...datos, costo_unitario_promedio: e.target.value})} 
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} 
                            //helperText="OJO: Ingrese el costo por gramo/ml, NO por frasco entero."
                        />
                        <TextField 
                            fullWidth label="Stock Mínimo (Alerta)" type="number" 
                            value={datos.stock_minimo} onChange={(e) => setDatos({...datos, stock_minimo: e.target.value})} 
                        />
                    </Box>
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