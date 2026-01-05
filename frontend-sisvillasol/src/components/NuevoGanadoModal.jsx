import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Grid 
} from '@mui/material';

export default function NuevoGanadoModal({ open, onClose, onSave, animalEditar }) {
    // Estado del formulario
    const [form, setForm] = useState({ 
        numero: '', 
        raza: '', 
        fecha_ingreso: new Date().toISOString().split('T')[0] // Fecha de hoy por defecto
    });

    // Detectar si vamos a EDITAR o a CREAR
    useEffect(() => {
        if (animalEditar) {
            // Si viene un animal, llenamos el formulario con sus datos
            setForm({
                numero: animalEditar.numero_animal,
                raza: animalEditar.raza,
                fecha_ingreso: animalEditar.fecha_ingreso ? animalEditar.fecha_ingreso.split('T')[0] : ''
            });
        } else {
            // Si no, limpiamos
            setForm({ numero: '', raza: '', fecha_ingreso: new Date().toISOString().split('T')[0] });
        }
    }, [animalEditar, open]);

    const handleSubmit = () => {
        onSave(form); // Enviamos los datos al padre
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{animalEditar ? '✏️ Editar Animal' : '🐮 Registrar Nuevo Animal'}</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField 
                            label="Número / Chapeta" 
                            fullWidth 
                            value={form.numero}
                            onChange={(e) => setForm({...form, numero: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField 
                            label="Raza" 
                            fullWidth 
                            value={form.raza}
                            onChange={(e) => setForm({...form, raza: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField 
                            label="Fecha Nacimiento / Ingreso" 
                            type="date"
                            fullWidth 
                            focused
                            value={form.fecha_ingreso}
                            onChange={(e) => setForm({...form, fecha_ingreso: e.target.value})}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="error">Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained" color="success">
                    {animalEditar ? 'Actualizar' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}