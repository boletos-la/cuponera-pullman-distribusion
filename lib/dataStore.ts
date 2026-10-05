import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Garantizar que exista la carpeta data/
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readJsonFile<T>(filename: string, defaultValue: T): T {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      writeJsonFile(filename, defaultValue);
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error al leer ${filename}:`, error);
    return defaultValue;
  }
}

export function writeJsonFile<T>(filename: string, data: T): void {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error al escribir en ${filename}:`, error);
  }
}

// ------------------- TIPOS DE DATOS -------------------

export interface Cuponera {
  id: number;
  nombre: string;
  descripcion: string;
  tramos: string[]; // Lista de tramos (ej: ["Santiago-Concón", "Concón-Santiago"])
  valorUnitario: number;
  cantidadCupones: number; // 10 o 20
  precioTotal: number;
  activa: boolean;
  categoria: string;
  badge?: string;
  boletosAdicionales?: number;
}

export interface Compra {
  id: string;
  rutCliente: string;
  nombreCliente: string;
  emailCliente: string;
  telefonoCliente: string;
  cuponeraId: number;
  nombreCuponera: string;
  cantidadCupones: number;
  montoTotal: number;
  metodoPago: string;
  estadoPago: 'Aprobado' | 'Rechazado';
  fechaCompra: string; // ISO String
  fechaVencimiento: string; // 90 días corridos at 23:59:59
}

export interface Cupon {
  codigo: string; // ej: CUP-VNA-9482 (Código único de la cuponera adquirida)
  compraId: string;
  cuponeraId: number;
  rutCliente: string;
  nombreCliente: string;
  emailCliente: string;
  nombreCuponera: string;
  tramosPermitidos: string[];
  valorUnitario: number;
  totalCupones: number; // e.g. 10 o 20
  cuponesUsados: number; // e.g. 2
  saldoDisponible: number; // e.g. 8 (Quedan 8/10 cupones)
  estado: 'Activo' | 'Agotado' | 'Vencido' | 'Anulado';
  fechaCompra: string;
  fechaVencimiento: string;
  fechaUso?: string | null;
  pasajeCodigo?: string | null;
}

export interface Asiento {
  numero: number;
  piso: 1 | 2;
  tipo: 'Semi Cama' | 'Salón Cama';
  estado: 'Disponible' | 'Ocupado' | 'Reservado';
  pasajeCodigo?: string | null;
}

export interface Servicio {
  id: string;
  codigoServicio: string;
  origen: string;
  destino: string;
  tramo: string; // ej: "Santiago-Viña Del Mar"
  fecha: string; // YYYY-MM-DD
  horaSalida: string; // HH:mm
  horaLlegada: string; // HH:mm
  tipoBus: string; // "Semi Cama / Salón Cama"
  patente: string;
  precioRegular: number;
  asientos: Asiento[];
}

export interface Pasaje {
  codigo: string; // TKT-XXXXX
  cuponCodigo: string;
  rutCliente: string;
  nombreCliente: string;
  emailCliente: string;
  servicioId: string;
  origen: string;
  destino: string;
  fechaSalida: string;
  horaSalida: string;
  asientoNumero: number;
  tipoBus: string;
  patente: string;
  estado: 'Emitido' | 'Anulado';
  fechaEmision: string;
  codigoQR: string;
  codigoBarras: string;
}

export interface AuditoriaLog {
  id: string;
  fechaHora: string;
  rutUsuario?: string;
  nombreUsuario?: string;
  accion: 'COMPRA_CUPONERA' | 'CANJE_CUPON' | 'OTP_GENERADO' | 'OTP_VALIDADO' | 'ANULACION_PASAJE' | 'CREACION_CUPONERA' | 'EDICION_CUPONERA' | string;
  detalles: any;
  payload?: any;
  response?: any;
  endpoint?: string;
  ip?: string;
}

// ------------------- INICIALIZADOR DE DATOS INICIALES -------------------

