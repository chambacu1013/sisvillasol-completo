drop schema if exists sisvillasol cascade;

create schema sisvillasol;
-- ==========================================
-- TABLAS FLOTANTES
-- ==========================================
-- 1. Crear la tabla para la Identidad Corporativa de la finca
CREATE TABLE sisvillasol.identidad_corporativa (
    id_identidad SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(100) DEFAULT 'FINCA VILLASOL',
    mision TEXT NOT NULL,
    vision TEXT NOT NULL,
    objetivos TEXT NOT NULL,
    ultimo_cambio TIMESTAMP DEFAULT NOW()
);

-- 1.2. Insertar LA ÚNICA FILA que existirá (Datos iniciales)
INSERT INTO sisvillasol.identidad_corporativa (mision, vision, objetivos)
VALUES (
    'Cultivar y comercializar productos agrícolas de la más alta calidad
	en la Vereda de Bartaqui, Chitagá, Norte de Santander,
	promoviendo prácticas sostenibles y contribuyendo al bienestar de nuestra comunidad.', 
    'Ser reconocidos como el referente de la agricultura sostenible y la innovación en la región,
	expandiendo nuestro impacto positivo en el medio ambiente y la sociedad para el año 2030.', 
    '1. Aumentar la producción a 20 ton/ha anual.
	 2. Reducir costos operativos en un 30%.
	 3. Implementar reportes diarios de cultivo y rendimiento.'
);
-- 2. tabla de notas(recordatorios de la finca)
CREATE TABLE sisvillasol.notas(
id_nota SERIAL PRIMARY KEY,
contenido TEXT NOT NULL,
fecha_creacion TIMESTAMP DEFAULT NOW(),
completada BOOLEAN DEFAULT FALSE
);
-- ==========================================
-- TABLAS PRINCIPALES
-- ==========================================
-- 3.. Tabla de Roles (Para diferenciar Admin de Agricultor)
CREATE TABLE sisvillasol.roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE -- Ej: 'ADMIN', 'AGRICULTOR'
);

-- 4. Tabla de Usuarios (Login)
CREATE TABLE sisvillasol.usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_rol INT REFERENCES sisvillasol.roles(id_rol) ON DELETE RESTRICT,
    nombre VARCHAR(50) NOT NULL,
	apellido VARCHAR(50) NOT NULL,
    documento VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20) NULL,
    password_hash VARCHAR(255) NOT NULL, -- Aquí guardaremos la clave encriptada
    estado BOOLEAN DEFAULT TRUE -- TRUE=Activo, FALSE=Despedido
);

-- 5. Tabla de unidades(Ej: 'Litros', 'Kg', 'Bultos')
CREATE TABLE sisvillasol.unidades(
id_unidad SERIAL PRIMARY KEY,
nombre_unidad VARCHAR(50) NOT NULL UNIQUE
);
-- 6. Tabla de categorias (Eje: fungicida, herbicidas)
CREATE TABLE sisvillasol.categorias(
id_categoria SERIAL PRIMARY KEY,
nombre_categoria VARCHAR(50) NOT NULL UNIQUE
);

-- 7. Tabla de Insumos (Inventario)
CREATE TABLE sisvillasol.insumos (
    id_insumo SERIAL PRIMARY KEY,
    nombre_insumo VARCHAR(100) NOT NULL,
	id_categoria_insumo INT REFERENCES sisvillasol.categorias(id_categoria) ON DELETE RESTRICT,
    id_unidad INT REFERENCES sisvillasol.unidades(id_unidad)ON DELETE RESTRICT,
	nivel_toxicidad VARCHAR(5) NOT NULL DEFAULT 'U'
    CHECK (nivel_toxicidad IN ('Ia', 'Ib', 'II', 'III', 'U')),
    cantidad_stock DECIMAL(10,2) DEFAULT 0 CHECK (cantidad_stock >= 0),
    stock_minimo DECIMAL(10,2) DEFAULT 0.5 CHECK (stock_minimo >= 0), -- Para la Alerta
    costo_unitario_promedio DECIMAL(12,2), -- Para reportes financieros
	estado_insumo VARCHAR(20) DEFAULT 'NORMAL' -- 'NORMAL', 'BAJO STOCK', 'FUERA DE MERCADO'
);

