import { useEffect, useState } from 'react'; // <--- ESTO FALTABA
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Box, MenuItem, InputAdornment, IconButton, Typography, 
    FormControlLabel, Switch, Divider 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CircleIcon from '@mui/icons-material/Circle'; 
import CalculateIcon from '@mui/icons-material/Calculate';
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
        nivel_toxicidad: 'U' // Valor por defecto (Verde/Sin riesgo)
    });

    // Estado para saber si debemos mostrar/habilitar el campo toxicidad
    const [requiereToxicidad, setRequiereToxicidad] = useState(false);

    // --- ESTADOS PARA LA CALCULADORA ---
    const [usarCalculadora, setUsarCalculadora] = useState(false);
    const [calc, setCalc] = useState({
        precio_empaque: '', // Ej: 36000
        contenido_empaque: '' // Ej: 500
    });

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

    // 2. CARGAR DATOS SI ESTAMOS EDITANDO
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
            // Validamos si requiere toxicidad al cargar
            verificarCategoria(productoEditar.id_categoria_insumo, listas.categorias);
            setUsarCalculadora(false); // Al editar, desactivamos calculadora
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
            setUsarCalculadora(true); // Al crear nuevo, activamos calculadora
            setCalc({ precio_empaque: '', contenido_empaque: '' });
        }
    }, [productoEditar, open, listas.categorias]);

    // 3. --- MAGIA MATEMÁTICA 🧠 (SEPARADO, NO ANIDADO) ---
    useEffect(() => {
        if (usarCalculadora && calc.precio_empaque && calc.contenido_empaque) {
            const precio = parseFloat(calc.precio_empaque);
            const contenido = parseFloat(calc.contenido_empaque);
            
            if (contenido > 0) {
                const costoUnitario = precio / contenido;
                // Guardamos el resultado con 2 decimales
                setDatos(prev => ({ ...prev, costo_unitario_promedio: costoUnitario.toFixed(2) }));
            }
        }
    }, [calc, usarCalculadora]);

    // --- FUNCIÓN INTELIGENTE: Verificar Categoría ---
    const verificarCategoria = (idCat, categoriasDisponibles) => {
        const catSeleccionada = categoriasDisponibles.find(c => c.id_categoria === idCat);
        
        if (catSeleccionada) {
            const nombre = catSeleccionada.nombre_categoria.toLowerCase();
            // Si es agroquímico peligroso
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
        // Actualizamos el dato
        setDatos({ ...datos, id_categoria_insumo: nuevoId });
        // Verificamos si activamos la toxicidad
        verificarCategoria(nuevoId, listas.categorias);
    };

    const handleGuardar = async () => {
        // VALIDACIÓN BÁSICA
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
                Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1500, showConfirmButton: false });
            } else {
                // CREAR
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

    // OPCIONES DE TOXICIDAD CON COLORES
    const opcionesToxicidad = [
        { value: 'Ia', label: 'Ia - Extremadamente Tóxico', color: '#d32f2f' }, // Rojo Fuerte
        { value: 'Ib', label: 'Ib - Altamente Tóxico', color: '#c62828' },      // Rojo
        { value: 'II', label: 'II - Moderadamente Tóxico', color: '#fbc02d' },  // Amarillo
        { value: 'III', label: 'III - Ligeramente Tóxico', color: '#1976d2' },  // Azul
        { value: 'U', label: 'U - No Tóxico / Otro', color: '#388e3c' }         // Verde
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
                        {/* CATEGORÍA */}
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
                            select fullWidth label="Unidad de Medida (Mínima)" 
                            value={datos.id_unidad} onChange={(e) => setDatos({...datos, id_unidad: e.target.value})}
                            helperText="Ej: Gramos o Mililitros"
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
                    </Box>

                    <Divider textAlign="left"><Typography variant="caption" color="textSecondary">COSTOS</Typography></Divider>

                    {/* --- CALCULADORA DE PRECIO INTELIGENTE --- */}
                    <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2 }}>
                        <FormControlLabel 
                            control={<Switch checked={usarCalculadora} onChange={(e) => setUsarCalculadora(e.target.checked)} color="success" />} 
                            label={<Typography variant="body2" fontWeight="bold">Calcular costo desde el Empaque/Frasco</Typography>}
                        />
                        
                        {usarCalculadora ? (
                            <Box sx={{ display: 'flex', gap: 2, mt: 1, alignItems: 'center' }}>
                                <TextField 
                                    fullWidth label="Precio del Frasco" type="number" size="small"
                                    value={calc.precio_empaque} 
                                    onChange={(e) => setCalc({...calc, precio_empaque: e.target.value})} 
                                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} 
                                    placeholder="Ej: 36000"
                                />
                                <Typography variant="h6" color="textSecondary">/</Typography>
                                <TextField 
                                    fullWidth label="Contenido (g/ml)" type="number" size="small"
                                    value={calc.contenido_empaque} 
                                    onChange={(e) => setCalc({...calc, contenido_empaque: e.target.value})} 
                                    placeholder="Ej: 500"
                                />
                                <Typography variant="h6" color="textSecondary">=</Typography>
                                <Box sx={{ minWidth: 120, textAlign: 'center', bgcolor: '#e8f5e9', p: 1, borderRadius: 1, border: '1px solid #2e7d32' }}>
                                    <Typography variant="caption" display="block" color="success.main">Costo x Gramo</Typography>
                                    <Typography variant="h6" fontWeight="bold" color="success.main">
                                        ${datos.costo_unitario_promedio || '0'}
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <TextField 
                                fullWidth label="Costo Unitario (Manual)" type="number" 
                                value={datos.costo_unitario_promedio} 
                                onChange={(e) => setDatos({...datos, costo_unitario_promedio: e.target.value})} 
                                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} 
                                helperText="Precio de 1 solo gramo/ml"
                            />
                        )}
                    </Box>

                    {/* REUBICAMOS EL STOCK MÍNIMO AQUÍ ABAJO JUNTO A LA TOXICIDAD */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField 
                            fullWidth label="Stock Mínimo (Alerta)" type="number" 
                            value={datos.stock_minimo} onChange={(e) => setDatos({...datos, stock_minimo: e.target.value})} 
                        />
                        <TextField 
                            select fullWidth label="Toxicidad" 
                            value={datos.nivel_toxicidad} 
                            onChange={(e) => setDatos({...datos, nivel_toxicidad: e.target.value})}
                            disabled={!requiereToxicidad}
                        >
                            {opcionesToxicidad.map((op) => (
                                <MenuItem key={op.value} value={op.value} sx={{ display: 'flex', gap: 1 }}>
                                    <CircleIcon sx={{ color: op.color, fontSize: 16 }} /> {op.label}
                                </MenuItem>
                            ))}
                        </TextField>
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