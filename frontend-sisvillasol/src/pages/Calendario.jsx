import { useEffect, useState, useCallback } from 'react';
import { 
    Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
    DialogActions, TextField, MenuItem, InputAdornment, IconButton, 
    Grid, Card, CardContent, Paper, Divider 
} from '@mui/material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/dist/locale/es'; 
import 'react-big-calendar/lib/css/react-big-calendar.css';

// ÍCONOS
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close'; 
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';

import api from '../services/api';

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
// Este componente decide qué mostrar en la columna "Hora" de la Agenda
const CustomAgendaTime = ({ event }) => {
    const jornada = event.resource.jornada;
    
    if (jornada === 'MANANA') {
        return <span style={{ color: '#f57c00', fontWeight: 'bold' }}>🌅 Mañana</span>;
    }
    if (jornada === 'TARDE') {
        return <span style={{ color: '#5d4037', fontWeight: 'bold' }}>🌇 Tarde</span>;
    }
    // Por defecto (COMPLETA)
    return <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>☀️ Todo el día</span>;
};
function Calendario() {
    // --- ESTADOS DEL CALENDARIO ---
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

    // --- ESTADOS DE LAS NOTAS ---
    const [notas, setNotas] = useState([]);
    const [nuevaNota, setNuevaNota] = useState('');

    useEffect(() => {
        cargarDatos();
        cargarListas();
        cargarNotas(); // <--- Cargar notas al inicio
    }, []);

    useEffect(() => {
        if (tareaEditar) {
            // Simplemente cortamos el string. Si es "2026-01-15T00:00:00.000Z", nos quedamos con "2026-01-15"
        const fechaRaw = tareaEditar.resource.fecha_programada;
        const fechaSimple = fechaRaw ? fechaRaw.split('T')[0] : '';
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
        } else {
            setDatos(prev => ({ 
                ...prev, 
                id_tipo_actividad: '', descripcion: '', 
                id_lote: '', id_usuario: '', estado: 'PENDIENTE', costo_mano_obra: '', jornada: 'COMPLETA' 
            }));
        }
    }, [tareaEditar, modalOpen]);

    // --- FUNCIONES DE CARGA ---
 const cargarDatos = async () => {
        try {
            const res = await api.get('/actividades');
            
            const eventosFormatoCalendario = res.data.map(tarea => {
                // TRUCO INFALIBLE:
                // 1. Tomamos solo la parte de la fecha "2026-01-01" (quitamos la hora si viene)
                const fechaString = tarea.fecha_programada.split('T')[0];
                
                // 2. La partimos en [año, mes, dia]
                const [anio, mes, dia] = fechaString.split('-');

                // 3. Creamos la fecha localmente. 
                // OJO: En Javascript los meses van de 0 a 11 (Enero es 0), por eso restamos 1 al mes.
                const fechaFixed = new Date(anio, mes - 1, dia);

                return {
                    title: `${tarea.nombre_tipo_actividad || 'Tarea'} - ${tarea.nombre_lote || 'Sin Lote'} (${tarea.nombre_responsable || '?'})`,
                    // AQUÍ ESTÁ EL CAMBIO: Usamos 'fechaFixed' en lugar de crear una nueva Date
                    start: fechaFixed, 
                    end: fechaFixed,   
                    allDay: true, 
                    resource: tarea 
                };
            });
            setEventos(eventosFormatoCalendario);
        } catch (error) { console.error("Error cargando calendario:", error); }
    };

    const cargarListas = async () => {
        try {
            const res = await api.get('/actividades/datos-formulario');
            setListas(res.data);
        } catch (error) { console.error("Error cargando listas:", error); }
    };

    // --- FUNCIONES DE NOTAS ---
    const cargarNotas = async () => {
        try {
            const res = await api.get('/notas');
            setNotas(res.data);
        } catch (error) { console.error("Error cargando notas:", error); }
    };

    const handleGuardarNota = async () => {
        if (!nuevaNota.trim()) return;
        try {
            await api.post('/notas', { contenido: nuevaNota });
            setNuevaNota(''); // Limpiar campo
            cargarNotas();    // Recargar lista
        } catch (error) { console.error(error); alert('Error al guardar nota'); }
    };

    const handleEliminarNota = async (id) => {
        if (!window.confirm('¿Borrar esta nota?')) return;
        try {
            await api.delete(`/notas/${id}`);
            cargarNotas();
        } catch (error) { console.error(error); }
    };

    // --- FUNCIONES DEL CALENDARIO ---
    const handleGuardar = async () => {
        if(!datos.id_tipo_actividad || !datos.fecha_programada || !datos.id_lote) {
            alert("Por favor completa los campos obligatorios ⚠️");
            return;
        }
        try {
            if (tareaEditar) {
                await api.put(`/actividades/${tareaEditar.resource.id_tarea}`, datos);
                alert('¡Tarea actualizada! 📝');
            } else {
                await api.post('/actividades', datos);
                alert('¡Tarea programada! 📅');
            }
            setModalOpen(false);
            setTareaEditar(null);
            cargarDatos();
        } catch (error) { console.error(error); alert('Error al guardar'); }
    };

    const handleSelectEvent = (evento) => { setTareaEditar(evento); setModalOpen(true); };
    const handleSelectSlot = ({ start }) => {
        setTareaEditar(null);
        setDatos({
            id_tipo_actividad: '', descripcion: '', 
            fecha_programada: moment(start).format('YYYY-MM-DD'), 
            id_lote: '', id_usuario: '', estado: 'PENDIENTE', costo_mano_obra: '', jornada: 'COMPLETA'
        });
        setModalOpen(true);
    };

    const onNavigate = useCallback((newDate) => setFechaActual(newDate), [setFechaActual]);
    const onView = useCallback((newView) => setVista(newView), [setVista]);
    const eventStyleGetter = (event) => {
        let backgroundColor = '#ed6c02'; 
        if (event.resource.estado === 'HECHO') backgroundColor = '#2e7d32'; 
        if (event.resource.estado === 'EN_PROCESO') backgroundColor = '#0288d1'; 
        return { style: { backgroundColor, borderRadius: '5px', opacity: 0.8, color: 'white', border: '0px', display: 'block' } };
    };

    return (
        <Box sx={{ pb: 5 }}> {/* Padding bottom para que no quede pegado al final */}
            
            {/* --- SECCIÓN 1: CALENDARIO --- */}
            <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column', mb: 5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>
                        Calendario de Actividades
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#1b5e20' }} onClick={() => { setTareaEditar(null); setModalOpen(true); }}>
                        PROGRAMAR TAREA
                    </Button>
                </Box>

                <Box sx={{ flex: 1, bgcolor: 'white', p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Calendar
                        localizer={localizer}
                        events={eventos}
                        startAccessor="start" endAccessor="end"
                        style={{ height: '100%' }}
                        messages={mensajesEspanol} culture='es' formats={formatosEspanol}
                        date={fechaActual} onNavigate={onNavigate} view={vista} onView={onView}         
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleSelectEvent} onSelectSlot={handleSelectSlot}
                        selectable={true} views={['month', 'agenda']}
                        components={{
                            agenda: {
                            time: CustomAgendaTime, // <--- Aquí le decimos que use nuestro diseño
                            }
                        }}
                    />
                </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* --- SECCIÓN 2: NOTAS Y RECORDATORIOS --- */}
            <Box>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#1b5e20', display: 'flex', alignItems: 'center' }}>
                    <PushPinIcon sx={{ mr: 1 }} /> Notas y Recordatorios
                </Typography>

                {/* CAMPO PARA AGREGAR NOTA */}
                <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#f5f5f5' }}>
                    <TextField 
                        fullWidth 
                        variant="outlined" 
                        placeholder="Escribe una nota rápida... (Ej: Comprar abono el viernes)" 
                        size="small"
                        value={nuevaNota}
                        onChange={(e) => setNuevaNota(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleGuardarNota()}
                    />
                    <Button 
                        variant="contained" 
                        color="success" 
                        startIcon={<NoteAddIcon />}
                        onClick={handleGuardarNota}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        AGREGAR NOTA
                    </Button>
                </Paper>

                {/* LISTA DE NOTAS (GRID) */}
                <Grid container spacing={2}>
                    {notas.map((nota) => (
                        <Grid item xs={12} sm={6} md={3} key={nota.id_nota}>
                            <Card sx={{ 
                                bgcolor: '#fff9c4', // Color amarillito tipo Post-it
                                borderLeft: '5px solid #fbc02d',
                                position: 'relative',
                                boxShadow: 2
                            }}>
                                <CardContent>
                                    <Typography variant="body1" sx={{ fontWeight: '500', mb: 1 }}>
                                        {nota.contenido}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        📅 {new Date(nota.fecha_creacion).toLocaleDateString()}
                                    </Typography>
                                    
                                    {/* Botón Eliminar Nota */}
                                    <IconButton 
                                        size="small" 
                                        sx={{ position: 'absolute', top: 5, right: 5, color: '#f57f17' }}
                                        onClick={() => handleEliminarNota(nota.id_nota)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {notas.length === 0 && (
                        <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
                                No hay notas pendientes. ¡Agrega una arriba! 📝
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </Box>

            {/* --- MODAL (El que ya arreglamos) --- */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: '#1b5e20', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {tareaEditar ? (
                        <Box>
                            <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>Editar Actividad</Typography>
                            <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
                                👷‍♂️ {tareaEditar.resource.nombre_responsable} {tareaEditar.resource.apellido_responsable} &nbsp;|&nbsp; 📍 Origen: {tareaEditar.resource.origen}
                            </Typography>
                        </Box>
                    ) : 'Nueva Tarea de Campo'}
                    <IconButton onClick={() => setModalOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                </DialogTitle>

               <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                        
                        {/* 1. TIPO DE ACTIVIDAD (Este era el que se te había borrado) */}
                        <TextField 
                            select 
                            fullWidth 
                            label="Tipo de Actividad" 
                            value={datos.id_tipo_actividad} 
                            onChange={(e) => setDatos({...datos, id_tipo_actividad: e.target.value})}
                        >
                            {listas.tipos.map(t => (
                                <MenuItem key={t.id_tipo_actividad} value={t.id_tipo_actividad}>
                                    {t.nombre_tipo_actividad}
                                </MenuItem>
                            ))}
                        </TextField>

                        {/* 2. FILA DE FECHA Y LOTE (Aquí va el Lote corregido con Cultivo) */}
                        <Box sx={{ display: 'flex', gap: 2 }}> 
                            <TextField 
                                fullWidth 
                                type="date" 
                                label="Fecha Programada" 
                                InputLabelProps={{ shrink: true }} 
                                value={datos.fecha_programada} 
                                onChange={(e) => setDatos({...datos, fecha_programada: e.target.value})} 
                            />
                            
                            <TextField 
                                select 
                                fullWidth 
                                label="Lote de Trabajo" 
                                value={datos.id_lote} 
                                onChange={(e) => setDatos({...datos, id_lote: e.target.value})}
                            >
                                {listas.lotes.map(l => (
                                    <MenuItem key={l.id_lote} value={l.id_lote}>
                                        {/* AHORA SÍ: Muestra Lote - Cultivo */}
                                        {l.nombre_lote} - {l.nombre_cultivo || 'Sin Cultivo'}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        
                        {/* 3. FILA DE RESPONSABLE Y COSTO */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField 
                                select 
                                fullWidth 
                                label="Responsable" 
                                value={datos.id_usuario} 
                                onChange={(e) => setDatos({...datos, id_usuario: e.target.value})}
                            >
                                {listas.usuarios.map(u => (
                                    <MenuItem key={u.id_usuario} value={u.id_usuario}>
                                        {u.nombre} {u.apellido}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField 
                                fullWidth 
                                label="Costo Mano de Obra" 
                                type="number" 
                                value={datos.costo_mano_obra} 
                                onChange={(e) => setDatos({...datos, costo_mano_obra: e.target.value})} 
                                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} 
                                placeholder="0" 
                            />
                            <TextField
                            select
                            fullWidth
                            label="Jornada Laboral"
                            value={datos.jornada}
                            onChange={(e) => setDatos({ ...datos, jornada: e.target.value })}
                            >
                            <MenuItem value="COMPLETA">Jornada Completa ☀️</MenuItem>
                            <MenuItem value="MANANA">Media - Mañana 🌅</MenuItem>
                            <MenuItem value="TARDE">Media - Tarde 🌇</MenuItem>
                            </TextField>
                        </Box>

                        {/* 4. ESTADO (Solo si se edita) */}
                        {tareaEditar && (
                            <TextField 
                                select 
                                fullWidth 
                                label="Estado Actual" 
                                value={datos.estado} 
                                onChange={(e) => setDatos({...datos, estado: e.target.value})} 
                                sx={{ bgcolor: datos.estado === 'HECHO' ? '#e8f5e9' : '#fff3e0' }}
                            >
                                <MenuItem value="PENDIENTE">PENDIENTE ⏳</MenuItem>
                                <MenuItem value="HECHO">HECHO ✅</MenuItem>
                            </TextField>
                        )}

                        {/* 5. OBSERVACIONES */}
                        <TextField 
                            fullWidth 
                            multiline 
                            rows={3} 
                            label="Observaciones" 
                            value={datos.descripcion} 
                            onChange={(e) => setDatos({...datos, descripcion: e.target.value})} 
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setModalOpen(false)} color="error" variant="outlined">Cancelar</Button>
                    <Button variant="contained" onClick={handleGuardar} sx={{ bgcolor: '#1b5e20' }}>{tareaEditar ? 'Actualizar Tarea' : 'Guardar Tarea'}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Calendario;