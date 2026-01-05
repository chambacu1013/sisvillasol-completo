import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Tabs, Tab, TextField, Button, 
  Table, TableBody, TableCell, TableHead, TableRow, 
  Select, MenuItem, FormControl, InputLabel, Grid, Chip 
} from '@mui/material';
import api from '../services/api';

// --- IMPORTAMOS SWEETALERT2 ---
import Swal from 'sweetalert2'; 

// -----------------------------------------------------------
// 1. PESTAÑA INVENTARIO ANIMAL
// -----------------------------------------------------------
const TabAnimales = ({ animales, recargar }) => {
    const [nuevo, setNuevo] = useState({ numero: '', raza: '' });

    const guardar = async () => {
        if(!nuevo.numero) {
            return Swal.fire('Falta información', 'Debes escribir el número del animal', 'warning');
        }
        
        try {
            await api.post('/ganaderia/animal', nuevo);
            setNuevo({ numero: '', raza: '' });
            recargar();
            
            // Alerta SweetAlert2
            Swal.fire({
                icon: 'success',
                title: '¡Registrado!',
                text: 'La vaca/toro ha sido registrada correctamente.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar el animal', 'error');
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Paper sx={{ p: 2, mb: 2, display:'flex', gap:2 }}>
                <TextField label="Número/Chapeta" value={nuevo.numero} onChange={e=>setNuevo({...nuevo, numero:e.target.value})} size="small"/>
                <TextField label="Raza" value={nuevo.raza} onChange={e=>setNuevo({...nuevo, raza:e.target.value})} size="small"/>
                <Button variant="contained" color="success" onClick={guardar}>+ Agregar</Button>
            </Paper>
            <Table size="small">
                <TableHead><TableRow><TableCell># Animal</TableCell><TableCell>Raza</TableCell><TableCell>Estado</TableCell></TableRow></TableHead>
                <TableBody>
                    {animales.map(a => (
                        <TableRow key={a.id_animal}>
                            <TableCell sx={{fontWeight:'bold'}}>{a.numero_animal}</TableCell>
                            <TableCell>{a.raza}</TableCell>
                            <TableCell><Chip label={a.estado} color={a.estado==='ACTIVO'?'success':'default'} size="small"/></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
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
            Swal.fire({
                icon: 'success',
                title: 'Producción Guardada',
                text: 'Se registró la leche del día.',
                timer: 2000
            });
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
// 3. PESTAÑA INSUMOS (SAL, MELAZA)
// -----------------------------------------------------------
const TabInsumos = ({ data, recargar }) => {
    const [form, setForm] = useState({ tipo: 'Sal', cantidad: '', costo: '' });

    const guardar = async () => {
        try {
            await api.post('/ganaderia/insumo', form);
            recargar();
            Swal.fire({
                icon: 'success',
                title: 'Gasto Registrado',
                text: `Se agregó el consumo de ${form.tipo}`,
                timer: 2000
            });
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
// 4. PESTAÑA VENTAS (CON CONFIRMACIÓN DE SWEETALERT)
// -----------------------------------------------------------
const TabVentas = ({ animales, recargar }) => {
    const [form, setForm] = useState({ id_animal: '', precio: '', peso: '', comprador: '' });

    const confirmarVenta = () => {
        if(!form.id_animal) return Swal.fire('Error', 'Seleccione un animal primero', 'warning');

        // Confirmación bonita antes de vender
        Swal.fire({
            title: '¿Confirmar Venta?',
            text: "El animal saldrá del inventario activo.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, vender',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.post('/ganaderia/venta', form);
                    recargar();
                    Swal.fire(
                        '¡Vendido!',
                        'La venta ha sido registrada y el animal dado de baja.',
                        'success'
                    );
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
                    <Grid item xs={6}><TextField fullWidth label="Peso al vender (Kg)" onChange={e=>setForm({...form, peso:e.target.value})} size="small"/></Grid>
                    <Grid item xs={6}><TextField fullWidth label="Precio Venta ($)" onChange={e=>setForm({...form, precio:e.target.value})} size="small"/></Grid>
                    <Grid item xs={12}><TextField fullWidth label="Nombre Comprador" onChange={e=>setForm({...form, comprador:e.target.value})} size="small"/></Grid>
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
// COMPONENTE PRINCIPAL
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
            // Opcional: Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
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