-- 8. Tabla de Cultivos (Variedades: Ciruela Horvin, Manzana Anna, etc.)
CREATE TABLE sisvillasol.cultivos (
    id_cultivo SERIAL PRIMARY KEY,
    nombre_variedad VARCHAR(100) NOT NULL,
    nombre_cientifico VARCHAR(100) NOT NULL,
    dias_estimados_cosecha INT NOT NULL-- Para alertas de recolección
);
--9. Tabla de catalogo de estados de los lotes
CREATE TABLE sisvillasol.catalogo_estados_lote (
    id_estado SERIAL PRIMARY KEY,
    clasificacion VARCHAR(20) NOT NULL, -- Determina el color: 'OPTIMO' (Verde) o 'ALERTA' (Rojo)
    categoria VARCHAR(50) NOT NULL,     -- Agrupación: 'CICLO FENOLOGICO', 'FISIOLOGICO', 'HONGO', 'PLAGA'
    nombre_estado VARCHAR(100) NOT NULL,
    descripcion TEXT
);
-- 10. Tabla de Lotes (Terreno)
CREATE TABLE sisvillasol.lotes (
    id_lote SERIAL PRIMARY KEY,
    id_cultivo_actual INT REFERENCES sisvillasol.cultivos(id_cultivo) ON DELETE RESTRICT,
    nombre_lote VARCHAR(50) NOT NULL, -- Ej: 'Lote 1 A'
    area_hectareas DECIMAL(5,2) NOT NULL,
    ubicacion TEXT NOT NULL, -- Para el Mapa (longitud, latitud)
    id_estado_actual INT REFERENCES sisvillasol.catalogo_estados_lote(id_estado) DEFAULT 1;
);
ALTER TABLE sisvillasol.lotes 
ADD COLUMN cantidad_arboles INTEGER DEFAULT 0;
-- ==========================================
-- TABLAS TRANSACCIONALES (OPERACIÓN DIARIA)
-- ==========================================

-- 10. tipo de actividad en la finca
CREATE TABLE sisvillasol.tipos_actividad (
    id_tipo_actividad       SERIAL PRIMARY KEY,
    nombre_tipo_actividad   VARCHAR(50) NOT NULL UNIQUE
);

-- 11. Tabla de Tareas (El corazón del sistema)
CREATE TABLE sisvillasol.tareas (
    id_tarea SERIAL PRIMARY KEY,
    id_lote_tarea INT REFERENCES sisvillasol.lotes(id_lote) ON DELETE RESTRICT,
    id_usuario_asignado INT REFERENCES sisvillasol.usuarios(id_usuario) ON DELETE RESTRICT,
    id_tipo_actividad_tarea INT REFERENCES sisvillasol.tipos_actividad(id_tipo_actividad) ON DELETE RESTRICT,
    descripcion TEXT NOT NULL,
    fecha_programada DATE DEFAULT CURRENT_DATE,
    fecha_ejecucion DATE NULL, -- Cuando el agricultor le da "Finalizar"
	jornada VARCHAR(20) NOT NULL DEFAULT 'COMPLETA',
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'HECHO', 'NO REALIZADA'
    origen VARCHAR(20) NOT NULL DEFAULT 'CALENDARIO', -- 'CALENDARIO' (Admin) o 'CAMPO' (Imprevisto)
    costo_mano_obra DECIMAL(12,2) DEFAULT 0 CHECK (costo_mano_obra >= 0)
);

-- 12. Tabla Pivote: Consumo de Insumos por Tarea
-- Relación N:M (Muchos Insumos en Muchas Tareas)

CREATE TABLE sisvillasol.consumo_insumos (
    id_consumo SERIAL PRIMARY KEY,
    id_tarea_consumo INT REFERENCES sisvillasol.tareas(id_tarea) ON DELETE CASCADE,
    id_insumo_consumo INT REFERENCES sisvillasol.insumos(id_insumo) ON DELETE RESTRICT,
    cantidad_usada DECIMAL(10,2) NOT NULL CHECK (cantidad_usada > 0),
    costo_calculado DECIMAL(12,2) DEFAULT 0 CHECK (costo_calculado >= 0)	-- Se guarda el costo histórico del momento
);

