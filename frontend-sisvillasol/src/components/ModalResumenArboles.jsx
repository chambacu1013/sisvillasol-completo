import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Paper, CircularProgress, Typography, Box, Chip
} from '@mui/material';
import ForestIcon from '@mui/icons-material/Forest';
import api from '../services/api';

const ModalResumenArboles = ({ open, handleClose }) => {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        if (open) {
            cargarDatos();
        }
    }, [open]);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const response = await api.get('/lotes/resumen-arboles');
            setDatos(response.data);
        } catch (error) {
            console.error("Error al cargar el resumen de árboles:", error);
        } finally {
            setCargando(false);
        }
    };

    // Calcular el total de árboles
    const totalArboles = datos.reduce((acc, lote) => acc + (lote.cantidad_arboles || 0), 0);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ backgroundColor: '#1b5e20', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ForestIcon />
                Resumen de Lotes y Cultivos
            </DialogTitle>
            <DialogContent dividers>
                {cargando ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress color="success" />
                    </Box>
                ) : (
                    <>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                Inventario actual de plantaciones
                            </Typography>
                            <Chip 
                                icon={<ForestIcon />} 
                                label={`Total Árboles: ${totalArboles}`} 
                                color="success" 
                                variant="outlined" 
                                sx={{ fontWeight: 'bold', fontSize: '1rem' }} 
                            />
                        </Box>
                        <TableContainer component={Paper} elevation={2}>
                            <Table size="small">
                                <TableHead sx={{ backgroundColor: '#f1f8e9' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Lote</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Cultivo</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Área (Has)</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>N° Árboles</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Estado Sanitario</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {datos.length > 0 ? (
                                        datos.map((fila) => (
                                            <TableRow key={fila.id_lote} hover>
                                                <TableCell>{fila.nombre_lote}</TableCell>
                                                <TableCell>{fila.nombre_variedad || 'N/A'}</TableCell>
                                                <TableCell align="center">{fila.area_hectareas}</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                                    {fila.cantidad_arboles || 0}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip 
                                                        label={fila.estado_sanitario} 
                                                        size="small"
                                                        color={fila.estado_sanitario === 'ALERTA' ? 'error' : 'success'} 
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                No hay información registrada.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="inherit" variant="outlined">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalResumenArboles;