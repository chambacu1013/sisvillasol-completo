import { useEffect, useState } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Box, MenuItem, InputAdornment, IconButton, Typography, Circle
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
        nivel_toxicidad: 'N'
    });
    // Estado para saber si debemos mostrar/habilitar el campo toxicidad
    const [requiereToxicidad, setRequiereToxicidad] = useState(false);
    // 1. CARGAR LISTAS (¡AQUÍ ESTABA EL ERROR!) 🚨
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
                nivel_toxicidad: productoEditar.nivel_toxicidad || 'N'
            });
            // Validamos si requiere toxicidad al cargar
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
                nivel_toxicidad: 'N'
            });
            setRequiereToxicidad(false);
        }
    }, [productoEditar, open, listas.categorias]);
    const verificarCategoria = (idCat, categoriasDisponibles) => {
        const catSeleccionada = categoriasDisponibles.find(c => c.id_categoria === idCat);
        
        if (catSeleccionada) {
            const nombre = catSeleccionada.nombre_categoria.toLowerCase();
            // Si es agroquímico peligroso
            if (nombre.includes('Fungicida') || nombre.includes('Insecticida') || nombre.includes('Herbicida')) {
                setRequiereToxicidad(true);
            } else {
                setRequiereToxicidad(false);
                // Si NO es peligroso, forzamos a 'N' (Sin Riesgo Agudo)
                setDatos(prev => ({ ...prev, nivel_toxicidad: 'N' }));
            }
        }
    };
    const handleChangeCategoria = (e) => {
        const nuevoId = e.target.value;
        // Actualizamos el dato
        setDatos({ ...datos, id_categoria_insumo: nuevoId });
        // Verificamos si activamos la toxicidad
        verificarCategoria(nuevoId, listas.categorias);
    };
    const handleGuardar = async () => {
        // VALIDACIÓN
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
            Swal.fire({
                icon: 'error',
                title: 'Ups...',
                text: 'Hubo un error al guardar. Verifica la conexión.',
                confirmButtonColor: '#d32f2f'
            });
        }
    };
    // OPCIONES DE TOXICIDAD CON COLORES
    const opcionesToxicidad = [
        { value: 'Ia', label: 'Ia - Extremadamente Peligroso', color: '#d32f2f' }, // Rojo Fuerte
        { value: 'Ib', label: 'Ib - Altamente Peligroso', color: '#c62828' },      // Rojo
        { value: 'II', label: 'II - Moderadamente Peligroso', color: '#fbc02d' },  // Amarillo
        { value: 'III', label: 'III - Ligeramente Peligroso', color: '#1976d2' },  // Azul
        { value: 'U', label: 'U - No Peligroso', color: '#388e3c' },         // Verde
        { value: 'N', label: 'N - No Clasificado', color: '#ffffff' }  //blanco
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
                        placeholder="Ej: Daconil 500 SC"
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* CATEGORÍA (Con lógica de activación) */}
                        <TextField 
                            select fullWidth label="Categoría" 
                            value={datos.id_categoria_insumo} 
                            onChange={handleChangeCategoria} // <--- Usamos el handler personalizado
                        >
                            {listas.categorias.map((c) => (
                                <MenuItem key={c.id_categoria} value={c.id_categoria}>
                                    {c.nombre_categoria}
                                </MenuItem>
                            ))}
                        </TextField>

                        {/* SELECTOR DE TOXICIDAD (Se bloquea o desbloquea) */}
                        <TextField 
                            select fullWidth label="Nivel de Toxicidad (OMS)" 
                            value={datos.nivel_toxicidad} 
                            onChange={(e) => setDatos({...datos, nivel_toxicidad: e.target.value})}
                            disabled={!requiereToxicidad} // <--- SE DESACTIVA SI NO ES PELIGROSO
                            helperText={!requiereToxicidad ? "Automático: Sin Riesgo (N)" : "Requerido para agroquímicos"}
                        >
                            {opcionesToxicidad.map((op) => (
                                <MenuItem key={op.value} value={op.value} sx={{ display: 'flex', gap: 1 }}>
                                    <CircleIcon sx={{ color: op.color, fontSize: 16 }} />
                                    {op.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField 
                            fullWidth label="Cantidad en Stock" type="number" 
                            value={datos.cantidad_stock} onChange={(e) => setDatos({...datos, cantidad_stock: e.target.value})} 
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
                            fullWidth label="Cantidad en Stock" type="number" 
                            value={datos.cantidad_stock} onChange={(e) => setDatos({...datos, cantidad_stock: e.target.value})} 
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
                            fullWidth label="Costo Promedio" type="number" 
                            value={datos.costo_unitario_promedio} onChange={(e) => setDatos({...datos, costo_unitario_promedio: e.target.value})} 
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} 
                        />
                        <TextField 
                            fullWidth label="Stock Mínimo (Alerta)" type="number" 
                            value={datos.stock_minimo} onChange={(e) => setDatos({...datos, stock_minimo: e.target.value})} 
                            helperText="Si pones 0, se marcará como 'FUERA DE MERCADO'"
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