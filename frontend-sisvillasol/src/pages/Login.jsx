import { useState } from 'react';
import { TextField, Button, Container, Paper, Typography, Box, InputAdornment, IconButton } from '@mui/material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

// Importamos los iconos que necesitas
import PersonIcon from '@mui/icons-material/Person'; // El muñequito
import Visibility from '@mui/icons-material/Visibility'; // Ojo abierto
import VisibilityOff from '@mui/icons-material/VisibilityOff'; // Ojo cerrado
import LockIcon from '@mui/icons-material/Lock'; // Candado (opcional, para que se vea pro)

function Login() {
    const [documento, setDocumento] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // Estado para controlar el ojo
    const navigate = useNavigate();

 const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', { documento, password });
            
            // --- AQUÍ ESTÁ EL USUARIO QUE INTENTA ENTRAR ---
            const usuario = response.data.usuario;

            // 🔒 RESTRICCIÓN DE SEGURIDAD: SOLO ADMINS (ID_ROL = 1)
            // Si el rol NO es 1 (Admin), lo bloqueamos
            if (usuario.id_rol !== 1) {
                alert('⛔ ACCESO DENEGADO ⛔\n\nEsta plataforma web es exclusiva para Administradores.\nPor favor ingresa desde la Aplicación Móvil.');
                return; // ¡Aquí muere el intento! No guardamos token ni redireccionamos.
            }

            // SI PASÓ EL FILTRO (Es Admin), ENTONCES SÍ GUARDAMOS TODO:
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('usuarioNombre', usuario.nombre);
            localStorage.setItem('usuarioApellido', usuario.apellido);
            localStorage.setItem('usuarioRol', usuario.rol || 'Administrador'); 
            
            // Redirigir al inicio
            navigate('/inicio');

        } catch (error) {
            console.error(error);
            alert('Error: Credenciales incorrectas ❌');
        }
    };

    // Función para alternar entre ver/ocultar contraseña
    const handleClickShowPassword = () => setShowPassword((show) => !show);

    return (
        <Box 
            sx={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                // IMAGEN DE FONDO (Asegúrate de poner 'fondo.jpg' en la carpeta public)
                backgroundImage: 'url(/fondo.jpg)', 
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <Container component="main" maxWidth="xs">
                <Paper 
                    elevation={6} 
                    sx={{ 
                        padding: 4, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        borderRadius: 3, // Bordes redondeados como en Visily
                        backgroundColor: 'rgba(255, 255, 255, 0.95)' // Un poco transparente para que se vea elegante
                    }}
                >
                    {/* LOGO CENTRADO */}
                    <Box 
                        component="img"
                        src="/logo.png" // Asegúrate de poner 'logo.png' en la carpeta public
                        alt="Logo Villasol"
                        sx={{ width: 270, height: 'auto', marginBottom: 2 }}
                    />

                    <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>
                        SISVILLASOL
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                        Sistema de Información Agrícola
                    </Typography>

                    <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
                        
                        {/* CAMPO USUARIO (Con icono de Persona) */}
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            label="Usuario / Documento"
                            autoFocus
                            value={documento}
                            onChange={(e) => setDocumento(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon sx={{ color: '#1b5e20' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {/* CAMPO CONTRASEÑA (Con el Ojo Mágico) */}
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            label="Contraseña"
                            type={showPassword ? 'text' : 'password'} // Aquí cambia el tipo si el ojo está abierto
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon sx={{ color: '#1b5e20' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ 
                                mt: 3, 
                                mb: 2, 
                                py: 1.5,
                                backgroundColor: '#1b5e20', // Verde Institucional
                                fontSize: '1.1rem',
                                '&:hover': { backgroundColor: '#2e7d32' }
                            }}
                        >
                            INGRESAR
                        </Button>

                        <Box textAlign="center">
                            <Typography variant="caption" display="block" color="textSecondary">
                                Finca Villasol - Vereda de Bartaquí
                            </Typography>
                            <Typography variant="caption" display="block" color="textSecondary">
                                Chitagá, Norte de Santander
                            </Typography>
                        </Box>

                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

export default Login;