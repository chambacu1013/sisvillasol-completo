import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  IconButton,
  FormControlLabel,
  Switch,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import Swal from "sweetalert2";
import api from "../services/api";

const NuevoProductoAgricolaModal = ({
  open,
  onClose,
  productoEditar,
  onSuccess,
}) => {
  const [datos, setDatos] = useState({
    nombre: "",
    unidad: "",
    activo: true,
  });

  useEffect(() => {
    if (productoEditar) {
      setDatos({
        nombre: productoEditar.nombre || "",
        unidad: productoEditar.unidad || "",
        activo: productoEditar.activo,
      });
    } else {
      setDatos({
        nombre: "",
        unidad: "",
        activo: true,
      });
    }
  }, [productoEditar, open]);

  const handleGuardar = async () => {
    if (!datos.nombre || !datos.unidad) {
      Swal.fire({
        icon: "warning",
        title: "Faltan datos",
        text: "Debe ingresar el nombre y la unidad del producto.",
        confirmButtonColor: "#ff9800",
      });

      return;
    }

    try {
      if (productoEditar) {
        await api.put(`/productos-agricolas/${productoEditar.id}`, datos);

        Swal.fire({
          icon: "success",
          title: "Producto actualizado",
          text: "La información fue modificada correctamente.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await api.post("/productos-agricolas", datos);

        Swal.fire({
          icon: "success",
          title: "Producto registrado",
          text: "El producto fue agregado correctamente.",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.mensaje ||
          "No fue posible guardar el producto.",
        confirmButtonColor: "#d32f2f",
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "#1b5e20",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {productoEditar ? "Editar Producto" : "Nuevo Producto"}

        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            mt: 2,
          }}
        >
          <TextField
            fullWidth
            label="Nombre del producto"
            value={datos.nombre}
            onChange={(e) =>
              setDatos({
                ...datos,
                nombre: e.target.value.toUpperCase(),
              })
            }
          />

          <TextField
            select
            fullWidth
            label="Unidad de medida"
            value={datos.unidad}
            onChange={(e) =>
              setDatos({
                ...datos,
                unidad: e.target.value,
              })
            }
          >
            <MenuItem value="1 KG">1 KG</MenuItem>
            <MenuItem value="1 GR">1 GR</MenuItem>
            <MenuItem value="50 KG">50 KG</MenuItem>
            <MenuItem value="10 GR"> 10 GR</MenuItem>
            <MenuItem value="120 GR"> 120 GR</MenuItem>
            <MenuItem value="100 GR"> 100 GR</MenuItem>
            <MenuItem value="500 GR"> 500 GR</MenuItem>
            <MenuItem value="1 LT">1 LT</MenuItem>
            <MenuItem value="4 LT">4 LT</MenuItem>
            <MenuItem value="5 LT">5 LT</MenuItem>
            <MenuItem value="ML">ML</MenuItem>
            <MenuItem value="250 CC">250 CC</MenuItem>
            <MenuItem value="100 CC">100 CC</MenuItem>
            <MenuItem value="120 CC">120 CC</MenuItem>
            <MenuItem value="UN">UN</MenuItem>
          </TextField>

          {productoEditar && (
            <FormControlLabel
              control={
                <Switch
                  checked={datos.activo}
                  color="success"
                  onChange={(e) =>
                    setDatos({
                      ...datos,
                      activo: e.target.checked,
                    })
                  }
                />
              }
              label={datos.activo ? "Producto ACTIVO" : "Producto INACTIVO"}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button color="error" variant="outlined" onClick={onClose}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          sx={{
            bgcolor: "#1b5e20",
          }}
          onClick={handleGuardar}
        >
          {productoEditar ? "Actualizar" : "Crear Producto"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NuevoProductoAgricolaModal;
