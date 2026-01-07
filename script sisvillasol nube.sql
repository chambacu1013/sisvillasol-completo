drop schema if exists sisvillasol cascade;

create schema sisvillasol;
-- ==========================================
-- TABLAS MAESTRAS (CATÁLOGOS)
-- ==========================================
-- 1. Crear la tabla para la Identidad Corporativa
CREATE TABLE sisvillasol.identidad_corporativa (
    id_identidad SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(100) DEFAULT 'FINCA VILLASOL',
    mision TEXT,
    vision TEXT,
    objetivos TEXT,
    ultimo_cambio TIMESTAMP DEFAULT NOW()
);

-- 2. Insertar LA ÚNICA FILA que existirá (Datos iniciales)
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

-- 3. Tabla de Roles (Para diferenciar Admin de Agricultor)
CREATE TABLE sisvillasol.roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE, -- Ej: 'ADMIN', 'AGRICULTOR'
    descripcion TEXT
);

-- 4. Tabla de Cultivos (Variedades: Ciruela Horvin, Manzana Anna, etc.)
CREATE TABLE sisvillasol.cultivos (
    id_cultivo SERIAL PRIMARY KEY,
    nombre_variedad VARCHAR(100) NOT NULL,
    nombre_cientifico VARCHAR(100),
    dias_estimados_cosecha INT -- Para alertas de recolección
);
-- 5. Tabla de unidades(Ej: 'Litros', 'Kg', 'Bultos')
CREATE TABLE sisvillasol.unidades(
id_unidad SERIAL PRIMARY KEY,
nombre_unidad VARCHAR(10) NOT NULL
);
--6. Tabla de categorias (Eje: fungicida, herbicidas)
CREATE TABLE sisvillasol.categorias(
id_categoria SERIAL PRIMARY KEY,
nombre_categoria VARCHAR (50) NOT NULL
);

--7. Tabla de Insumos (Inventario)
CREATE TABLE sisvillasol.insumos (
    id_insumo SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
	id_categoria_insumo INT REFERENCES sisvillasol.categorias(id_categoria),
    id_unidad INT REFERENCES sisvillasol.unidades(id_unidad),
    cantidad_stock DECIMAL(10,2) DEFAULT 0,
    stock_minimo DECIMAL(10,2) DEFAULT 0.5, -- Para la Alerta
   costo_unitario_promedio DECIMAL(12,2) -- Para reportes financieros
);

-- ==========================================
-- TABLAS PRINCIPALES
-- ==========================================

--8. Tabla de Usuarios (Login)
CREATE TABLE sisvillasol.usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_rol INT REFERENCES sisvillasol.roles(id_rol),
    nombre VARCHAR(50) NOT NULL,
	apellido VARCHAR(50) NOT NULL,
    documento VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    password_hash VARCHAR(355) NOT NULL, -- Aquí guardaremos la clave encriptada
    estado BOOLEAN DEFAULT TRUE -- TRUE=Activo, FALSE=Despedido
);

-- Tabla de Lotes (Terreno)
CREATE TABLE sisvillasol.lotes (
    id_lote SERIAL PRIMARY KEY,
    id_cultivo_actual INT REFERENCES sisvillasol.cultivos(id_cultivo),
    nombre_lote VARCHAR(50) NOT NULL, -- Ej: 'Lote 1 A'
    area_hectareas DECIMAL(5,2),
    ubicacion TEXT, -- Para el Mapa (longitud, latitud)
    estado_sanitario VARCHAR(50) DEFAULT 'OPTIMO' -- 'OPTIMO', 'EN_TRATAMIENTO', 'CUARENTENA'
);

-- ==========================================
-- TABLAS TRANSACCIONALES (OPERACIÓN DIARIA)
-- ==========================================

