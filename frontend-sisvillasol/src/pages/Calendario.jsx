import { useEffect, useState, useCallback } from 'react';
import { 
    Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
    DialogActions, TextField, MenuItem, InputAdornment, IconButton, 
    Grid, Card, CardContent, Paper, Divider, GlobalStyles,
    Table, TableBody, TableCell, TableHead, TableRow, Chip
} from '@mui/material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/dist/locale/es'; 
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Swal from 'sweetalert2';
// ÍCONOS
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close'; 
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';
import CancelIcon from '@mui/icons-material/Cancel'; 

import api from '../services/api';
import '../../public/Calendario.css'; // Estilos personalizados
moment.locale('es');
const localizer = momentLocalizer(moment);

const mensajesEspanol = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay actividades en este rango.',
};

const formatosEspanol = {
    monthHeaderFormat: (date, culture, localizer) => 
        localizer.format(date, 'MMMM YYYY', culture).charAt(0).toUpperCase() + localizer.format(date, 'MMMM YYYY', culture).slice(1),
    weekdayFormat: (date, culture, localizer) => 
        localizer.format(date, 'ddd', culture).charAt(0).toUpperCase() + localizer.format(date, 'ddd', culture).slice(1),
    dayFormat: (date, culture, localizer) => 
        localizer.format(date, 'DD', culture),
};

const CustomAgendaTime = ({ event }) => {
    const jornada = event.resource.jornada;
    const containerStyle = {
        backgroundColor: 'white',
        padding: '2px 8px',
        borderRadius: '10px',
        display: 'inline-block', 
        boxShadow: '0px 1px 2px rgba(0,0,0,0.1)' 
    };

    if (jornada === 'MANANA') return <span style={containerStyle}><span style={{ color: '#f57c00', fontWeight: 'bold' }}>🌅 Mañana</span></span>;
    if (jornada === 'TARDE') return <span style={containerStyle}><span style={{ color: '#5d4037', fontWeight: 'bold' }}>🌇 Tarde</span></span>;
    return <span style={containerStyle}><span style={{ color: 'black', fontWeight: 'bold' }}>☀️ Todo el día</span></span>;
};

