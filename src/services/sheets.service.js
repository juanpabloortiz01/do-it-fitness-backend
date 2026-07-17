const sheets = require('../config/sheets');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

/**
 * Devuelve el nombre de la hoja del mes actual.
 * Ejemplo: "MARZO 2026"
 */
function getCurrentSheetName() {
  const months = [
    'ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
    'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'
  ];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Formatea la fecha actual como "MARTES 03/03/2026"
 */
function formatDateHeader() {
  const days = ['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];
  const now  = new Date();
  const day  = days[now.getDay()];
  const dd   = String(now.getDate()).padStart(2, '0');
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${day} ${dd}/${mm}/${yyyy}`;
}

/**
 * Devuelve todas las filas de la hoja del mes actual.
 */
async function getAllRowsCurrentMonth() {
  const sheetName = getCurrentSheetName();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:H`,
    });
    return res.data.values || [];
  } catch (err) {
    // Si la hoja del mes no existe aún, devuelve vacío
    if (err.code === 400) return [];
    throw err;
  }
}

/**
 * Busca si un email ya existe en CUALQUIER hoja del spreadsheet.
 * Columna D = EMAIL (índice 3)
 */
async function emailExists(email) {
  // Obtener lista de todas las hojas
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetNames = meta.data.sheets.map(s => s.properties.title);

  for (const sheetName of sheetNames) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!D:D`, // columna D = EMAIL
      });
      const rows = res.data.values || [];
      const found = rows.some(row => row[0]?.toLowerCase() === email.toLowerCase());
      if (found) return true;
    } catch {
      continue;
    }
  }
  return false;
}

/**
 * Crea la hoja del mes si no existe.
 * Ejemplo: "MARZO 2026"
 */
async function ensureMonthSheetExists(sheetName) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = meta.data.sheets.some(s => s.properties.title === sheetName);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          addSheet: {
            properties: { title: sheetName }
          }
        }]
      }
    });
    console.log(`📋 Hoja creada: ${sheetName}`);
  }
}

/**
 * Inserta el registro en la hoja del mes actual.
 *
 * Estructura de columnas (A→H):
 * A: Nombres y Apellidos
 * B: Valor
 * C: Membresía
 * D: Email
 * E: F/Nacimiento
 * F: Celular
 * G: Nuevo
 * H: Renovación
 *
 * Primero inserta una fila con la fecha (col A),
 * luego la fila de datos del miembro.
 *
 * @param {object} clientData - Datos del cliente desde Supabase
 * @param {boolean} isNew     - true = nuevo, false = renovación
 */
async function insertMember(clientData, isNew) {
  const sheetName  = getCurrentSheetName();
  const dateHeader = formatDateHeader();

  // Crear la hoja del mes si aún no existe
  await ensureMonthSheetExists(sheetName);

  // Fila 1: fecha en columna A
  const dateRow = [dateHeader];

  // Fila 2: datos del miembro en el orden exacto del sheet
  const memberRow = [
    clientData.nombre,           // A: Nombres y Apellidos
    clientData.valor,            // B: Valor
    clientData.plan,             // C: Membresía
    clientData.email,            // D: Email
    clientData.fecha_nacimiento, // E: F/Nacimiento
    clientData.celular,          // F: Celular
    isNew ? 'X' : '',            // G: Nuevo
    isNew ? '' : 'X',            // H: Renovación
    clientData.objetivo || '',          // I: Objetivo
    clientData.nivel_experiencia || '', // J: Nivel de Experiencia
    clientData.horario || '',           // K: Disponibilidad de Horario
    clientData.tipo_actividad || '',    // L: Tipo de Actividad
    clientData.ocupacion || '',         // M: Ocupación
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId:    SPREADSHEET_ID,
    range:            `${sheetName}!A:M`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [dateRow, memberRow] },
  });

  console.log(`📝 Insertado en "${sheetName}": ${clientData.email} — ${isNew ? 'NUEVO' : 'RENOVACIÓN'}`);
  return { isNew, dateHeader, sheetName };
}

module.exports = { emailExists, insertMember, getCurrentSheetName };