CREATE TABLE sisvillasol.tipos_actividad(
id_tipo_actividad SERIAL PRIMARY KEY,
nombre_tipo_actividad VARCHAR (50) NOT NULL -- 'PODA', 'FUMIGACION', 'COSECHA'
);
-- Tabla de Tareas (El corazón del sistema)
CREATE TABLE sisvillasol.tareas (
    id_tarea SERIAL PRIMARY KEY,
    id_lote_tarea INT REFERENCES sisvillasol.lotes(id_lote),
    id_usuario_asignado INT REFERENCES sisvillasol.usuarios(id_usuario),
    id_tipo_actividad_tarea INT REFERENCES sisvillasol.tipos_actividad(id_tipo_actividad),
    descripcion TEXT,
    fecha_programada DATE,
    fecha_ejecucion TIMESTAMP DEFAULT NOW(), -- Cuando el agricultor le da "Finalizar"
	jornada VARCHAR(20) DEFAULT 'COMPLETA',
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'EN_PROCESO', 'HECHO'
    origen VARCHAR(20) DEFAULT 'CALENDARIO', -- 'CALENDARIO' (Admin) o 'CAMPO' (Imprevisto)
    costo_mano_obra DECIMAL(12,2) DEFAULT 0
);

--tabla de notas(recordatorios de la finca)
CREATE TABLE sisvillasol.notas(
id_nota SERIAL PRIMARY KEY,
contenido TEXT NOT NULL,
fecha_creacion TIMESTAMP DEFAULT NOW(),
completada BOOLEAN DEFAULT FALSE
);

-- Tabla Pivote: Consumo de Insumos por Tarea
-- Relación N:M (Muchos Insumos en Muchas Tareas)

CREATE TABLE sisvillasol.consumo_insumos (
    id_consumo SERIAL PRIMARY KEY,
    id_tarea_consumo INT REFERENCES sisvillasol.tareas(id_tarea),
    id_insumo_consumo INT REFERENCES sisvillasol.insumos(id_insumo),
    cantidad_usada DECIMAL(10,2) NOT NULL,
    costo_calculado DECIMAL(12,2) DEFAULT 0	-- Se guarda el costo histórico del momento
);

-- Tabla de Ventas (Ingresos)
CREATE TABLE sisvillasol.ventas (
    id_venta SERIAL PRIMARY KEY,
    id_lote INT REFERENCES sisvillasol.lotes(id_lote), -- Para saber qué lote produjo la plata
    fecha_venta DATE DEFAULT CURRENT_DATE,
    cliente VARCHAR(100), -- A quién se le vendió (Intermediario)
    kilos_vendidos DECIMAL(10,2),
    precio_total DECIMAL(12,2)
);

-- ==========================================
-- DATOS SEMILLA (SEED DATA)
-- Para que no arranques vacío
-- ==========================================
-- Usuario Admin por defecto (Clave: 3102266204 - Ojo, en prod debe ir encriptada)
INSERT INTO sisvillasol.roles (nombre) VALUES ('ADMIN'), ('AGRICULTOR');
INSERT INTO sisvillasol.usuarios (id_rol, nombre, apellido, documento, telefono, password_hash)
VALUES (1, 'Jaime Anatolio', 'Rodriguez', '88164381', '3102266204','3102266204'),
(1, 'Rosa Sulley', 'Mogollon', '60255139', '3103368924','3103368924');
INSERT INTO sisvillasol.unidades (id_unidad, nombre_unidad) VALUES 
(1, 'Litros'),
(2, 'Kilogramos'),
(3, 'Gramos'),
(4, 'Mililitros'),
(5, 'Bultos'),
(6, 'Unidades'),
(7, 'Metros'),
(8, 'Rollo');
INSERT INTO sisvillasol.categorias(nombre_categoria) VALUES 
('Fungicida'), ('Insecticida'), ('Fertilizante'), ('Regulador'), ('Herbicida'), ('Herramienta'), ('General'),('Maquinaria');
--las que hay actualmente en la finca villasol
INSERT INTO sisvillasol.cultivos (nombre_variedad,nombre_cientifico, dias_estimados_cosecha) 
VALUES ('Manzana Anna','Malus domestica', 100), ('Ciruela Horvin','Prunus domestica', 120),
('Durazno Gran Jarillo','Prunus persica', 90), ('Aguacates hass','Persea americana', 240), 
('Morauva Silvestre','Rubus glaucus',90),('Feijoa sellowiana','Acca sellowiana',150),
('Mantenimiento General Finca','No Aplica',0),('Cereza Bing', 'Prunus avium', 90),('Pera Williams', 'Pyrus communis', 130);

