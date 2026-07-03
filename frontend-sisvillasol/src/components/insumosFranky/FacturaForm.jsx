import { useState } from "react";
import { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  Autocomplete,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Divider,
} from "@mui/material";
import api from "../../services/api";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Swal from "sweetalert2";
export default function FacturaForm({
  open,
  onClose,
  onGuardar,
  facturaEditar,
}) {
  const [productos, setProductos] = useState([
    {
      producto_id: null,
      producto: "",
      cantidad: "",
      unidad: "",
      valor_unitario: "",
      subtotal: 0,
    },
  ]);
  const [catalogoProductos, setCatalogoProductos] = useState([]);
  useEffect(() => {
    cargarProductosAgricolas();
  }, []);

  const cargarProductosAgricolas = async () => {
    try {
      const response = await api.get("/productos-agricolas");

      setCatalogoProductos(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  const [factura, setFactura] = useState({
    id: null,
    numero_factura: "",
    fecha: "",
    hora: "",
    proveedor: "",

    cliente: "Franky Johany Florez Vera",

    documento: "880339432",

    agricultor: "Franky Johany Florez Vera",

    lote: "Lote 9 Duraznos Gran Jarillo",

    direccion: "",

    ciudad: "",

    forma_pago: "Contado",

    medio_pago: "Efectivo",

    observaciones: "",
  });
  const limpiarFormulario = () => {
    setFactura({
      id: null,

      numero_factura: "FEMA ",

      fecha: "",

      hora: "",

      proveedor: "AGROPECUARIA MUNDO AGRICOLA DE CHITAGÁ",

      cliente: "Franky Johany Florez Vera",

      documento: "880339432",

      agricultor: "Franky Johany Florez Vera",

      lote: "Lote 9 Duraznos Gran Jarillo",

      direccion: "URBANIZACION HERMAN LENIN SOLANO",

      ciudad: "CHITAGÁ, NORTE DE SANTANDER",

      forma_pago: "Contado",

      medio_pago: "Efectivo",

      observaciones: "",
    });

    setProductos([
      {
        producto: "",
        cantidad: "",
        unidad: "",
        valor_unitario: "",
        subtotal: 0,
      },
    ]);
  };
  useEffect(() => {
    if (!open) return; // ← no hacer nada si el modal está cerrado

    if (facturaEditar) {
      setFactura({
        id: facturaEditar.id,
        numero_factura: facturaEditar.numero_factura,
        fecha: facturaEditar.fecha.substring(0, 10),
        hora: facturaEditar.hora,
        proveedor: facturaEditar.proveedor,
        cliente: facturaEditar.cliente,
        documento: facturaEditar.documento,
        agricultor: facturaEditar.agricultor,
        lote: facturaEditar.lote,
        direccion: facturaEditar.direccion,
        ciudad: facturaEditar.ciudad,
        forma_pago: facturaEditar.forma_pago,
        medio_pago: facturaEditar.medio_pago,
        observaciones: facturaEditar.observaciones || "",
      });
      setProductos(
        facturaEditar.detalle.map((item) => ({
          producto: item.producto,
          cantidad: item.cantidad,
          unidad: item.unidad,
          valor_unitario: item.valor_unitario,
          subtotal: item.subtotal,
        })),
      );
    } else {
      limpiarFormulario(); // ← esto se ejecuta al abrir con facturaEditar = null
    }
  }, [facturaEditar, open]); // ← ahora escucha AMBOS
  const cambiarCampo = (e) => {
    const { name, value } = e.target;

    setFactura((prev) => ({
      ...prev,

      [name]: value,
    }));
  };
  const agregarFila = () => {
    setProductos([
      ...productos,
      {
        producto: null,
        cantidad: "",
        unidad: "",
        valor_unitario: "",
        subtotal: 0,
      },
    ]);
  };

  const eliminarFila = (index) => {
    const copia = [...productos];
    copia.splice(index, 1);
    setProductos(copia);
  };

  const actualizarProducto = (index, cambios) => {
    const copia = [...productos];

    const fila = {
      ...copia[index],
      ...cambios,
    };

    const cantidad = Number(fila.cantidad || 0);

    const valorUnitario = Number(fila.valor_unitario || 0);

    fila.subtotal = cantidad * valorUnitario;

    copia[index] = fila;

    setProductos(copia);
  };
  const total = productos.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0,
  );
  const datosFactura = {
    ...factura,

    total,

    detalle: productos.map((item) => ({
      producto_id: item.producto_id,

      cantidad: Number(item.cantidad),

      valor_unitario: Number(item.valor_unitario),

      subtotal: Number(item.subtotal),
    })),
  };
  const guardar = () => {
    if (!factura.numero_factura.trim()) {
      return Swal.fire(
        "Número de factura",
        "Debe ingresar el número de la factura.",
        "warning",
      );
    }

    if (!factura.fecha) {
      return Swal.fire("Fecha", "Debe seleccionar una fecha.", "warning");
    }

    if (!factura.proveedor.trim()) {
      return Swal.fire("Proveedor", "Debe ingresar el proveedor.", "warning");
    }

    if (productos.length === 0) {
      return Swal.fire(
        "Productos",
        "Debe agregar al menos un producto.",
        "warning",
      );
    }

    const productoVacio = productos.some(
      (p) =>
        !p.producto || Number(p.cantidad) <= 0 || Number(p.valor_unitario) <= 0,
    );

    if (productoVacio) {
      return Swal.fire("Detalle", "Existe un producto incompleto.", "warning");
    }

    onGuardar(datosFactura);
  };

  const cerrarFormulario = () => {
    limpiarFormulario();

    onClose();
  };
  return (
    <Dialog open={open} maxWidth="xl" fullWidth onClose={cerrarFormulario}>
      <DialogTitle>
        {facturaEditar
          ? "Editar Factura de Insumos"
          : "Registrar Factura de Insumos"}
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Factura"
              name="numero_factura"
              value={factura.numero_factura}
              onChange={cambiarCampo}
            />
          </Grid>

          <Grid item xs={3}>
            <TextField
              fullWidth
              type="date"
              label="Fecha"
              name="fecha"
              value={factura.fecha}
              onChange={cambiarCampo}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={3}>
            <TextField
              fullWidth
              type="time"
              label="Hora"
              name="hora"
              value={factura.hora}
              onChange={cambiarCampo}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Proveedor"
              name="proveedor"
              value={factura.proveedor}
              onChange={cambiarCampo}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Cliente"
              name="cliente"
              value={factura.cliente}
              onChange={cambiarCampo}
            />
          </Grid>

          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Documento"
              name="documento"
              value={factura.documento}
              onChange={cambiarCampo}
            />
          </Grid>

          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Lote"
              name="lote"
              value={factura.lote}
              onChange={cambiarCampo}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Forma de Pago"
              name="forma_pago"
              value={factura.forma_pago}
              onChange={cambiarCampo}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Medio de Pago"
              name="medio_pago"
              value={factura.medio_pago}
              onChange={cambiarCampo}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observaciones"
              name="observaciones"
              value={factura.observaciones}
              onChange={cambiarCampo}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" mb={2}>
          Detalle de Productos
        </Typography>

        <Paper variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="40%">Producto</TableCell>

                <TableCell>Cantidad</TableCell>

                <TableCell>Unidad</TableCell>

                <TableCell>Valor Unitario</TableCell>

                <TableCell>Subtotal</TableCell>

                <TableCell></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {productos.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Autocomplete
                      size="small"
                      options={catalogoProductos}
                      getOptionLabel={(option) => option.nombre || ""}
                      value={
                        catalogoProductos.find(
                          (p) => p.id === item.producto_id,
                        ) || null
                      }
                      onChange={(event, value) => {
                        actualizarProducto(index, {
                          producto_id: value?.id || null,

                          producto: value?.nombre || "",

                          unidad: value?.unidad || "",
                        });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Buscar producto..."
                        />
                      )}
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      value={item.cantidad}
                      onChange={(e) =>
                        actualizarProducto(index, {
                          cantidad: e.target.value,
                        })
                      }
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Unidad"
                      value={item.unidad}
                      onChange={(e) =>
                        actualizarProducto(index, "unidad", e.target.value)
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      value={item.valor_unitario}
                      onChange={(e) =>
                        actualizarProducto(index, {
                          valor_unitario: e.target.value,
                        })
                      }
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    <Typography fontWeight="bold">
                      ${item.subtotal.toLocaleString("es-CO")}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <IconButton
                      color="error"
                      onClick={() => eliminarFila(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        <Button
          sx={{ mt: 2 }}
          startIcon={<AddIcon />}
          variant="outlined"
          onClick={agregarFila}
        >
          Agregar Producto
        </Button>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h4" textAlign="right" mt={4} fontWeight="bold">
          TOTAL: ${total.toLocaleString("es-CO")}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={cerrarFormulario}>Cancelar</Button>

        <Button variant="contained" onClick={guardar}>
          {facturaEditar ? "Actualizar Factura" : "Guardar Factura"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
