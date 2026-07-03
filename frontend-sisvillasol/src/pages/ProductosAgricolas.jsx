import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TablePagination,
  GlobalStyles,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import Swal from "sweetalert2";

import api from "../services/api";
import NuevoProductoAgricolaModal from "../components/NuevoProductoAgricolaModal";

function ProductosAgricolas() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const response = await api.get("/productos-agricolas");

      setProductos(response.data);
    } catch (error) {
      console.error(error);

      Swal.fire("Error", "No fue posible cargar los productos.", "error");
    }
  };

  const handleEliminar = async (id, nombre) => {
    Swal.fire({
      title: "¿Desactivar producto?",
      text: `${nombre} dejará de estar disponible para nuevas facturas.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#1b5e20",
      confirmButtonText: "Sí, desactivar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await api.delete(`/productos-agricolas/${id}`);

        Swal.fire("Correcto", "Producto desactivado.", "success");

        cargarProductos();
      } catch (error) {
        console.error(error);

        Swal.fire("Error", "No fue posible desactivar el producto.", "error");
      }
    });
  };

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <Box>
      <GlobalStyles
        styles={{
          ".swal2-container": {
            zIndex: "2400 !important",
          },
        }}
      />

      <Typography
        variant="h4"
        sx={{
          mb: 4,
          fontWeight: "bold",
          color: "#1b5e20",
        }}
      >
        Gestión de Productos Agrícolas
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <TextField
          placeholder="Buscar producto..."
          size="small"
          sx={{
            width: 350,
            bgcolor: "white",
          }}
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="contained"
          startIcon={<Inventory2Icon />}
          sx={{
            bgcolor: "#1b5e20",
            "&:hover": {
              bgcolor: "#2e7d32",
            },
          }}
          onClick={() => {
            setProductoEditar(null);

            setModalOpen(true);
          }}
        >
          NUEVO PRODUCTO
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          boxShadow: 2,
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Producto</TableCell>

              <TableCell sx={{ fontWeight: "bold" }}>Unidad</TableCell>

              <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>

              <TableCell sx={{ fontWeight: "bold" }}>Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {productosFiltrados
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.nombre}</TableCell>

                  <TableCell>{row.unidad}</TableCell>

                  <TableCell>
                    <Chip
                      label={row.activo ? "ACTIVO" : "INACTIVO"}
                      color={row.activo ? "success" : "error"}
                      size="small"
                      sx={{
                        fontWeight: "bold",
                        minWidth: 80,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        setProductoEditar(row);

                        setModalOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>

                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleEliminar(row.id, row.nombre)}
                    >
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
        count={productosFiltrados.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));

          setPage(0);
        }}
        labelRowsPerPage="Productos por página:"
      />

      <NuevoProductoAgricolaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={cargarProductos}
        productoEditar={productoEditar}
      />
    </Box>
  );
}

export default ProductosAgricolas;
