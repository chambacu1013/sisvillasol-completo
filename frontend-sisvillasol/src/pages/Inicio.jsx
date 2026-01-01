import { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent } from '@mui/material';
import api from '../services/api';

function Inicio() {
    const [empresa, setEmpresa] = useState(null);

    useEffect(() => {
        const fetchEmpresa = async () => {
            try {
                const response = await api.get('/empresa');
                setEmpresa(response.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchEmpresa();
    }, []);

    return (
        <div>
            {/* BANNER DE BIENVENIDA / IDENTIDAD */}
            <Paper 
                elevation={3}
                sx={{ 
                    p: 6, 
                    mb: 5, 
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    color: 'white',
                    textAlign: 'center',
                    backgroundColor: '#1b5e20',
                    backgroundImage: 'url(/identidad.png)', // Asegúrate de tener esta imagen
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 220
                }}
            >
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1 }} />
                
                <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography variant="h2" sx={{ fontWeight: '900', letterSpacing: 2, textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
                        {empresa ? empresa.nombre_empresa : 'FINCA VILLASOL'}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 'light', fontStyle: 'italic', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                        "Nuestra guía para el éxito sostenible en Bartaquí, Chitagá"
                    </Typography>
                </Box>
            </Paper>

            {/* SECCIÓN DE MISIÓN, VISIÓN Y OBJETIVOS */}
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1b5e20', pl: 1, borderLeft: '4px solid #1b5e20' }}>
                Filosofía Corporativa
            </Typography>
            
            <Grid container spacing={3}>
                {/* MISIÓN */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
                        <Box sx={{ height: 8, backgroundColor: '#4caf50' }} />
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>Misión</Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                                {empresa?.mision || 'Cargando...'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* VISIÓN */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
                        <Box sx={{ height: 8, backgroundColor: '#2196f3' }} />
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1565c0' }}>Visión</Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                                {empresa?.vision || 'Cargando...'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* OBJETIVOS */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
                        <Box sx={{ height: 8, backgroundColor: '#ff9800' }} />
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#e65100' }}>Objetivos</Typography>
                            <Typography variant="body2" color="textSecondary" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                                {empresa?.objetivos || 'Cargando...'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
}

export default Inicio;