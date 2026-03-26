import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    Typography, 
    TextField, 
    MenuItem 
} from '@mui/material';

function ActualizarEstadoModal({
    open,
    onClose,
    loteSeleccionado,
    clasificacionFiltro,
    setClasificacionFiltro,
    idEstadoSeleccionado,
    setIdEstadoSeleccionado,
    estadosFiltrados,
    handleGuardarEstado
}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: clasificacionFiltro === 'OPTIMO' ? '#2e7d32' : '#d32f2f', color: 'white' }}>
                Actualizar Estado Agronómico
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 3 }}>
                    Lote Seleccionado: <b>{loteSeleccionado?.nombre_lote}</b>
                </Typography>

                {/* SELECT 1: OPTIMO O ALERTA */}
                <TextField 
                    select 
                    fullWidth 
                    label="Condición General" 
                    value={clasificacionFiltro} 
                    onChange={(e) => { 
                        setClasificacionFiltro(e.target.value); 
                        setIdEstadoSeleccionado(''); 
                    }} 
                    sx={{ mb: 3 }}
                >
                    <MenuItem value="OPTIMO">🟢 ÓPTIMO (Ciclo Fenológico Normal)</MenuItem>
                    <MenuItem value="ALERTA">🔴 ALERTA (Plagas, Hongos, Daños)</MenuItem>
                </TextField>

                {/* SELECT 2: LISTA DE ESTADOS SEGÚN LA CONDICIÓN */}
                <TextField 
                    select 
                    fullWidth 
                    label="Seleccionar Etapa o Problema" 
                    value={idEstadoSeleccionado} 
                    onChange={(e) => setIdEstadoSeleccionado(e.target.value)}
                    disabled={!clasificacionFiltro}
                >
                    {estadosFiltrados.map((estado) => (
                        <MenuItem key={estado.id_estado} value={estado.id_estado}>
                            <b>[{estado.categoria}]</b> - {estado.nombre_estado}
                        </MenuItem>
                    ))}
                </TextField>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Cancelar</Button>
                <Button 
                    variant="contained" 
                    onClick={handleGuardarEstado}
                    sx={{ bgcolor: clasificacionFiltro === 'OPTIMO' ? '#2e7d32' : '#d32f2f' }}
                >
                    Guardar Cambios
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ActualizarEstadoModal;