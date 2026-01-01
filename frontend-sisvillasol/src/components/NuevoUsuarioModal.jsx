import { useEffect, useState } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Box, MenuItem, IconButton, FormControlLabel, Switch 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../services/api';

const NuevoUsuarioModal = ({ open, onClose, usuarioEditar, onSuccess }) => { // <--- Aquí la llamamos onSuccess
    
    const [datos, setDatos] = useState({
        nombre: '', apellido: '', documento: '', 
        password: '', telefono: '', id_rol: 2, estado: true
    });

    useEffect(() => {
        if (usuarioEditar) {
            setDatos({
                nombre: usuarioEditar.nombre || '',
                apellido: usuarioEditar.apellido || '',
                documento: usuarioEditar.documento || '',
                password: '', 
                telefono: usuarioEditar.telefono || '',
                id_rol: usuarioEditar.id_rol || 2,
                estado: usuarioEditar.estado
            });
        } else {
            setDatos({ nombre: '', apellido: '', documento: '', password: '', telefono: '', id_rol: 2, estado: true });
        }
    }, [usuarioEditar, open]);

    const handleGuardar = async () => {
        try {
            if (usuarioEditar) {
                await api.put(`/usuarios/${usuarioEditar.id_usuario}`, datos);
                alert('¡Datos actualizados! 👤');
            } else {
                await api.post('/usuarios', datos);
                alert('¡Usuario creado! 👤');
            }
            
            // CORRECCIÓN AQUÍ:
            onSuccess(); // <--- Usamos el nombre correcto (antes decía alGuardar)
            onClose();
            
        } catch (error) {
            console.error(error);
            alert('Error al guardar');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#1b5e20', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {usuarioEditar ? 'Editar Usuario' : 'Nuevo Usuario'}
                <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
            </DialogTitle>
            
            <DialogContent>
                {/* --- DISEÑO VERTICAL RÍGIDO --- */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                    
                    {/* 1. NOMBRE y APELLIDO */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField 
                            fullWidth 
                            label="Nombres" 
                            value={datos.nombre} 
                            onChange={(e) => setDatos({...datos, nombre: e.target.value})} 
                        />
                        <TextField 
                            fullWidth 
                            label="Apellidos" 
                            value={datos.apellido} 
                            onChange={(e) => setDatos({...datos, apellido: e.target.value})} 
                        />
                    </Box>

                    {/* 2. DOCUMENTO y TELÉFONO */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField 
                            fullWidth 
                            label="Documento de Identidad" 
                            type="number"
                            value={datos.documento} 
                            onChange={(e) => setDatos({...datos, documento: e.target.value})} 
                            //disabled={!!usuarioEditar}
                        />
                        <TextField 
                            fullWidth 
                            label="Teléfono / Celular" 
                            type="number"
                            value={datos.telefono} 
                            onChange={(e) => setDatos({...datos, telefono: e.target.value})} 
                        />
                    </Box>

                    {/* 3. ROL y ESTADO */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField 
                            select 
                            fullWidth 
                            label="Rol de Usuario" 
                            value={datos.id_rol} 
                            onChange={(e) => setDatos({...datos, id_rol: e.target.value})}
                        >
                            <MenuItem value={1}>ADMINISTRADOR</MenuItem>
                            <MenuItem value={2}>AGRICULTOR</MenuItem>
                        </TextField>

                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <FormControlLabel 
                                control={<Switch checked={datos.estado} onChange={(e) => setDatos({...datos, estado: e.target.checked})} color="success" />} 
                                label={datos.estado ? "Usuario ACTIVO" : "Usuario INACTIVO"} 
                            />
                        </Box>
                    </Box>

                    {/* 4. CONTRASEÑA */}
                    <TextField 
                        fullWidth 
                        label={usuarioEditar ? "Nueva Contraseña (Opcional)" : "Contraseña"} 
                        type="password" 
                        value={datos.password} 
                        onChange={(e) => setDatos({...datos, password: e.target.value})} 
                        helperText={usuarioEditar ? "Déjalo en blanco si no quieres cambiarla" : "Mínimo 6 caracteres"}
                    />

                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} color="error" variant="outlined">Cancelar</Button>
                <Button variant="contained" onClick={handleGuardar} sx={{ bgcolor: '#1b5e20' }}>
                    {usuarioEditar ? 'Actualizar' : 'Crear Usuario'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NuevoUsuarioModal;