export const INITIAL_CUPONERAS: Cuponera[] = [
  {
    id: 1,
    nombre: "CUPONERA CONCON (10 CUPONES)",
    descripcion: "Paquete preferencial de 10 viajes congelados para ruta Concón y Valparaíso.",
    tramos: ["Santiago-Concón", "Concón-Santiago", "Valparaiso-Santiago", "Santiago-Valparaiso"],
    valorUnitario: 5500,
    cantidadCupones: 10,
    precioTotal: 55000,
    activa: true,
    categoria: "Concón / Valparaíso",
    badge: "Popular"
  },
  {
    id: 2,
    nombre: "CUPONERA VIÑA DEL MAR (20 CUPONES)",
    descripcion: "20 viajes a tarifa congelada para trayecto directo Santiago - Viña del Mar.",
    tramos: ["Santiago-Viña Del Mar", "Viña Del Mar-Santiago"],
    valorUnitario: 4900,
    cantidadCupones: 20,
    precioTotal: 98000,
    activa: true,
    categoria: "Viña del Mar",
    badge: "Más Vendida"
  },
  {
    id: 3,
    nombre: "CUPONERA V.ALEMANA (10 CUPONES)",
    descripcion: "10 cupones de viaje para Villa Alemana y Quilpué.",
    tramos: ["Santiago-Villa Alemana", "Villa Alemana-Santiago", "Quilpué-Santiago", "Santiago-Quilpué"],
    valorUnitario: 4900,
    cantidadCupones: 10,
    precioTotal: 49000,
    activa: true,
    categoria: "Interior Marga Marga"
  },
  {
    id: 4,
    nombre: "CUPONERA CONCON (20 CUPONES)",
    descripcion: "20 pasajes preferenciales para conexión directa Santiago - Concón.",
    tramos: ["Santiago-Concón", "Concón-Santiago"],
    valorUnitario: 5500,
    cantidadCupones: 20,
    precioTotal: 110000,
    activa: true,
    categoria: "Concón"
  },
  {
    id: 5,
    nombre: "CUPONERA LITORAL (10 CUPONES)",
    descripcion: "10 cupones flexibles para Algarrobo, El Quisco y El Tabo.",
    tramos: ["Santiago-Algarrobo", "Algarrobo-Santiago", "Santiago-El Quisco", "El Quisco-Santiago", "Santiago-El Tabo", "El Tabo-Santiago"],
    valorUnitario: 4900,
    cantidadCupones: 10,
    precioTotal: 49000,
    activa: true,
    categoria: "Litoral Central"
  },
  {
    id: 6,
    nombre: "CUPONERA VIÑA DEL MAR (10 CUPONES)",
    descripcion: "10 cupones congelados para viajes entre Santiago y Viña del Mar.",
    tramos: ["Santiago-Viña Del Mar", "Viña Del Mar-Santiago"],
    valorUnitario: 4900,
    cantidadCupones: 10,
    precioTotal: 49000,
    activa: true,
    categoria: "Viña del Mar"
  },
  {
    id: 7,
    nombre: "CUPONERA V. ALEMANA (20 CUPONES)",
    descripcion: "20 viajes congelados para usuarios de Villa Alemana y Quilpué.",
    tramos: ["Villa Alemana-Santiago", "Santiago-Villa Alemana", "Quilpué-Santiago", "Santiago-Quilpué"],
    valorUnitario: 4900,
    cantidadCupones: 20,
    precioTotal: 98000,
    activa: true,
    categoria: "Interior Marga Marga"
  },
  {
    id: 8,
    nombre: "CUPONERA LITORAL (20 CUPONES)",
    descripcion: "20 pasajes para el circuito completo del Litoral Central (El Tabo, El Quisco, Algarrobo).",
    tramos: ["El Tabo-Santiago", "El Quisco-Santiago", "Algarrobo-Santiago", "Santiago-El Tabo", "Santiago-El Quisco", "Santiago-Algarrobo"],
    valorUnitario: 4900,
    cantidadCupones: 20,
    precioTotal: 98000,
    activa: true,
    categoria: "Litoral Central"
  },
  {
    id: 9,
    nombre: "CUPONERA VALPARAISO (20 CUPONES)",
    descripcion: "20 viajes de alta frecuencia para tramo Santiago - Valparaíso.",
    tramos: ["Santiago-Valparaiso", "Valparaiso-Santiago"],
    valorUnitario: 4900,
    cantidadCupones: 20,
    precioTotal: 98000,
    activa: true,
    categoria: "Valparaíso"
  },
  {
    id: 10,
    nombre: "CUPONERA LIMACHE (20 CUPONES)",
    descripcion: "20 pasajes para Olmué, Quillota y Limache.",
    tramos: ["Olmue-Santiago", "Santiago-Olmue", "Quillota-Santiago", "Santiago-Quillota", "Limache-Santiago", "Santiago-Limache"],
    valorUnitario: 5500,
    cantidadCupones: 20,
    precioTotal: 110000,
    activa: true,
    categoria: "Provincia de Quillota / Olmué"
  },
  {
    id: 11,
    nombre: "CUPONERA VALPARAISO (10 CUPONES)",
    descripcion: "10 pasajes individuales congelados para Santiago - Valparaíso.",
    tramos: ["Valparaiso-Santiago", "Santiago-Valparaiso"],
    valorUnitario: 4900,
    cantidadCupones: 10,
    precioTotal: 49000,
    activa: true,
    categoria: "Valparaíso"
  },
  {
    id: 12,
    nombre: "CUPONERA LIMACHE (10 CUPONES)",
    descripcion: "10 viajes congelados para Limache, Olmué y Quillota.",
    tramos: ["Olmue-Santiago", "Santiago-Olmue", "Limache-Santiago", "Santiago-Limache", "Quillota-Santiago", "Santiago-Quillota"],
    valorUnitario: 5500,
    cantidadCupones: 10,
    precioTotal: 55000,
    activa: true,
    categoria: "Provincia de Quillota / Olmué"
  },
  {
    id: 13,
    nombre: "CUPONERA CARTAGENA (10 CUPONES)",
    descripcion: "10 pasajes directo Cartagena - Santiago.",
    tramos: ["Cartagena-Santiago", "Santiago-Cartagena"],
    valorUnitario: 4900,
    cantidadCupones: 10,
    precioTotal: 49000,
    activa: true,
    categoria: "Litoral Sur"
  },
  {
    id: 14,
    nombre: "CUPONERA SAN ANTONIO - STO DOMINGO (20 CUPONES)",
    descripcion: "20 cupones congelados para San Antonio y Santo Domingo.",
    tramos: ["Santiago-San Antonio", "San Antonio-Santiago", "Santo Domingo-Santiago", "Santiago-Santo Domingo"],
    valorUnitario: 4900,
    cantidadCupones: 20,
    precioTotal: 98000,
    activa: true,
    categoria: "San Antonio / Santo Domingo"
  },
  {
    id: 15,
    nombre: "CUPONERA SAN ANTONIO- STO DOMINGO (10 CUPONES)",
    descripcion: "10 pasajes para San Antonio y Santo Domingo.",
    tramos: ["San Antonio-Santiago", "Santiago-San Antonio", "Santo Domingo-Santiago", "Santiago-Santo Domingo"],
    valorUnitario: 5000,
    cantidadCupones: 10,
    precioTotal: 50000,
    activa: true,
    categoria: "San Antonio / Santo Domingo"
  },
  {
    id: 16,
    nombre: "CUPONERA LOS ANDES (20 CUPONES)",
    descripcion: "20 pasajes preferenciales para Los Andes y San Felipe.",
    tramos: ["Santiago-Los Andes", "Los Andes-Santiago", "San Felipe-Santiago", "Santiago-San Felipe"],
    valorUnitario: 4500,
    cantidadCupones: 20,
    precioTotal: 90000,
    activa: true,
    categoria: "Valle del Aconcagua"
  },
  {
    id: 17,
    nombre: "CUPONERA LOS ANDES (10 CUPONES)",
    descripcion: "10 pasajes para conexión Santiago - Los Andes / San Felipe.",
    tramos: ["Los Andes-Santiago", "Santiago-Los Andes", "San Felipe-Santiago", "Santiago-San Felipe"],
    valorUnitario: 4500,
    cantidadCupones: 10,
    precioTotal: 45000,
    activa: true,
    categoria: "Valle del Aconcagua"
  },
  {
    id: 18,
    nombre: "CUPONERA VALPO-LOS ANDES (20 CUPONES)",
    descripcion: "20 cupones interprovinciales entre Valparaíso / Viña del Mar y Los Andes / San Felipe.",
    tramos: [
      "Valparaiso-Los Andes", "Los Andes-Valparaiso", "Valparaiso-San Felipe", "San Felipe-Valparaiso",
      "Viña Del Mar-Los Andes", "Los Andes-Viña Del Mar", "Viña Del Mar-San Felipe", "San Felipe-Viña Del Mar"
    ],
    valorUnitario: 6000,
    cantidadCupones: 20,
    precioTotal: 120000,
    activa: true,
    categoria: "Interprovincial V Región"
  },
  {
    id: 19,
    nombre: "CUPONERA CARTAGENA (20 CUPONES)",
    descripcion: "20 pasajes congelados para Cartagena - Santiago.",
    tramos: ["Cartagena-Santiago", "Santiago-Cartagena"],
    valorUnitario: 4900,
    cantidadCupones: 20,
    precioTotal: 98000,
    activa: true,
    categoria: "Litoral Sur"
  }
];

