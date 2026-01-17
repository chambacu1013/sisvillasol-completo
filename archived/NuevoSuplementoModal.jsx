import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Grid, InputAdornment, 
  FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';

export default function NuevoInsumoModal({ open, onClose, onSave, registroEditar }) {
    const [form, setForm] = useState({ 
        fecha: new Date().toISOString().split('T')[0], 
        tipo: 'Sal',
        cantidad: '', 
        costo: '' 
    });

    useEffect(() => {
        if (registroEditar) {
            setForm({
                fecha: registroEditar.fecha ? registroEditar.fecha.split('T')[0] : '',
                tipo: registroEditar.tipo_insumo,
                cantidad: registroEditar.cantidad_kg,
                costo: registroEditar.costo_total
            });
        } else {
            // Valores por defecto al abrir para crear
            setForm({ 
                fecha: new Date().toISOString().split('T')[0], 
                tipo: 'Sal',
                cantidad: '', 
                costo: '' 
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
                {registroEditar ? '✏️ Editar Suplemento' : '💊 Nuevo Suplemento'}
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
                        <FormControl fullWidth>
                            <InputLabel>Tipo de Insumo</InputLabel>
                            <Select 
                                value={form.tipo} 
                                label="Tipo de Insumo" 
                                onChange={(e) => setForm({...form, tipo: e.target.value})}
                            >
                                <MenuItem value="Sal">Sal Mineral</MenuItem>
                                <MenuItem value="Melaza">Melaza</MenuItem>
                                <MenuItem value="Concentrado">Concentrado</MenuItem>
                                <MenuItem value="Medicamento">Medicamento / Vitamina</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField 
                            label="Cantidad (Kg / Lt)" 
                            type="number"
                            fullWidth 
                            value={form.cantidad}
                            onChange={(e) => setForm({...form, cantidad: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField 
                            label="Costo Total ($)" 
                            type="number"
                            fullWidth 
                            value={form.costo}
                            onChange={(e) => setForm({...form, costo: e.target.value})}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="error">Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained" color="warning">
                    {registroEditar ? 'Actualizar' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}