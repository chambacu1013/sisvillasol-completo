import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Box,
} from "@mui/material";

export default function FacturaDetalleDialog({

  open,

  onClose,

  factura,

}) {

  if (!factura) return null;

  return (

    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >

      <DialogTitle
        sx={{
          fontWeight: "bold",
          fontSize: 26,
          color: "#2E7D32",
        }}
      >
        Factura de Compra de Insumos
      </DialogTitle>

      <DialogContent>

        <Grid container spacing={2} sx={{ mt: 1 }}>

          <Grid item xs={6}>
            <Typography><b>Factura:</b> {factura.numero_factura}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography>
              <b>Fecha:</b>{" "}
              {new Date(factura.fecha).toLocaleDateString("es-CO")}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography><b>Proveedor:</b> {factura.proveedor}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography><b>Cliente:</b> {factura.cliente}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography><b>Documento:</b> {factura.documento}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography><b>Agricultor:</b> {factura.agricultor}</Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography><b>Lote:</b> {factura.lote}</Typography>
          </Grid>

        </Grid>

        <Divider sx={{ my: 3 }} />

        <Paper elevation={0} variant="outlined">

          <Table>

            <TableHead>

              <TableRow>

                <TableCell><b>Producto</b></TableCell>

                <TableCell align="center"><b>Cantidad</b></TableCell>

                <TableCell align="center"><b>Unidad</b></TableCell>

                <TableCell align="right"><b>Vr. Unitario</b></TableCell>

                <TableCell align="right"><b>Subtotal</b></TableCell>

              </TableRow>

            </TableHead>

            <TableBody>

              {factura.detalle?.map((item, index) => (

                <TableRow key={index}>

                  <TableCell>{item.producto}</TableCell>

                  <TableCell align="center">
                    {item.cantidad}
                  </TableCell>

                  <TableCell align="center">
                    {item.unidad}
                  </TableCell>

                  <TableCell align="right">
                    {Number(item.valor_unitario).toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                    })}
                  </TableCell>

                  <TableCell align="right">
                    {Number(item.subtotal).toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                    })}
                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

        </Paper>

        <Box
          display="flex"
          justifyContent="flex-end"
          mt={3}
        >

          <Typography
            variant="h5"
            fontWeight="bold"
          >

            TOTAL:&nbsp;

            {Number(factura.total).toLocaleString("es-CO", {

              style: "currency",

              currency: "COP",

            })}

          </Typography>

        </Box>

        {factura.observaciones && (

          <Box mt={3}>

            <Typography fontWeight="bold">

              Observaciones

            </Typography>

            <Typography>

              {factura.observaciones}

            </Typography>

          </Box>

        )}

      </DialogContent>

      <DialogActions>

        <Button
          variant="contained"
          color="success"
          onClick={onClose}
        >
          Cerrar
        </Button>

      </DialogActions>

    </Dialog>

  );

}