import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Grid, InputAdornment 
} from '@mui/material';

export default function NuevoLecheModal({ open, onClose, onSave, registroEditar }) {
    const [form, setForm] = useState({ 
        fecha: new Date().toISOString().split('T')[0], 
        cantidad: '', 
        precio: '' 
    });

    useEffect(() => {
        if (registroEditar) {
            setForm({
                fecha: registroEditar.fecha ? registroEditar.fecha.split('T')[0] : '',
                cantidad: registroEditar.cantidad_litros,
                precio: registroEditar.precio_litro
            });
        } else {
            setForm({ 
                fecha: new Date().toISOString().split('T')[0], 
                cantidad: '', 
                precio: '' 
            });
        }
    }, [registroEditar, open]);

    const handleSubmit = () => {
        onSave(form);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                {registroEditar ? '✏️ Editar Producción' : '🥛 Nueva Producción'}
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={12}>
                        <TextField 
                            label="Fecha" 
                            type="date"
                            fullWidth 
                            focused
                            value={form.fecha}
                            onChange={(e) => setForm({...form, fecha: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField 
                            label="Litros Totales" 
                            type="number"
                            fullWidth 
                            value={form.cantidad}
                            onChange={(e) => setForm({...form, cantidad: e.target.value})}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">L</InputAdornment>,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField 
                            label="Precio por Litro" 
                            type="number"
                            fullWidth 
                            value={form.precio}
                            onChange={(e) => setForm({...form, precio: e.target.value})}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="error">Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    {registroEditar ? 'Actualizar' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}