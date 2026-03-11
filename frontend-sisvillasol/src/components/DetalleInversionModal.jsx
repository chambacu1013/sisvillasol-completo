import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    Typography, 
    TableContainer, 
    Table, 
    TableHead, 
    TableRow, 
    TableCell, 
    TableBody, 
    Paper, 
    Chip 
} from '@mui/material';

function DetalleInversionModal({ open, onClose, tipoDetalle, datosDetalle, anioSeleccionado }) {
    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
        >
            <DialogTitle sx={{ bgcolor: tipoDetalle === 'Mano de Obra' ? '#FF8042' : '#0088FE', color: 'white', fontWeight: 'bold' }}>
                Detalle de {tipoDetalle} en {anioSeleccionado}
            </DialogTitle>
            
            <DialogContent dividers sx={{ bgcolor: '#f9f9f9', p: { xs: 1, sm: 3 } }}>
                {datosDetalle.length === 0 ? (
                    <Typography align="center" sx={{ py: 3, color: '#666' }}>
                        No hay registros de {tipoDetalle} para este año.
                    </Typography>
                ) : (
                    <TableContainer component={Paper} elevation={2}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#eee' }}>
                                <TableRow>
                                    <TableCell><b>Fecha</b></TableCell>
                                    {tipoDetalle === 'Mano de Obra' ? (
                                        <>
                                            <TableCell><b>Agricultor</b></TableCell>
                                            <TableCell align="right"><b>Costo Jornal</b></TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell><b>Insumo</b></TableCell>
                                            <TableCell align="center"><b>Cantidad</b></TableCell>
                                            <TableCell align="right"><b>Costo Total</b></TableCell>
                                        </>
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {datosDetalle.map((fila, i) => (
                                    <TableRow key={i} hover>
                                        <TableCell>
                                            {fila.fecha ? new Date(fila.fecha).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : '---'}
                                        </TableCell>
                                        {tipoDetalle === 'Mano de Obra' ? (
                                            <>
                                                <TableCell>{fila.nombre} {fila.apellido}</TableCell>
                                                <TableCell align="right" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                                                    ${Number(fila.costo_mano_obra || fila.costo).toLocaleString()}
                                                </TableCell>
                                            </>
                                        ) : (
                                            <>
                                                <TableCell>{fila.nombre_insumo}</TableCell>
                                                <TableCell align="center">
                                                    <Chip label={`${Number(fila.cantidad_usada)} ${fila.nombre_unidad}`} size="small" variant="outlined"/>
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                                                    ${Number(fila.costo_calculado).toLocaleString()}
                                                </TableCell>
                                            </>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose} color="inherit" sx={{ fontWeight: 'bold' }}>
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default DetalleInversionModal;