-- el tipo de actividades mas comunes en la finca villasol
INSERT INTO sisvillasol.tipos_actividad (nombre_tipo_actividad) 
VALUES ('Fumigacion'),('Poda'),('Cercar'),('Sembrar'),('Guarañar'),
('Fertilizacion'),('Cocecha'),('Desyerbe'),('Riego'),('otros');

--Lotes donde se ubican aproximadamente los arboles frutales
INSERT INTO sisvillasol.lotes (nombre_lote,id_cultivo_actual,area_hectareas,ubicacion)
VALUES ('Lote 1',1,0.45,'-72.669772, 7.146497'),('Lote 2',1,0.22,'-72.669516, 7.1468806'),
('Lote 3',1,0.43,'-72.669586, 7.147692'),('Lote 4',2,0.46,'-72.669892, 7.1474222'),
('Lote 4',3,0.46,'-72.669892, 7.1474222'),('Lote 4',6,0.46,'-72.669892, 7.1474222'),
('Lote 5',4,0.26,'-72.668822, 7.1477556'),('Lote 6',3,0.25,'-72.670203, 7.1468889'),
('Lote 7',8,0.1,'-72.669978, 7.1480111'),('Lote 7',9,0.1,'-72.669978, 7.1480111'),
('Lote 8',5,0.1,'-72.670494, 7.1466556'),('Lote 9',3,2.16,'-72.66745, 7.146558'),
('Lote Virtual',7,0.0,'Áreas comunes, pozos, caminos, cunetas, casa');

update sisvillasol.lotes set ubicacion='-72.66981, 7.147324' where id_lote=4;
update sisvillasol.lotes set ubicacion='-72.670045, 7.147194' where id_lote=5;
update sisvillasol.lotes set ubicacion='-72.669888, 7.147128' where id_lote=6;
update sisvillasol.lotes set ubicacion='-72.670118, 7.148142' where id_lote=10;

select * from sisvillasol.usuarios

-- =====================================
-- se crea la base de datos ganaderia
-- =====================================
-- 1. Tabla Principal de Animales
/*
CREATE TABLE sisvillasol.ganado (
    id_animal SERIAL PRIMARY KEY,
    numero_animal VARCHAR(20) UNIQUE NOT NULL, -- La "Chapeta" o número
    raza VARCHAR(50), -- Ej: Holstein, Normando
    estado VARCHAR(20) DEFAULT 'ACTIVO', -- 'ACTIVO', 'VENDIDO', 'MUERTO'
    fecha_ingreso DATE DEFAULT CURRENT_DATE
);

-- 2. Producción de Leche (Diaria)
CREATE TABLE sisvillasol.produccion_leche (
    id_leche SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    cantidad_litros DECIMAL(5,2) DEFAULT 0,
    precio_litro DECIMAL(10,2), -- Precio al que se vendió ese día
    total_venta DECIMAL(12,2) GENERATED ALWAYS AS (cantidad_litros * precio_litro) STORED
);

-- 3. Consumo de Insumos (Sal, Melaza, Concentrado)
CREATE TABLE sisvillasol.consumo_ganaderia (
    id_consumo SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    tipo_insumo VARCHAR(50), -- 'Sal', 'Melaza', 'Concentrado'
    cantidad_kg DECIMAL(8,2),
    costo_total DECIMAL(10,2),
    observacion TEXT
);

-- 4. Ventas de Animales
CREATE TABLE sisvillasol.ventas_ganado (
    id_venta SERIAL PRIMARY KEY,
    id_animal INT REFERENCES sisvillasol.ganado(id_animal),
    fecha_venta DATE DEFAULT CURRENT_DATE,
    peso_kg DECIMAL(6,2),
    precio_venta DECIMAL(12,2),
    comprador VARCHAR(100)
);

-- 5. Rotación de Potreros (Pastoreo)
CREATE TABLE sisvillasol.pastoreo (
    id_pastoreo SERIAL PRIMARY KEY,
    numero_lote VARCHAR(50), -- Ej: "Lote del Rio", "Lote Alto"
    fecha_entrada DATE,
    fecha_salida DATE,
    dias_pastoreo INT -- Se puede calcular o ingresar manual
);
