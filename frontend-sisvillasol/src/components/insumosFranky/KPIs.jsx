import {
  Receipt,
  Paid,
  CalendarMonth,
  Inventory2,
  TrendingUp,
} from "@mui/icons-material";

import { Grid, Card, CardContent, Typography } from "@mui/material";

// Formatear moneda COP
const formatoMoneda = (valor) =>
  "$ " + Number(valor || 0).toLocaleString("es-CO");

// Convertir número de mes a nombre
const obtenerNombreMes = (numeroMes) => {
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return numeroMes ? meses[numeroMes - 1] : "Último mes";
};

export default function KPIs({ kpis = {} }) {
  const tarjetas = [
    {
      titulo: "Total Facturación Anual",
      valor: formatoMoneda(kpis.totalAnual),
      icono: <Paid color="success" sx={{ fontSize: 45 }} />,
    },

    {
      titulo: "Facturas Registradas",
      valor: Number(kpis.facturas || 0).toLocaleString("es-CO"),
      icono: <Receipt color="warning" sx={{ fontSize: 45 }} />,
    },
    {
      titulo: "Productos Comprados",
      valor: Number(kpis.productos || 0).toLocaleString("es-CO"),
      icono: <Inventory2 color="secondary" sx={{ fontSize: 45 }} />,
    },
    {
      titulo: "Promedio por Factura",
      valor: formatoMoneda(kpis.promedio),
      icono: <TrendingUp color="info" sx={{ fontSize: 45 }} />,
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {tarjetas.map((item) => (
        <Grid item xs={12} sm={6} md={4} lg={2.4} key={item.titulo}>
          <Card
            elevation={4}
            sx={{
              height: "100%",
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={3}>
                  {item.icono}
                </Grid>

                <Grid item xs={9}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontWeight: 600,
                    }}
                  >
                    {item.titulo}
                  </Typography>

                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{
                      mt: 1,
                    }}
                  >
                    {item.valor}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
