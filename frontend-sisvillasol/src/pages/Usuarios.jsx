import { useEffect, useState } from 'react';
import { 
    Box, Typography, Button, TextField, InputAdornment, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, IconButton, Chip, TablePagination, Avatar 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import api from '../services/api';
import NuevoUsuarioModal from '../components/NuevoUsuarioModal';
import Swal from 'sweetalert2';
// (Dejé los colores importados por si quieres usarlos, aunque tu lógica usa hex)
import { deepOrange, deepPurple, teal } from '@mui/material/colors';

function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [usuarioEditar, setUsuarioEditar] = useState(null);

    // Paginación
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        try {
            const response = await api.get('/usuarios');
            setUsuarios(response.data);
        } catch (error) {
            console.error("Error cargando usuarios", error);
        }
    };

    const handleEliminar = async (id, nombre) => {
       // 1. ALERTA DE CONFIRMACIÓN
        Swal.fire({
            title: '¿Eliminar usuario?',
            text: `Estás a punto de eliminar a ${nombre}. Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f', // Rojo intenso
            cancelButtonColor: '#1b5e20',  // Verde corporativo
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // 2. LLAMADO A LA API
                    await api.delete(`/usuarios/${id}`);
                    
                    // 3. ÉXITO
                    Swal.fire(
                        '¡Eliminado!',
                        'El usuario ha sido borrado del sistema.',
                        'success'
                    );
                    cargarUsuarios(); // Recargamos la tabla
                } catch (error) {
                    console.error(error);
                    // 4. ERROR
                    Swal.fire(
                        'Error',
                        'No se pudo eliminar. Verifica que el usuario no tenga tareas asignadas.',
                        'error'
                    );
                }
            }
        });
    };

    // Filtramos por nombre o documento
    const usuariosFiltrados = usuarios.filter(u => 
        u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
        u.documento.includes(busqueda)
    );

    // Función para sacar iniciales (Ej: "Jaime Anatolio" -> "JA")
    const getIniciales = (nombre, apellido) => {
        const n = nombre ? nombre.charAt(0) : '';
        const a = apellido ? apellido.charAt(0) : '';
        return `${n}${a}`.toUpperCase();
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1b5e20' }}>
                Gestión de Usuarios
            </Typography>

            {/* BARRA DE BÚSQUEDA Y BOTÓN */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <TextField
                    placeholder="Buscar personal..."
                    size="small"
                    sx={{ width: 300, bgcolor: 'white' }}
                    value={busqueda}
                    onChange={(e) => { setBusqueda(e.target.value); setPage(0); }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                    }}
                />
                <Button 
                    variant="contained" 
                    startIcon={<PersonAddIcon />}
                    sx={{ bgcolor: '#1b5e20', '&:hover': { bgcolor: '#2e7d32' } }}
                    onClick={() => { setUsuarioEditar(null); setModalOpen(true); }}
                >
                    NUEVO USUARIO
                </Button>
            </Box>

            {/* TABLA DE USUARIOS */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Nombre Completo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Documento</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Teléfono</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {usuariosFiltrados
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row) => (
                                <TableRow key={row.id_usuario} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            {/* Lógica de color según Rol: Verde para Admin, Naranja para Agricultor */}
                                            <Avatar sx={{ bgcolor: row.id_rol === 1 ? '#1b5e20' : '#ff9800', width: 32, height: 32, fontSize: '0.9rem' }}>
                                                {getIniciales(row.nombre, row.apellido)}
                                            </Avatar>
                                            <Typography variant="body2">
                                                {row.nombre} {row.apellido}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{row.documento}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={row.nombre_rol || (row.id_rol === 1 ? 'ADMIN' : 'AGRICULTOR')} 
                                            color={row.id_rol === 1 ? 'primary' : 'default'} 
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{row.telefono || '---'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={row.estado ? "ACTIVO" : "INACTIVO"} 
                                            color={row.estado ? "success" : "error"} 
                                            size="small"
                                            sx={{ fontWeight: 'bold', minWidth: 80 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" color="primary" onClick={() => { setUsuarioEditar(row); setModalOpen(true); }}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleEliminar(row.id_usuario, row.nombre)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 20]}
                component="div"
                count={usuariosFiltrados.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                labelRowsPerPage="Usuarios por página:"
            />

            {/* MODAL CONECTADO (Con la corrección clave) */}
            <NuevoUsuarioModal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
                // IMPORTANTE: Cambiamos alGuardar por onSuccess para que coincida con el componente nuevo
                onSuccess={cargarUsuarios} 
                usuarioEditar={usuarioEditar}
            />
        </Box>
    );
}

export default Usuarios;