-- 13. Tabla de Ventas (Ingresos)
CREATE TABLE sisvillasol.ventas (
    id_venta SERIAL PRIMARY KEY,
    id_lote INT REFERENCES sisvillasol.lotes(id_lote) ON DELETE RESTRICT, -- Para saber qué lote produjo la plata
    fecha_venta DATE DEFAULT CURRENT_DATE,
    cliente VARCHAR(100) NOT NULL, -- A quién se le vendió (Intermediario)
    kilos_vendidos DECIMAL(10,2) NOT NULL CHECK (kilos_vendidos > 0),
    precio_total DECIMAL(12,2) NOT NULL CHECK (precio_total >= 0)
);

-- ==========================================
-- INSERTS
-- ==========================================
-- Usuario Admin por defecto (Clave: 3102266204 - Ojo, en prod debe ir encriptada)
INSERT INTO sisvillasol.roles (nombre) VALUES ('ADMIN'), ('AGRICULTOR');
INSERT INTO sisvillasol.usuarios (id_rol, nombre, apellido, documento, telefono, password_hash)
VALUES (1, 'Jaime Anatolio', 'Rodriguez', '88164381', '3102266204','3102266204'),
(1, 'Rosa Sulley', 'Mogollon', '60255139', '3103368924','3103368924');
INSERT INTO sisvillasol.unidades (id_unidad, nombre_unidad) VALUES 
(1, 'Litros'),
(2, 'Mililitros'),
(3, 'Kilogramos'),
(4, 'Gramos'),
(5, 'Metros'),
(6, 'Rollo'),
(7, 'Bultos'),
(8, 'Galon'),
(9, 'Unidades');

INSERT INTO sisvillasol.categorias(nombre_categoria) VALUES 
('Fungicida'), ('Insecticida'), ('Herbicida'),
('Regulador'), ('Fertilizante'), ('Herramienta'),
('Maquinaria'),('General');

--las que hay actualmente en la finca villasol
INSERT INTO sisvillasol.cultivos (id_cultivo, nombre_variedad, nombre_cientifico, dias_estimados_cosecha) VALUES
(1, 'Manzana Anna', 'Malus domestica', 100),
(2, 'Ciruela Horvin', 'Prunus domestica', 120),
(3, 'Durazno Gran Jarillo', 'Prunus persica', 90),
(4, 'Aguacates hass', 'Persea americana', 240),
(5, 'Morauva Silvestre', 'Rubus glaucus', 90),
(6, 'Feijoa sellowiana', 'Acca sellowiana', 150),
(7, 'Cereza Bing', 'Prunus avium', 90),
(8, 'Pera Williams', 'Pyrus communis', 130),
(9, 'Mantenimiento General Finca', 'No Aplica', 0),
(10, 'Cultivo de ciclo corto', 'NO APLICA', 180);

-- el tipo de actividades mas comunes en la finca villasol
INSERT INTO sisvillasol.tipos_actividad (id_tipo_actividad, nombre_tipo_actividad) VALUES
(1, 'Fumigacion'),
(2, 'Poda'),
(3, 'Cercar'),
(4, 'Sembrar'),
(5, 'Guarañar'),
(6, 'Fertilizacion'),
(7, 'Cosecha'),
(8, 'Desyerbe'),
(9, 'Riego'),
(10, 'otros'),
(11, 'Descargar y extender'),
(12, 'Cernir'),
(13, 'Volteo');

