import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import api from '../services/api';

function EditarEmpresaModal({ open, onClose, alGuardar }) {
    const [datos, setDatos] = useState({
        nombre_empresa: '',
        mision: '',
        vision: '',
        objetivos: ''
    });

    // 1. Cargar datos actuales cuando se abre la ventana
    useEffect(() => {
        if (open) {
            cargarDatos();
        }
    }, [open]);

    const cargarDatos = async () => {
        try {
            const response = await api.get('/empresa');
            // Si la BD devuelve datos, llenamos el formulario
            if (response.data) {
                setDatos(response.data);
            }
        } catch (error) {
            console.error("Error cargando empresa", error);
        }
    };

    // 2. Guardar cambios (PUT)
    const handleGuardar = async () => {
        try {
            await api.put('/empresa', datos);
            alert('¡Información actualizada con éxito! 🏛️');
            alGuardar(); // Avisamos que ya terminamos para recargar la vista
            onClose(); // Cerramos el modal
        } catch (error) {
            console.error(error);
            alert('Error al guardar');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ backgroundColor: '#1b5e20', color: 'white' }}>
                Configurar Identidad Corporativa
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <TextField
                    label="Nombre de la Finca"
                    fullWidth
                    margin="normal"
                    value={datos.nombre_empresa}
                    onChange={(e) => setDatos({ ...datos, nombre_empresa: e.target.value })}
                />
                <TextField
                    label="Misión"
                    fullWidth
                    multiline
                    rows={3}
                    margin="normal"
                    value={datos.mision}
                    onChange={(e) => setDatos({ ...datos, mision: e.target.value })}
                />
                <TextField
                    label="Visión"
                    fullWidth
                    multiline
                    rows={3}
                    margin="normal"
                    value={datos.vision}
                    onChange={(e) => setDatos({ ...datos, vision: e.target.value })}
                />
                <TextField
                    label="Objetivos Estratégicos"
                    fullWidth
                    multiline
                    rows={3}
                    margin="normal"
                    helperText="Separa los objetivos con puntos o guiones"
                    value={datos.objetivos}
                    onChange={(e) => setDatos({ ...datos, objetivos: e.target.value })}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">Cancelar</Button>
                <Button onClick={handleGuardar} variant="contained" sx={{ backgroundColor: '#1b5e20' }}>
                    Guardar Cambios
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default EditarEmpresaModal;