function Calendario() {
    // --- ESTADOS ---
    const [eventos, setEventos] = useState([]);
    const [fechaActual, setFechaActual] = useState(new Date()); 
    const [vista, setVista] = useState('month'); 
    const [modalOpen, setModalOpen] = useState(false);
    const [tareaEditar, setTareaEditar] = useState(null);
    const [listas, setListas] = useState({ lotes: [], usuarios: [], tipos: [] });
    
    const [datos, setDatos] = useState({
        id_tipo_actividad: '', descripcion: '', fecha_programada: '', 
        id_lote: '', id_usuario: '', estado: 'PENDIENTE', costo_mano_obra: '',
        jornada: 'COMPLETA' 
    });

    const [notas, setNotas] = useState([]);
    const [nuevaNota, setNuevaNota] = useState('');
    const [insumosUsados, setInsumosUsados] = useState([]);

    // Estado para "NO REALIZADO"
    const [modalMotivoOpen, setModalMotivoOpen] = useState(false);
    const [motivoNoRealizado, setMotivoNoRealizado] = useState('');

    useEffect(() => {
        cargarDatos();
        cargarListas();
        cargarNotas(); 
    }, []);

    useEffect(() => {
        if (tareaEditar) {
           
            // Si la tarea ya se hizo, mostramos en el campo "Fecha" el día que se hizo.
            // Si está pendiente, mostramos el día programado.
            let fechaDelFormulario = tareaEditar.resource.fecha_programada;
            if (tareaEditar.resource.estado === 'HECHO' && tareaEditar.resource.fecha_ejecucion) {
                fechaDelFormulario = tareaEditar.resource.fecha_ejecucion;
            }
            const fechaSimple = fechaDelFormulario ? fechaDelFormulario.toString().split('T')[0] : '';
            setDatos({
                id_tipo_actividad: tareaEditar.resource.id_tipo_actividad_tarea || '',
                descripcion: tareaEditar.resource.descripcion || '',
                fecha_programada: fechaSimple,
                id_lote: tareaEditar.resource.id_lote_tarea || '',
                id_usuario: tareaEditar.resource.id_usuario_asignado || '',
                estado: tareaEditar.resource.estado || 'PENDIENTE',
                costo_mano_obra: tareaEditar.resource.costo_mano_obra || '',
                jornada: tareaEditar.resource.jornada || 'COMPLETA',
            });
        } 
    }, [tareaEditar, modalOpen]);

    // --- CARGAS ---
    const cargarDatos = async () => {
        try {
            const res = await api.get('/actividades');
            
            // --- AQUÍ ESTÁ LA CORRECCIÓN DE LA FECHA ---
            const eventosFormatoCalendario = res.data.map(tarea => {
                
                // LÓGICA MAESTRA:
                // Si está HECHO y tiene fecha de ejecución, usamos esa.
                // Si no, usamos la programada.
                let fechaParaMostrar = tarea.fecha_programada;
                if (tarea.estado === 'HECHO' && tarea.fecha_ejecucion) {
                    fechaParaMostrar = tarea.fecha_ejecucion;
                }

                if (!fechaParaMostrar) return null; // Seguridad por si viene vacío
                const fechaString = fechaParaMostrar.toString().split('T')[0];
                const [anio, mes, dia] = fechaString.split('-');
                const fechaFixed = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));

                return {
                    title: `${tarea.nombre_tipo_actividad || 'Tarea'} - ${tarea.nombre_lote || 'Sin Lote'} (${tarea.nombre_responsable || '?'})`,
                    start: fechaFixed, 
                    end: fechaFixed, 
                    allDay: true, 
                    resource: tarea 
                };
            }).filter(Boolean); // Filtramos nulos por si acaso

            setEventos(eventosFormatoCalendario);
        } catch (error) { console.error("Error cargando calendario:", error); }
    };

    const cargarListas = async () => {
        try {
            const res = await api.get('/actividades/datos-formulario');
            setListas(res.data);
        } catch (error) { console.error("Error cargando listas:", error); }
    };

    const cargarNotas = async () => {
        try {
            const res = await api.get('/notas');
            setNotas(res.data);
        } catch (error) { console.error("Error cargando notas:", error); }
    };

    // --- NOTAS ---
    const handleGuardarNota = async () => {
        if (!nuevaNota.trim()) {
            Swal.fire({ icon: 'info', title: 'Nota vacía', text: 'Escribe algo...' });
            return;
        }
        try {
            await api.post('/notas', { contenido: nuevaNota });
            setNuevaNota(''); cargarNotas();
            Swal.fire({ icon: 'success', title: 'Nota agregada', showConfirmButton: false, timer: 1000, toast: true, position: 'top-end' });
        } catch (error) { console.error(error); }
    };

    const handleEliminarNota = async (id) => {
        Swal.fire({
            title: '¿Borrar nota?', icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#f57f17', cancelButtonColor: '#1b5e20', confirmButtonText: 'Sí, borrar', cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/notas/${id}`); cargarNotas();
                    Swal.fire({ icon: 'success', title: 'Nota eliminada', showConfirmButton: false, timer: 1000, toast: true, position: 'top-end' });
                } catch (error) { console.error(error); }
            }
        });
    };

    // --- GUARDAR ---
    const handleGuardar = async () => {
        if(!datos.id_tipo_actividad || !datos.fecha_programada || !datos.id_lote) {
            Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'Selecciona Actividad, Fecha y Lote.' });
            return;
        }
        try {
            if (tareaEditar) {

                await api.put(`/actividades/${tareaEditar.resource.id_tarea}`, datos);
                Swal.fire({ icon: 'success', title: '¡Actualizado!', timer: 2000, showConfirmButton: false });
            } else {
                await api.post('/actividades', datos);
                Swal.fire({ icon: 'success', title: '¡Programado!', timer: 2000, showConfirmButton: false });
            }
            setModalOpen(false); setTareaEditar(null); cargarDatos();
        } catch (error) { 
            console.error(error); 
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar.' });
        }
    };

    // --- NO REALIZADO ---
    const handleConfirmarNoRealizado = async () => {
        if (!motivoNoRealizado.trim()) {
            Swal.fire({ icon: 'warning', title: 'Motivo requerido', text: 'Explica por qué no se realizó.' });
            return;
        }
        try {
            const fechaHoy = new Date().toLocaleDateString();
            const textoAdicional = `\n[NO REALIZADO - ${fechaHoy}]: ${motivoNoRealizado}`;
            const nuevaDescripcion = (datos.descripcion || "") + textoAdicional;

            const datosCancelacion = { ...datos, descripcion: nuevaDescripcion, estado: 'NO REALIZADO' };

            await api.put(`/actividades/${tareaEditar.resource.id_tarea}`, datosCancelacion);
            
            Swal.fire({ icon: 'info', title: 'Marcado como No Realizado', text: 'Motivo registrado.', confirmButtonColor: '#d32f2f' });
            setModalMotivoOpen(false); setMotivoNoRealizado(''); setModalOpen(false); setTareaEditar(null); cargarDatos();
        } catch (error) {
            console.error(error); Swal.fire({ icon: 'error', title: 'Error', text: 'Falló la actualización.' });
        }
    };

    const handleSelectEvent = async (evento) => {
        setTareaEditar(evento); setModalOpen(true); setInsumosUsados([]); 
        const idTarea = evento?.resource?.id_tarea || evento?.id_tarea;
        const estadoEvento = evento?.resource?.estado || evento?.estado;
        if (estadoEvento === 'HECHO' && idTarea) {
            try {
                const result = await api.get(`/actividades/insumos-tarea/${idTarea}`);
                setInsumosUsados(result.data);
            } catch (error) { console.error("Error insumos:", error); }
        }
    };

    const handleSelectSlot = ({ start }) => {
        setTareaEditar(null);
        setDatos({
            id_tipo_actividad: '', descripcion: '', fecha_programada: moment(start).format('YYYY-MM-DD'), 
            id_lote: '', id_usuario: '', estado: 'PENDIENTE', costo_mano_obra: '', jornada: 'COMPLETA'
        });
        setModalOpen(true);
    };

    const onNavigate = useCallback((d) => setFechaActual(d), [setFechaActual]);
    const onView = useCallback((v) => setVista(v), [setVista]);
    
    const eventStyleGetter = (event) => {
        let backgroundColor = '#ed6c02'; 
        if (event.resource.estado === 'HECHO') backgroundColor = '#2e7d32'; 
        if (event.resource.estado === 'NO REALIZADO') backgroundColor = '#d32f2f'; 
        return { style: { backgroundColor, borderRadius: '5px', opacity: 0.9, color: 'white', border: '0px', display: 'block' } };
    };

    return (
        <Box sx={{ pb: 5 }}> 
            <GlobalStyles styles={{ '.swal2-container': { zIndex: '2400 !important' } }} />
            
            {/* --- CALENDARIO --- */}
            <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column', mb: 5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>Calendario de Actividades</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#1b5e20' }} 
                    onClick={() => { setTareaEditar(null); 
                        // AHORA LIMPIAMOS AQUÍ MANUALMENTE
        setDatos({
            id_tipo_actividad: '', descripcion: '', 
            id_lote: '', id_usuario: '', estado: 'PENDIENTE', 
            costo_mano_obra: '', jornada: 'COMPLETA',
            fecha_programada: new Date().toLocaleDateString('en-CA') // Hoy
        });
        setModalOpen(true);}}>PROGRAMAR TAREA</Button>
                   
                </Box>
                 <div className="leyenda-container">
                        <div className="item-leyenda">
                            <span className="punto pendiente"></span>
                            <span>Pendiente</span>
                        </div>
                        <div className="item-leyenda">
                            <span className="punto hecho"></span>
                            <span>Realizado</span>
                        </div>
                        <div className="item-leyenda">
                            <span className="punto no-realizado"></span>
                            <span>No Realizado</span>
                        </div>
                    </div>
                <Box sx={{ flex: 1, bgcolor: 'white', p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Calendar
                        localizer={localizer} events={eventos} startAccessor="start" endAccessor="end" style={{ height: '100%' }}
                        messages={mensajesEspanol} culture='es' formats={formatosEspanol} date={fechaActual} onNavigate={onNavigate} view={vista} onView={onView}         
                        eventPropGetter={eventStyleGetter} onSelectEvent={handleSelectEvent} onSelectSlot={handleSelectSlot} selectable={true} views={['month', 'agenda']}
                        components={{ agenda: { time: CustomAgendaTime } }}
                    />
                </Box>
            </Box>
            <Divider sx={{ my: 4 }} />

            {/* --- NOTAS --- */}
            <Box>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#1b5e20', display: 'flex', alignItems: 'center' }}><PushPinIcon sx={{ mr: 1 }} /> Notas y Recordatorios</Typography>
                <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#f5f5f5' }}>
                    <TextField fullWidth variant="outlined" placeholder="Escribe una nota rápida..." size="small" value={nuevaNota} onChange={(e) => setNuevaNota(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleGuardarNota()} />
                    <Button variant="contained" color="success" startIcon={<NoteAddIcon />} onClick={handleGuardarNota}>AGREGAR</Button>
                </Paper>
                <Grid container spacing={2}>
                    {notas.map((nota) => (
                        <Grid item xs={12} sm={6} md={3} key={nota.id_nota}>
                            <Card sx={{ bgcolor: '#fff9c4', borderLeft: '5px solid #fbc02d', position: 'relative', boxShadow: 2 }}>
                                <CardContent>
                                    <Typography variant="body1" sx={{ fontWeight: '500', mb: 1 }}>{nota.contenido}</Typography>
                                    <Typography variant="caption" color="textSecondary">📅 {new Date(nota.fecha_creacion).toLocaleDateString()}</Typography>
                                    <IconButton size="small" sx={{ position: 'absolute', top: 5, right: 5, color: '#f57f17' }} onClick={() => handleEliminarNota(nota.id_nota)}><DeleteIcon fontSize="small" /></IconButton>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* --- MODAL DETALLE --- */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: '#1b5e20', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {tareaEditar ? (
                        <Box>
                            <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>Editar Actividad</Typography>
                            <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>👷‍♂️ {tareaEditar.resource.nombre_responsable} {tareaEditar.resource.apellido_responsable} &nbsp;|&nbsp; 📍 {tareaEditar.resource.origen}</Typography>
                        </Box>
                    ) : 'Nueva Tarea'}
                    <IconButton onClick={() => setModalOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                </DialogTitle>

               <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                        <TextField select fullWidth label="Tipo de Actividad" value={datos.id_tipo_actividad} onChange={(e) => setDatos({...datos, id_tipo_actividad: e.target.value})}>
                            {listas.tipos.map(t => <MenuItem key={t.id_tipo_actividad} value={t.id_tipo_actividad}>{t.nombre_tipo_actividad}</MenuItem>)}
                        </TextField>

                        <Box sx={{ display: 'flex', gap: 2 }}> 
                            <TextField fullWidth type="date" label="Fecha" InputLabelProps={{ shrink: true }} value={datos.fecha_programada} onChange={(e) => setDatos({...datos, fecha_programada: e.target.value})} />
                            <TextField select fullWidth label="Lote" value={datos.id_lote} onChange={(e) => setDatos({...datos, id_lote: e.target.value})}>
                                {listas.lotes.map(l => <MenuItem key={l.id_lote} value={l.id_lote}>{l.nombre_lote} - {l.nombre_variedad || 'Sin Cultivo'}</MenuItem>)}
                            </TextField>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField select fullWidth label="Responsable" value={datos.id_usuario} onChange={(e) => setDatos({...datos, id_usuario: e.target.value})}>
                                {listas.usuarios.map(u => <MenuItem key={u.id_usuario} value={u.id_usuario}>{u.nombre} {u.apellido}</MenuItem>)}
                            </TextField>
                            <TextField fullWidth label="Costo M.O" type="number" value={datos.costo_mano_obra} onChange={(e) => setDatos({...datos, costo_mano_obra: e.target.value})} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} placeholder="0" />
                            <TextField select fullWidth label="Jornada" value={datos.jornada} onChange={(e) => setDatos({ ...datos, jornada: e.target.value })}>
                                <MenuItem value="COMPLETA">Completa ☀️</MenuItem><MenuItem value="MANANA">Mañana 🌅</MenuItem><MenuItem value="TARDE">Tarde 🌇</MenuItem>
                            </TextField>
                        </Box>

                        {/* SELECTOR DE ESTADO */}
                        {tareaEditar && (
                             <TextField 
                                select 
                                fullWidth 
                                label="Estado de la Tarea" 
                                value={datos.estado} 
                                onChange={(e) => setDatos({...datos, estado: e.target.value})} 
                                sx={{ bgcolor: datos.estado === 'HECHO' ? '#e8f5e9' : '#fff3e0' }}
                            >
                                <MenuItem value="PENDIENTE">PENDIENTE ⏳</MenuItem>
                                <MenuItem value="HECHO">HECHO ✅</MenuItem>
                                {datos.estado === 'NO REALIZADO' && (
                                    <MenuItem value="NO REALIZADO" disabled>NO REALIZADO 🛑</MenuItem>
                                )}
                            </TextField>
                        )}

                        <TextField fullWidth multiline rows={3} label="Observaciones" value={datos.descripcion} onChange={(e) => setDatos({...datos, descripcion: e.target.value})} />
                        
                        {/* TABLA DE INSUMOS */}
                        {datos.estado === 'HECHO' && insumosUsados.length > 0 && (
                            <Box sx={{ mt: 3, p: 2, bgcolor: '#f1f8e9', borderRadius: 2, border: '1px solid #c5e1a5' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#33691e', mb: 1 }}>🧪 Insumos Aplicados</Typography>
                                <Table size="small">
                                    <TableHead><TableRow><TableCell><b>Producto</b></TableCell><TableCell><b>Categoría</b></TableCell><TableCell align="right"><b>Dosis</b></TableCell></TableRow></TableHead>
                                    <TableBody>{insumosUsados.map((item, i) => (<TableRow key={i}><TableCell>{item.nombre_insumo}</TableCell><TableCell><Chip label={item.nombre_categoria} size="small" variant="outlined" /></TableCell><TableCell align="right" sx={{ fontWeight: 'bold' }}>{item.cantidad_usada} {item.unidad_medida}</TableCell></TableRow>))}</TableBody>
                                </Table>
                            </Box>
                        )}
                        {datos.estado === 'HECHO' && insumosUsados.length === 0 && (
                             <Typography variant="caption" sx={{ mt: 1, display: 'block', fontStyle: 'italic', color: 'gray' }}>* Tarea marcada como HECHO sin consumo de insumos (Manual o Labor sin insumos).</Typography>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                    {tareaEditar && datos.estado === 'PENDIENTE' ? (
                        <Button startIcon={<CancelIcon />} color="error" variant="outlined" onClick={() => setModalMotivoOpen(true)}>Marcar como NO REALIZADO</Button>
                    ) : <Box></Box>}

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button onClick={() => setModalOpen(false)} color="inherit">Cancelar</Button>
                        <Button variant="contained" onClick={handleGuardar} sx={{ bgcolor: '#1b5e20' }}>{tareaEditar ? 'Actualizar' : 'Guardar'}</Button>
                    </Box>
                </DialogActions>
            </Dialog>

            {/* MODAL MOTIVO */}
            <Dialog open={modalMotivoOpen} onClose={() => setModalMotivoOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#d32f2f', color: 'white' }}>🛑 Tarea No Realizada</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mt: 2, mb: 1 }}>Motivo (Lluvia, Enfermedad, etc.):</Typography>
                    <TextField autoFocus fullWidth multiline rows={3} variant="outlined" placeholder="Ej: Lluvias torrenciales..." value={motivoNoRealizado} onChange={(e) => setMotivoNoRealizado(e.target.value)} />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setModalMotivoOpen(false)} color="inherit">Atrás</Button>
                    <Button onClick={handleConfirmarNoRealizado} variant="contained" sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>Confirmar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
export default Calendario;