--Lotes donde se ubican aproximadamente los arboles frutales
INSERT INTO sisvillasol.lotes (id_cultivo_actual, nombre_lote, area_hectareas, ubicacion, cantidad_arboles) VALUES
(1, 'Lote 1 A', 0.14, '-72.669549, 7.146401', 50),
(1, 'Lote 2 A', 0.11, '-72.669641, 7.146932', 37),
(1, 'Lote 3 A', 0.14, '-72.669795, 7.147863', 50),
(2, 'Lote 4 A', 0.11, '-72.669626, 7.147219', 39),
(3, 'Lote 4', 0.11, '-72.670023, 7.147161', 14),
(6, 'Lote 4', 0.11, '-72.669888, 7.147128', 7),
(4, 'Lote 5', 0.26, '-72.668822, 7.1477556', 60),
(3, 'Lote 6', 0.25, '-72.670203, 7.1468889', 41),
(7, 'Lote 7', 0.10, '-72.669978, 7.1480111', 10),
(8, 'Lote 7', 0.10, '-72.670118, 7.148142', 7),
(5, 'Lote 8', 0.10, '-72.670494, 7.1466556', 80),
(3, 'Lote 9 A', 1.16, '-72.667485, 7.146601', 250),
(3, 'Lote 9 B', 1.16, '-72.667578, 7.145906', 100),
(9, 'Lote General', 14.00, '-72.669092, 7.146431', 0),
(1, 'Lote 1 B', 0.16, '-72.669738, 7.146612', 68),
(1, 'Lote 1 C', 0.13, '-72.669981, 7.146692', 60),
(1, 'Lote 2 B', 0.11, '-72.669396, 7.146828', 40),
(1, 'Lote 3 B', 0.14, '-72.669649, 7.147754', 50),
(1, 'Lote 3 C', 0.14, '-72.669439, 7.147634', 65),
(2, 'Lote 4 B', 0.11, '-72.669844, 7.147355', 39),
(2, 'Lote 4 C', 0.11, '-72.670084, 7.147632', 45),
(2, 'Lote 4 D', 0.11, '-72.670252, 7.147305', 45),
(9, 'Lote Casa Tabla', 2.00, '-72.669142, 7.148346', 0),
(10, 'Lote Transitorio 1', 0.50, '-72.669095, 7.147409', 0),
(10, 'Lote Transitorio 2', 0.10, '-72.669371, 7.147368', 0);

