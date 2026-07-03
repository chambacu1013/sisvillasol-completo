import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import TablePagination from "@mui/material/TablePagination";
export default function FacturaTable({
  facturas,
  onVer,
  onEditar,
  onEliminar,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <strong>Factura</strong>
            </TableCell>

            <TableCell>
              <strong>Fecha</strong>
            </TableCell>

            <TableCell>
              <strong>Agricultor</strong>
            </TableCell>

            <TableCell>
              <strong>Lote</strong>
            </TableCell>

            <TableCell>
              <strong>Proveedor</strong>
            </TableCell>

            <TableCell align="right">
              <strong>Total</strong>
            </TableCell>

            <TableCell align="center">
              <strong>Acciones</strong>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {facturas
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Chip label={item.numero_factura} color="primary" />
                </TableCell>

                <TableCell>
                  {new Date(item.fecha).toLocaleDateString("es-CO", {
                    timeZone: "UTC",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </TableCell>

                <TableCell>{item.agricultor}</TableCell>

                <TableCell>{item.lote}</TableCell>

                <TableCell>{item.proveedor}</TableCell>

                <TableCell align="right">
                  {Number(item.total).toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                  })}
                </TableCell>

                <TableCell align="center">
                  <Tooltip title="Visualizar factura">
                    <IconButton color="primary" onClick={() => onVer(item.id)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Editar factura">
                    <IconButton
                      color="warning"
                      onClick={() => onEditar(item.id)}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Eliminar factura">
                    <IconButton color="error" onClick={() => onEliminar(item)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={facturas.length}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="Facturas por página"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count}`
        }
      />
    </TableContainer>
  );
}