// Helper para actualizar cupones expirados automáticamente (+90 días)
export function checkAndUpdateExpiredCoupons(): number {
  const cupones = readJsonFile<Cupon[]>('cupones.json', []);
  const now = new Date();
  let updatedCount = 0;

  const updatedCupones = cupones.map((c) => {
    if (c.estado === 'Activo') {
      const expDate = new Date(c.fechaVencimiento);
      if (now > expDate) {
        updatedCount++;
        return { ...c, estado: 'Vencido' as const };
      }
    }
    return c;
  });

  if (updatedCount > 0) {
    writeJsonFile('cupones.json', updatedCupones);
  }

  return updatedCount;
}

// Generador de Asientos de Bus (44 asientos: Piso 1 Salón Cama 12 asientos, Piso 2 Semi Cama 32 asientos)
export function generateBusSeats(): Asiento[] {
  const seats: Asiento[] = [];
  // Piso 1: 1 a 12 (Salón Cama)
  for (let i = 1; i <= 12; i++) {
    seats.push({
      numero: i,
      piso: 1,
      tipo: 'Salón Cama',
      // Ocupamos aleatoriamente un par de asientos para demostrar interactividad real
      estado: i % 5 === 0 ? 'Ocupado' : 'Disponible',
    });
  }
  // Piso 2: 13 a 44 (Semi Cama)
  for (let i = 13; i <= 44; i++) {
    seats.push({
      numero: i,
      piso: 2,
      tipo: 'Semi Cama',
      estado: i % 7 === 0 ? 'Ocupado' : 'Disponible',
    });
  }
  return seats;
}

