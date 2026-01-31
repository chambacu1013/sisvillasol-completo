import { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Box, MenuItem, InputAdornment, IconButton 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../services/api';
import Swal from 'sweetalert2';

const NuevaVentaModal = ({ open, onClose, ventaEditar, onSuccess, listaLotes }) => {
    
    // Estado local del formulario
    const [datos, setDatos] = useState({
        fecha_venta: new Date().toLocaleDateString('en-CA'),
        id_lote: '', 
        cliente: '', 
        kilos_vendidos: '', 
        precio_unitario: '', // <--- NUEVO CAMPO
        precio_total: ''
    });

    // Cargar datos si estamos editando
    useEffect(() => {
        if (ventaEditar) {
            // Calculamos el unitario inverso (Total / Kilos) para mostrarlo
            const kilos = parseFloat(ventaEditar.kilos_vendidos) || 0;
            const total = parseFloat(ventaEditar.precio_total) || 0;
            const unitarioCalculado = kilos > 0 ? (total / kilos) : 0;

            setDatos({
                fecha_venta: new Date(ventaEditar.fecha_venta).toISOString().split('T')[0],
                id_lote: ventaEditar.id_lote,
                cliente: ventaEditar.cliente || '',
                kilos_vendidos: ventaEditar.kilos_vendidos,
                precio_unitario: unitarioCalculado, // Mostramos el cálculo
                precio_total: ventaEditar.precio_total
            });
        } else {
            // Limpiar formulario si es nuevo
            setDatos({
                fecha_venta: new Date().toLocaleDateString('en-CA'),
                id_lote: '', 
                cliente: '', 
                kilos_vendidos: '', 
                precio_unitario: '',
                precio_total: ''
            });
        }
    }, [ventaEditar, open]);

    // --- LÓGICA DE CÁLCULO AUTOMÁTICO ---
    const calcularTotal = (kilos, unitario) => {
        const k = parseFloat(kilos) || 0;
        const u = parseFloat(unitario) || 0;
        return (k * u).toString(); // Devolvemos el total
    };

    const handleChangeKilos = (e) => {
        const nuevoKilos = e.target.value;
        const nuevoTotal = calcularTotal(nuevoKilos, datos.precio_unitario);
        setDatos({ ...datos, kilos_vendidos: nuevoKilos, precio_total: nuevoTotal });
    };

    const handleChangeUnitario = (e) => {
        const nuevoUnitario = e.target.value;
        const nuevoTotal = calcularTotal(datos.kilos_vendidos, nuevoUnitario);
        setDatos({ ...datos, precio_unitario: nuevoUnitario, precio_total: nuevoTotal });
    };
    // -------------------------------------

    const handleGuardar = async () => {
        // VALIDACIÓN
        if(!datos.id_lote || !datos.kilos_vendidos || !datos.precio_total) {
            Swal.fire({
                icon: 'warning',
                title: 'Faltan datos',
                text: 'Debes indicar el Lote, Kilos y Precio Unitario.',
                confirmButtonColor: '#ff9800'
            });
            return;
        }

        try {
            // Nota: Al backend enviamos lo mismo de siempre (kilos y total), 
            // el unitario es solo una ayuda visual en el frontend.
            if (ventaEditar) {
                await api.put(`/finanzas/ventas/${ventaEditar.id_venta}`, datos);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Venta Actualizada',
                    text: 'Registro financiero modificado correctamente 📝',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                await api.post('/finanzas/ventas', datos);
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Venta Registrada!',
                    text: 'Ingreso añadido a la contabilidad 💰',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            onSuccess(); 
            onClose();

        } catch (error) { 
            console.error(error); 
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la venta.' });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#1b5e20', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                {ventaEditar ? 'Editar Venta' : 'Registrar Venta'}
                <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                    
                    <TextField 
                        label="Fecha" 
                        type="date" 
                        fullWidth 
                        InputLabelProps={{ shrink: true }} 
                        value={datos.fecha_venta} 
                        onChange={(e) => setDatos({...datos, fecha_venta: e.target.value})} 
                    />
                    
                    <TextField 
                        select 
                        fullWidth 
                        label="Lote Cosechado" 
                        value={datos.id_lote} 
                        onChange={(e) => setDatos({...datos, id_lote: e.target.value})}
                    >
                        {listaLotes.map((lote) => (
                            <MenuItem key={lote.id_lote} value={lote.id_lote}>
                                {lote.nombre_lote} - {lote.nombre_variedad || 'Sin Cultivo'}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField 
                        label="Cliente" 
                        fullWidth 
                        value={datos.cliente} 
                        onChange={(e) => setDatos({...datos, cliente: e.target.value})} 
                    />

                    {/* FILA DE CÁLCULO */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField 
                            label="Cantidad (Kg)" 
                            type="number" 
                            fullWidth 
                            value={datos.kilos_vendidos} 
                            onChange={handleChangeKilos} // Usamos el nuevo handler
                        />
                        <TextField 
                            label="Precio Unitario ($)" 
                            type="number" 
                            fullWidth 
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} 
                            value={datos.precio_unitario} 
                            onChange={handleChangeUnitario} // Usamos el nuevo handler
                        />
                    </Box>

                    {/* TOTAL AUTOMÁTICO (Solo Lectura) */}
                    <TextField 
                        label="Total Calculado ($)" 
                        type="number" 
                        fullWidth 
                        InputProps={{ 
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            readOnly: true, // Bloqueado para que sea resultado de la multiplicación
                            style: { fontWeight: 'bold', backgroundColor: '#f5f5f5' }
                        }} 
                        value={datos.precio_total} 
                        // Sin onChange porque es automático
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} color="error">Cancelar</Button>
                <Button variant="contained" onClick={handleGuardar} sx={{ bgcolor: '#1b5e20' }}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default NuevaVentaModal;