--Catalogo de los estados fitosanitarios de cada lote
INSERT INTO sisvillasol.catalogo_estados_lote (id_estado, clasificacion, categoria, nombre_estado, descripcion) VALUES
(1, 'OPTIMO', 'CICLO FENOLOGICO', '1. REPOSO', 'Árbol en POS-PRODUCCION'),
(2, 'OPTIMO', 'CICLO FENOLOGICO', '2. DEFOLIACIÓN / PODA', 'Caída de hojas inducida o natural, podas de formación/producción.'),
(3, 'OPTIMO', 'CICLO FENOLOGICO', '3. BROTACIÓN', 'Yemas hinchadas y aparición de primeras hojas/brotes.'),
(4, 'OPTIMO', 'CICLO FENOLOGICO', '4. PRE-FLORACIÓN', 'Formación y elongación de los botones florales.'),
(5, 'OPTIMO', 'CICLO FENOLOGICO', '5. FLORACIÓN', 'Apertura de flores, polinización.'),
(6, 'OPTIMO', 'CICLO FENOLOGICO', '6. CUAJE', 'Caída de pétalos y formación del pequeño fruto.'),
(7, 'OPTIMO', 'CICLO FENOLOGICO', '7. RALEO', 'Eliminación de frutos en exceso para dar tamaño al resto.'),
(8, 'OPTIMO', 'CICLO FENOLOGICO', '8. DESARROLLO DEL FRUTO', 'Crecimiento y llenado celular del fruto.'),
(9, 'OPTIMO', 'CICLO FENOLOGICO', '9. MADURACIÓN', 'Cambio de color y acumulación de azúcares.'),
(10, 'OPTIMO', 'CICLO FENOLOGICO', '10. COSECHA / PRODUCCIÓN', 'Recolección del fruto en punto comercial.'),
(11, 'ALERTA', 'FISIOLOGICO', 'FRUTOS ABORTIVOS', 'Frutos que se caen antes de desarrollarse.'),
(12, 'ALERTA', 'FISIOLOGICO', 'CAÍDA PREMATURA DE FRUTOS', 'Frutos que caen sin madurar.'),
(13, 'ALERTA', 'FISIOLOGICO', 'RAJADO DEL FRUTO', 'Fruto se abre por exceso/falta de riego.'),
(14, 'ALERTA', 'FISIOLOGICO', 'QUEMADURA DE SOL', 'Manchas blanquecinas o cafés en fruto expuesto.'),
(15, 'ALERTA', 'FISIOLOGICO', 'HOJAS CHAMUSCADAS', 'Borde de hojas quemado por exceso de fertilizante.'),
(16, 'ALERTA', 'FISIOLOGICO', 'CLOROSIS', 'Hojas amarillas por falta de hierro o magnesio.'),
(17, 'ALERTA', 'FISIOLOGICO', 'DEFOLIACIÓN ANTICIPADA', 'Caída de hojas antes del reposo normal.'),
(18, 'ALERTA', 'FISIOLOGICO', 'FRUTO SIN CUAJE', 'Las flores caen sin formar fruto.'),
(19, 'ALERTA', 'FISIOLOGICO', 'RAMAS QUEBRADAS', 'Por exceso de carga frutal sin raleo.'),
(20, 'ALERTA', 'HONGO', 'VENTURIA', 'Mancha negra en hojas y frutos, caída prematura.'),
(21, 'ALERTA', 'HONGO', 'MONILIA', 'Pudrición del fruto en árbol, muy agresiva en durazno.'),
(22, 'ALERTA', 'HONGO', 'MILDEO VELLOSO', 'Pelusa blanca/gris en el envés de la hoja.'),
(23, 'ALERTA', 'HONGO', 'MILDEO POLVOSO', 'Polvo blanco en hojas y brotes tiernos.'),
(24, 'ALERTA', 'HONGO', 'BOTRITIS', 'Pudrición gris en flor y fruto, clima húmedo.'),
(25, 'ALERTA', 'HONGO', 'ANTRACNOSIS', 'Manchas oscuras hundidas en fruto, muy común en mora.'),
(26, 'ALERTA', 'HONGO', 'ROÑA / SARNA', 'Costra en piel del fruto, lo deprecia comercialmente.'),
(27, 'ALERTA', 'HONGO', 'CANCRO', 'Lesión en ramas que mata la rama desde adentro.'),
(28, 'ALERTA', 'HONGO', 'PUDRICIÓN DE RAÍZ', 'Phytophthora, amarillamiento general del árbol.'),
(29, 'ALERTA', 'PLAGA', 'PULGÓN', 'Colonias en brotes tiernos, enrollan y deforman hojas.'),
(30, 'ALERTA', 'PLAGA', 'TRIPS', 'Raspa flores y frutos, los deforma y broncea.'),
(31, 'ALERTA', 'PLAGA', 'MOSCA DE LA FRUTA', 'Larvas dentro del fruto, lo pudre por dentro.'),
(32, 'ALERTA', 'PLAGA', 'COCHINILLA', 'Escamas en ramas y tronco, debilita el árbol.'),
(33, 'ALERTA', 'PLAGA', 'ARAÑITA ROJA', 'Ácaros en el envés de la hoja, amarillamiento.'),
(34, 'ALERTA', 'PLAGA', 'PERFORADOR DEL FRUTO', 'Larvas que dañan directamente el fruto.'),
(35, 'ALERTA', 'PLAGA', 'HORMIGA ARRIERA', 'Corta y lleva hojas, debilita ramas jóvenes.'),
(36, 'ALERTA', 'PLAGA', 'LORITO VERDE', 'Insecto que chupa brotes y flores.'),
(37, 'OPTIMO', '11. GENERAL', 'MANTENIMIENTO FINCA', 'NO APLICA'),
(38, 'OPTIMO', '12. CRECIMIENTO/REPRODUCTIVO', 'ETAPA VEGETATIVA', 'SIEMBRA, GERMINACIÓN, FOLIAR/RATICULAR, POLINIZACIÓN, MADURACIÓN Y PRODUCCIÓN/COSECHA');