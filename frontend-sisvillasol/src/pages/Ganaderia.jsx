import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Tabs, Tab, TextField, Button, 
  Table, TableBody, TableCell, TableHead, TableRow, 
  Select, MenuItem, FormControl, InputLabel, Grid, Chip,
  IconButton, Tooltip
} from '@mui/material';

// Iconos
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// Dependencias
import api from '../services/api';
import Swal from 'sweetalert2'; 
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

// -----------------------------------------------------------
// 1. PESTAÑA INVENTARIO ANIMAL (MEJORADA)
// -----------------------------------------------------------
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
        setAnimalSeleccionado(animal); 
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
            recargar(); 
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
                            <TableCell>
                                {a.fecha_ingreso ? a.fecha_ingreso.split('T')[0] : '-'}
                            </TableCell>
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

            {/* MODAL IMPORTADO */}
            <NuevoGanadoModal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
                onSave={handleGuardar}
                animalEditar={animalSeleccionado}
            />
        </Box>
    );
};

// -----------------------------------------------------------
// 2. PESTAÑA LECHE
// -----------------------------------------------------------
const TabLeche = ({ data, recargar }) => {
    const [form, setForm] = useState({ fecha: '', manana: 0, tarde: 0, precio: 0 });

    const guardar = async () => {
        try {
            await api.post('/ganaderia/leche', form);
            recargar();
            Swal.fire({ icon: 'success', title: 'Producción Guardada', timer: 2000 });
        } catch (error) {
            Swal.fire('Error', 'No se pudo registrar la leche', 'error');
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={3}><TextField type="date" fullWidth onChange={e=>setForm({...form, fecha:e.target.value})} size="small" focused label="Fecha"/></Grid>
                    <Grid item xs={2}><TextField label="Lts Mañana" type="number" fullWidth onChange={e=>setForm({...form, manana:e.target.value})} size="small"/></Grid>
                    <Grid item xs={2}><TextField label="Lts Tarde" type="number" fullWidth onChange={e=>setForm({...form, tarde:e.target.value})} size="small"/></Grid>
                    <Grid item xs={3}><TextField label="Precio Venta ($)" type="number" fullWidth onChange={e=>setForm({...form, precio:e.target.value})} size="small"/></Grid>
                    <Grid item xs={2}><Button fullWidth variant="contained" onClick={guardar}>Guardar</Button></Grid>
                </Grid>
            </Paper>
            <Table size="small">
                <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Total Litros</TableCell><TableCell>Precio</TableCell><TableCell>Venta Total</TableCell></TableRow></TableHead>
                <TableBody>
                    {data.map(d => (
                        <TableRow key={d.id_leche}>
                            <TableCell>{d.fecha.split('T')[0]}</TableCell>
                            <TableCell>{parseFloat(d.litros_manana) + parseFloat(d.litros_tarde)} L</TableCell>
                            <TableCell>${d.precio_litro}</TableCell>
                            <TableCell sx={{fontWeight:'bold', color:'green'}}>${d.total_venta}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};

// -----------------------------------------------------------
// 3. PESTAÑA INSUMOS
// -----------------------------------------------------------
const TabInsumos = ({ data, recargar }) => {
    const [form, setForm] = useState({ tipo: 'Sal', cantidad: '', costo: '' });

    const guardar = async () => {
        try {
            await api.post('/ganaderia/insumo', form);
            recargar();
            Swal.fire({ icon: 'success', title: 'Gasto Registrado', timer: 2000 });
        } catch (error) {
            Swal.fire('Error', 'Hubo un problema al guardar', 'error');
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Paper sx={{ p: 2, mb: 2, display:'flex', gap:2 }}>
                <FormControl size="small" sx={{minWidth:150}}>
                    <InputLabel>Tipo Insumo</InputLabel>
                    <Select value={form.tipo} label="Tipo Insumo" onChange={e=>setForm({...form, tipo:e.target.value})}>
                        <MenuItem value="Sal">Sal Mineral</MenuItem>
                        <MenuItem value="Melaza">Melaza</MenuItem>
                        <MenuItem value="Concentrado">Concentrado</MenuItem>
                        <MenuItem value="Medicamento">Medicamento</MenuItem>
                    </Select>
                </FormControl>
                <TextField label="Cantidad (Kg/Lt)" onChange={e=>setForm({...form, cantidad:e.target.value})} size="small"/>
                <TextField label="Costo Total ($)" onChange={e=>setForm({...form, costo:e.target.value})} size="small"/>
                <Button variant="contained" color="warning" onClick={guardar}>Registrar</Button>
            </Paper>
            <Table size="small">
                <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Insumo</TableCell><TableCell>Cantidad</TableCell><TableCell>Costo</TableCell></TableRow></TableHead>
                <TableBody>
                    {data.map(i => (
                        <TableRow key={i.id_consumo}>
                            <TableCell>{i.fecha.split('T')[0]}</TableCell>
                            <TableCell>{i.tipo_insumo}</TableCell>
                            <TableCell>{i.cantidad_kg}</TableCell>
                            <TableCell>${i.costo_total}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};

// -----------------------------------------------------------
// 4. PESTAÑA VENTAS
// -----------------------------------------------------------
const TabVentas = ({ animales, recargar }) => {
    const [form, setForm] = useState({ id_animal: '', precio: '', peso: '', comprador: '' });

    const confirmarVenta = () => {
        if(!form.id_animal) return Swal.fire('Error', 'Seleccione un animal primero', 'warning');

        Swal.fire({
            title: '¿Confirmar Venta?',
            text: "El animal saldrá del inventario activo.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, vender'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.post('/ganaderia/venta', form);
                    recargar();
                    Swal.fire('¡Vendido!', 'La venta ha sido registrada.', 'success');
                } catch (error) {
                    Swal.fire('Error', 'No se pudo realizar la venta', 'error');
                }
            }
        });
    };

    return (
        <Box sx={{ p: 2 }}>
            <Paper sx={{ p: 2, maxWidth: 600, margin: 'auto' }}>
                <Typography variant="h6" sx={{mb:2, textAlign:'center', color:'#d32f2f'}}>
                    💸 Registrar Venta de Ganado
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Seleccionar Animal</InputLabel>
                            <Select value={form.id_animal} label="Seleccionar Animal" onChange={e=>setForm({...form, id_animal:e.target.value})}>
                                {animales.map(a => <MenuItem key={a.id_animal} value={a.id_animal}>{a.numero_animal} - {a.raza}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}><TextField fullWidth label="Peso (Kg)" onChange={e=>setForm({...form, peso:e.target.value})} size="small"/></Grid>
                    <Grid item xs={6}><TextField fullWidth label="Precio Venta ($)" onChange={e=>setForm({...form, precio:e.target.value})} size="small"/></Grid>
                    <Grid item xs={12}><TextField fullWidth label="Comprador" onChange={e=>setForm({...form, comprador:e.target.value})} size="small"/></Grid>
                    <Grid item xs={12}>
                        <Button fullWidth variant="contained" color="error" size="large" onClick={confirmarVenta}>
                            CONFIRMAR VENTA
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

// -----------------------------------------------------------
// COMPONENTE PRINCIPAL (EXPORT DEFAULT)
// -----------------------------------------------------------
export default function Ganaderia() {
    const [tab, setTab] = useState(0);
    const [data, setData] = useState({ animales:[], leche:[], insumos:[], pastoreo:[] });

    const cargarDatos = async () => {
        try {
            const res = await api.get('/ganaderia/dashboard');
            setData(res.data);
        } catch (error) { 
            console.error("Error cargando ganaderia"); 
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    return (
        <Paper sx={{ m: 2, minHeight: '80vh' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
                    <Tab label="🐄 Inventario Animal" />
                    <Tab label="🥛 Producción Leche" />
                    <Tab label="💊 Sal y Melaza" />
                    <Tab label="💰 Ventas Ganado" />
                </Tabs>
            </Box>
            
            {tab === 0 && <TabAnimales animales={data.animales} recargar={cargarDatos} />}
            {tab === 1 && <TabLeche data={data.leche} recargar={cargarDatos} />}
            {tab === 2 && <TabInsumos data={data.insumos} recargar={cargarDatos} />}
            {tab === 3 && <TabVentas animales={data.animales} recargar={cargarDatos} />}
        </Paper>
    );
}