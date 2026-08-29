import api from "./api";

export const generarPDFHistorialLote = async (idLote) => {
  const response = await api.get(`/actividades/historial-lote/${idLote}/pdf`, {
    responseType: "blob",
  });

  return response.data;
};
