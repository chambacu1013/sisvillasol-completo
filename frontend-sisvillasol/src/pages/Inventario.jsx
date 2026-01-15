import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Sidebar from "./Sidebar"; // Ajusta la ruta según corresponda
import api from "../services/api"; // Ajusta la ruta de tu servicio API
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";

const Inventario = () => {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- 1. NUEVO ESTADO PARA CATEGORÍA ---
  const [selectedCategory, setSelectedCategory] = useState(""); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Estados para Modal de Edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState(null);

  // Cargar insumos
  useEffect(() => {
    fetchInsumos();
  }, []);

  const fetchInsumos = async () => {
    try {
      const response = await api.get("/insumos");
      setInsumos(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar insumos:", error);
      setLoading(false);
    }
  };

  // --- 2. OBTENER CATEGORÍAS ÚNICAS PARA EL SELECT ---
  // Esto crea una lista automática sin repetidos (ej: ["Fertilizante", "Fungicida", ...])
  const uniqueCategories = [
    ...new Set(insumos.map((item) => item.nombre_categoria)),
  ].sort();

  // --- 3. LÓGICA DE FILTRADO ACTUALIZADA (TEXTO + CATEGORÍA) ---
  const filteredInsumos = insumos.filter((item) => {
    // Filtro por Texto (Nombre o Categoría escrita)
    const matchesSearch =
      item.nombre_insumo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nombre_categoria.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por Dropdown de Categoría
    const matchesCategory = selectedCategory
      ? item.nombre_categoria === selectedCategory
      : true; // Si no hay categoría seleccionada, pasan todos

    return matchesSearch && matchesCategory;
  });

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInsumos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInsumos.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Eliminar insumo
  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este insumo?")) {
      try {
        await api.delete(`/insumos/${id}`);
        setInsumos(insumos.filter((insumo) => insumo.id_insumo !== id));
        toast.success("Insumo eliminado correctamente");
      } catch (error) {
        console.error("Error al eliminar insumo:", error);
        toast.error("Error al eliminar insumo");
      }
    }
  };

  // Abrir Modal de Edición
  const handleEditClick = (insumo) => {
    setEditingInsumo({ ...insumo });
    setShowEditModal(true);
  };

  // Guardar Cambios
  const handleSaveChanges = async () => {
    try {
      await api.put(`/insumos/${editingInsumo.id_insumo}`, editingInsumo);
      setInsumos(
        insumos.map((i) =>
          i.id_insumo === editingInsumo.id_insumo ? editingInsumo : i
        )
      );
      setShowEditModal(false);
      toast.success("Insumo actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast.error("Error al actualizar insumo");
    }
  };

  // Manejar cambios en inputs del modal
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingInsumo({ ...editingInsumo, [name]: value });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Sidebar />
      <div className="container-fluid p-4">
        <h1 className="mb-4 text-success fw-bold">📦 Gestión de Inventario</h1>

        <div className="card shadow-sm border-0">
          <div className="card-body">
            {/* Barra de Herramientas: Búsqueda y Botón */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex" style={{ flex: 1 }}>
                
                {/* --- 4. NUEVO SELECTOR DE CATEGORÍA --- */}
                <select
                  className="form-select me-2"
                  style={{ maxWidth: "200px" }}
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1); // Reiniciar a página 1 al filtrar
                  }}
                >
                  <option value="">Todas las Categorías</option>
                  {uniqueCategories.map((cat, index) => (
                    <option key={index} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  className="form-control me-2"
                  placeholder="🔍 Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ maxWidth: "300px" }}
                />
              </div>

              <button className="btn btn-success d-flex align-items-center gap-2">
                <i className="bi bi-plus-lg"></i> Agregar Insumo
              </button>
            </div>

            {/* Tabla */}
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Cantidad</th>
                    <th>Unidad</th>
                    <th>Stock Mín.</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((insumo) => (
                      <tr key={insumo.id_insumo}>
                        <td>#{insumo.id_insumo}</td>
                        <td className="fw-bold text-secondary">
                          {insumo.nombre_insumo}
                        </td>
                        <td>
                          <span className="badge bg-info text-dark bg-opacity-10 border border-info">
                            {insumo.nombre_categoria}
                          </span>
                        </td>
                        <td
                          className={
                            insumo.cantidad_stock <= insumo.stock_minimo
                              ? "text-danger fw-bold"
                              : "text-success fw-bold"
                          }
                        >
                          {insumo.cantidad_stock}
                        </td>
                        <td>{insumo.nombre_unidad}</td>
                        <td>{insumo.stock_minimo}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleEditClick(insumo)}
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(insumo.id_insumo)}
                            title="Eliminar"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        No se encontraron insumos con esos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <nav>
                <ul className="pagination justify-content-center mt-3">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => paginate(currentPage - 1)}
                    >
                      Anterior
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => (
                    <li
                      key={index}
                      className={`page-item ${
                        currentPage === index + 1 ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => paginate(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => paginate(currentPage + 1)}
                    >
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Insumo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingInsumo && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre_insumo"
                  value={editingInsumo.nombre_insumo}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Stock Actual</Form.Label>
                <Form.Control
                  type="number"
                  name="cantidad_stock"
                  value={editingInsumo.cantidad_stock}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Stock Mínimo</Form.Label>
                <Form.Control
                  type="number"
                  name="stock_minimo"
                  value={editingInsumo.stock_minimo}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleSaveChanges}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Inventario;