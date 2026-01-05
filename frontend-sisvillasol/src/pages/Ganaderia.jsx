// Agrega estos iconos en tus imports
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { IconButton, Tooltip } from '@mui/material';
import NuevoGanadoModal from '../components/NuevoGanadoModal';

// --- FUNCIÓN MATEMÁTICA PARA LA EDAD ---
const calcularEdad = (fecha) => {
    if (!fecha) return "Desconocida";
    const nacimiento = new Date(fecha);
    const hoy = new Date();

    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();

    if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) {
        anios--;
        meses += 12;
    }
    
    // Ajuste fino de días para meses
    if (hoy.getDate() < nacimiento.getDate()) {
        meses--;
    }

    if (anios === 0 && meses === 0) return "Recién nacido";
    if (anios === 0) return `${meses} meses`;
    if (meses === 0) return `${anios} años`;
    
    return `${anios} años y ${meses} m`;
};

// --- COMPONENTE TAB ANIMALES MEJORADO ---
const TabAnimales = ({ animales, recargar }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [animalSeleccionado, setAnimalSeleccionado] = useState(null); // Para editar

    // Abrir modal para CREAR
    const handleAbrirNuevo = () => {
        setAnimalSeleccionado(null);
        setModalOpen(true);
    };

    // Abrir modal para EDITAR
    const handleAbrirEditar = (animal) => {
        setAnimalSeleccionado(animal); // Pasamos los datos viejos
        setModalOpen(true);
    };

    // GUARDAR (Crea o Edita según el caso)
    const handleGuardar = async (datosForm) => {
        if (!datosForm.numero) return Swal.fire('Error', 'Falta el número', 'warning');

        try {
            if (animalSeleccionado) {
                // MODO EDICIÓN
                await api.put(`/ganaderia/animal/${animalSeleccionado.id_animal}`, datosForm);
                Swal.fire('Actualizado', 'Datos del animal actualizados', 'success');
            } else {
                // MODO CREACIÓN
                await api.post('/ganaderia/animal', datosForm);
                Swal.fire('Registrado', 'Nuevo animal en el hato', 'success');
            }
            recargar(); // Refresca la tabla
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar', 'error');
        }
    };

    // ELIMINAR
    const handleEliminar = (id) => {
        Swal.fire({
            title: '¿Eliminar animal?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/ganaderia/animal/${id}`);
                    recargar();
                    Swal.fire('Eliminado', 'El animal ha sido borrado.', 'success');
                } catch (error) {
                    Swal.fire('Error', 'No se puede eliminar (¿Tiene leche o ventas asociadas?)', 'error');
                }
            }
        });
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* BOTÓN AGREGAR GRANDE */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" color="text.secondary">Listado del Hato</Typography>
                <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={<AddIcon />} 
                    onClick={handleAbrirNuevo}
                >
                    Nuevo Animal
                </Button>
            </Box>

            <Table size="small">
                <TableHead>
                    <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                        <TableCell><b>Chapeta / Número</b></TableCell>
                        <TableCell><b>Raza</b></TableCell>
                        <TableCell><b>Fecha Ingreso</b></TableCell>
                        <TableCell><b>Edad Aprox.</b></TableCell>
                        <TableCell><b>Estado</b></TableCell>
                        <TableCell align="center"><b>Acciones</b></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {animales.map(a => (
                        <TableRow key={a.id_animal} hover>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                                {a.numero_animal}
                            </TableCell>
                            <TableCell>{a.raza}</TableCell>
                            
                            {/* Fecha formateada */}
                            <TableCell>
                                {a.fecha_ingreso ? a.fecha_ingreso.split('T')[0] : '-'}
                            </TableCell>
                            
                            {/* Edad calculada */}
                            <TableCell sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                                {calcularEdad(a.fecha_ingreso)}
                            </TableCell>

                            <TableCell>
                                <Chip 
                                    label={a.estado} 
                                    color={a.estado === 'ACTIVO' ? 'success' : 'default'} 
                                    size="small" 
                                />
                            </TableCell>
                            
                            {/* BOTONES DE ACCIÓN */}
                            <TableCell align="center">
                                <Tooltip title="Editar">
                                    <IconButton color="primary" size="small" onClick={() => handleAbrirEditar(a)}>
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                    <IconButton color="error" size="small" onClick={() => handleEliminar(a.id_animal)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* MODAL (SEPARADO) */}
            <NuevoGanadoModal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
                onSave={handleGuardar}
                animalEditar={animalSeleccionado}
            />
        </Box>
    );
};