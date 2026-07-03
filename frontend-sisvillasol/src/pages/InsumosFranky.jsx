import { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

import Swal from "sweetalert2";

import api from "../services/api";

import FacturaTable from "../components/insumosFranky/FacturaTable";
import FacturaForm from "../components/insumosFranky/FacturaForm";
import KPIs from "../components/insumosFranky/KPIs";
import FacturaDetalleDialog from "../components/insumosFranky/FacturaDetalleDialog";

function InsumosFranky() {
  const [buscar, setBuscar] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [anios, setAnios] = useState([]);

  const [anioSeleccionado, setAnioSeleccionado] = useState("");

  const [facturas, setFacturas] = useState([]);
  const [graficoMensual, setGraficoMensual] = useState([]);
  const [kpis, setKpis] = useState({});
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [facturaEditar, setFacturaEditar] = useState(null);
  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const datosGrafico = meses.map((mes, indice) => {
    const registro = graficoMensual.find((item) => item.mes === indice + 1);

    return {
      mes,

      total: registro ? Number(registro.total) : 0,
    };
  });
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));

    setPage(0);
  };
  const verFactura = async (id) => {
    try {
      const response = await api.get(`/insumos-agricultor/${id}`);

      setFacturaSeleccionada(response.data);

      setDetalleOpen(true);
    } catch (error) {
      console.error(error);

      Swal.fire("Error", "No fue posible consultar la factura.", "error");
    }
  };
  /*===================================================
        OBTENER AÑOS
    ===================================================*/

  const obtenerAnios = async () => {
    try {
      const response = await api.get("/insumos-agricultor/anios");

      setAnios(response.data);

      if (response.data.length > 0) {
        setAnioSeleccionado(response.data[0].anio);
      }
    } catch (error) {
      console.error(error);

      Swal.fire(
        "Error",
        "No fue posible cargar los años registrados.",
        "error",
      );
    }
  };

  /*===================================================
        OBTENER FACTURAS
    ===================================================*/

  const obtenerFacturas = async (anio) => {
    try {
      const response = await api.get("/insumos-agricultor", {
        params: {
          anio,
        },
      });

      setFacturas(response.data.facturas);

      setKpis(response.data.kpis);
      setGraficoMensual(response.data.graficoMensual);
    } catch (error) {
      console.error(error);

      Swal.fire("Error", "No fue posible cargar las facturas.", "error");
    }
  };

  /*===================================================
        CARGAR AÑOS
    ===================================================*/

  useEffect(() => {
    obtenerAnios();
  }, []);

  /*===================================================
        CAMBIO DE AÑO
    ===================================================*/

  useEffect(() => {
    if (anioSeleccionado !== "") {
      obtenerFacturas(anioSeleccionado);
    }
  }, [anioSeleccionado]);

  /*===================================================
        BUSCADOR
    ===================================================*/

  const facturasFiltradas = facturas.filter((item) => {
    const texto = buscar.toLowerCase();

    return (
      item.numero_factura?.toLowerCase().includes(texto) ||
      item.proveedor?.toLowerCase().includes(texto) ||
      item.agricultor?.toLowerCase().includes(texto) ||
      item.lote?.toLowerCase().includes(texto)
    );
  });
  /*===================================================
GUARDAR FACTURA
===================================================*/

  const guardarFactura = async (datosFactura) => {
    try {
      console.log("datosFactura", datosFactura);

      if (datosFactura.id) {
        console.log("ENTRA A PUT");

        await api.put(`/insumos-agricultor/${datosFactura.id}`, datosFactura);
      } else {
        console.log("ENTRA A POST");

        await api.post("/insumos-agricultor", datosFactura);
      }

      Swal.fire({
        icon: "success",
        title: datosFactura.id
          ? "Factura actualizada correctamente"
          : "Factura registrada correctamente",
        text: datosFactura.id
          ? "La factura fue actualizada exitosamente."
          : "La factura fue almacenada exitosamente.",
        confirmButtonColor: "#2e7d32",
      });

      setFacturaEditar(null);

      setModalOpen(false);

      obtenerFacturas(anioSeleccionado);
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.mensaje ||
          "No fue posible registrar la factura.",
      });
    }
  };

  const editarFactura = async (id) => {
    try {
      const response = await api.get(`/insumos-agricultor/${id}`);

      setFacturaEditar(response.data);

      setModalOpen(true);
    } catch (error) {
      console.error(error);

      Swal.fire("Error", "No fue posible cargar la factura.", "error");
    }
  };

  /*===================================================
ELIMINAR FACTURA
===================================================*/

  const eliminarFactura = async (factura) => {
    const confirmar = await Swal.fire({
      title: `¿Eliminar la factura ${factura.numero_factura}?`,

      html: `
            <div style="text-align:left">

                <p><strong>Proveedor:</strong> ${factura.proveedor}</p>

                <p><strong>Fecha:</strong> ${new Date(factura.fecha).toLocaleDateString("es-CO")}</p>

                <p><strong>Total:</strong>
                    ${Number(factura.total).toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                    })}
                </p>

                <hr>

                <p style="color:#d32f2f;font-weight:bold;">
                    Esta acción eliminará permanentemente la factura y todos sus productos asociados.
                </p>

            </div>
        `,

      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Sí, eliminar",

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#d32f2f",

      cancelButtonColor: "#1976d2",

      reverseButtons: true,
    });

    if (!confirmar.isConfirmed) return;

    try {
      await api.delete(`/insumos-agricultor/${factura.id}`);

      Swal.fire({
        icon: "success",

        title: "Factura eliminada",

        text: `La factura ${factura.numero_factura} fue eliminada correctamente.`,

        timer: 1800,

        showConfirmButton: false,
      });

      obtenerFacturas(anioSeleccionado);
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",

        title: "Error",

        text:
          error.response?.data?.mensaje ||
          "No fue posible eliminar la factura.",
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Gestión de Insumos del Agricultor
      </Typography>

      <KPIs kpis={kpis} />
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mt: 3,
          borderRadius: 3,
        }}
      >
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Facturación mensual de insumos
        </Typography>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={datosGrafico}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="mes" />

            <YAxis />

            <Tooltip
              formatter={(valor) => [
                Number(valor).toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                }),
                "Facturación",
              ]}
              labelFormatter={(mes) => `Mes: ${mes}`}
            />

            <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mt: 3,
          mb: 3,
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar factura..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          sx={{ width: 320 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <FormControl
          size="small"
          sx={{
            width: 180,
          }}
        >
          <InputLabel>Año</InputLabel>

          <Select
            value={anioSeleccionado}
            label="Año"
            onChange={(e) => setAnioSeleccionado(e.target.value)}
          >
            {anios.map((item) => (
              <MenuItem key={item.anio} value={item.anio}>
                {item.anio}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setFacturaEditar(null);
            setModalOpen(true);
          }}
        >
          Nueva Factura
        </Button>
      </Paper>

      <Paper elevation={2}>
        <FacturaTable
          facturas={facturasFiltradas}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          onVer={verFactura}
          onEditar={editarFactura}
          onEliminar={eliminarFactura}
        />
      </Paper>

      <FacturaForm
        open={modalOpen}
        onClose={() => {
          setFacturaEditar(null);

          setModalOpen(false);
        }}
        onGuardar={guardarFactura}
        facturaEditar={facturaEditar}
      />
      <FacturaDetalleDialog
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        factura={facturaSeleccionada}
      />
    </Box>
  );
}

export default InsumosFranky;