// Servicios de Bus Iniciales de Ejemplo
export const INITIAL_SERVICIOS: Servicio[] = [
  {
    id: "SRV-VNA-01",
    codigoServicio: "PCC-101",
    origen: "Santiago",
    destino: "Viña Del Mar",
    tramo: "Santiago-Viña Del Mar",
    fecha: new Date().toISOString().split('T')[0],
    horaSalida: "07:30",
    horaLlegada: "09:15",
    tipoBus: "Salón Cama / Semi Cama",
    patente: "KPR-982",
    precioRegular: 7200,
    asientos: generateBusSeats()
  },
  {
    id: "SRV-VNA-02",
    codigoServicio: "PCC-103",
    origen: "Santiago",
    destino: "Viña Del Mar",
    tramo: "Santiago-Viña Del Mar",
    fecha: new Date().toISOString().split('T')[0],
    horaSalida: "09:00",
    horaLlegada: "10:45",
    tipoBus: "Salón Cama",
    patente: "JY-8821",
    precioRegular: 7500,
    asientos: generateBusSeats()
  },
  {
    id: "SRV-VNA-03",
    codigoServicio: "PCC-105",
    origen: "Viña Del Mar",
    destino: "Santiago",
    tramo: "Viña Del Mar-Santiago",
    fecha: new Date().toISOString().split('T')[0],
    horaSalida: "11:30",
    horaLlegada: "13:15",
    tipoBus: "Semi Cama",
    patente: "LK-4412",
    precioRegular: 7200,
    asientos: generateBusSeats()
  },
  {
    id: "SRV-CCN-01",
    codigoServicio: "PCC-201",
    origen: "Santiago",
    destino: "Concón",
    tramo: "Santiago-Concón",
    fecha: new Date().toISOString().split('T')[0],
    horaSalida: "08:15",
    horaLlegada: "10:15",
    tipoBus: "Salón Cama",
    patente: "PC-9912",
    precioRegular: 8200,
    asientos: generateBusSeats()
  },
  {
    id: "SRV-VALPO-01",
    codigoServicio: "PCC-301",
    origen: "Santiago",
    destino: "Valparaiso",
    tramo: "Santiago-Valparaiso",
    fecha: new Date().toISOString().split('T')[0],
    horaSalida: "08:00",
    horaLlegada: "09:45",
    tipoBus: "Salón Cama",
    patente: "HR-1123",
    precioRegular: 7200,
    asientos: generateBusSeats()
  },
  {
    id: "SRV-LIT-01",
    codigoServicio: "PCC-401",
    origen: "Santiago",
    destino: "Algarrobo",
    tramo: "Santiago-Algarrobo",
    fecha: new Date().toISOString().split('T')[0],
    horaSalida: "08:45",
    horaLlegada: "10:45",
    tipoBus: "Salón Cama",
    patente: "XZ-7734",
    precioRegular: 7500,
    asientos: generateBusSeats()
  },
  {
    id: "SRV-ANDES-01",
    codigoServicio: "PCC-501",
    origen: "Santiago",
    destino: "Los Andes",
    tramo: "Santiago-Los Andes",
    fecha: new Date().toISOString().split('T')[0],
    horaSalida: "07:45",
    horaLlegada: "09:30",
    tipoBus: "Semi Cama",
    patente: "WW-5591",
    precioRegular: 6500,
    asientos: generateBusSeats()
  }
];
