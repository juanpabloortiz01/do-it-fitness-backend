const PAYPHONE_TOKEN    = process.env.PAYPHONE_TOKEN;
const PAYPHONE_STORE_ID = process.env.PAYPHONE_STORE_ID;
const BASE_URL          = 'https://pay.payphonetodoesposible.com/api';

const PLAN_PRICES = {
  mensual:    3500,
  trimestral: 9000,
  semestral:  16000,
  anual:      29000,
};

/**
 * Confirma la transacción con PayPhone.
 * Body: { id: number, clientTxId: string }
 * Headers: Authorization, Content-Type, Accept, User-Agent
 */
async function confirmTransaction({ transactionId, clientTransactionId }) {
  // 1. LIMPIEZA CRÍTICA: Eliminamos espacios o saltos de línea invisibles.
  // Esto es lo que suele causar el Error 500 de "Runtime Error" en ASP.NET.
  const cleanToken = PAYPHONE_TOKEN ? String(PAYPHONE_TOKEN).trim() : '';
  const cleanTransactionId = parseInt(String(transactionId).trim(), 10);
  const cleanClientTxId = String(clientTransactionId).trim();

  // 2. ARMAMOS EL BODY: Usamos 'clientTxId' como confirmaste que funciona en Postman
  const body = {
    id: cleanTransactionId,
    clientTxId: cleanClientTxId,
  };

  console.log('📤 PayPhone confirm body:', JSON.stringify(body));

  // 3. FETCH: Replicamos los headers exactos que garantizan la respuesta en JSON
  const res = await fetch(`${BASE_URL}/button/V2/Confirm`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      'User-Agent':    'PostmanRuntime/7.32.3', // Simulamos ser Postman por si hay un WAF bloqueando Node
      'Authorization': `Bearer ${cleanToken}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log('📥 PayPhone confirm status:', res.status);
  
  if (!res.ok) {
    console.error('❌ PayPhone confirm response (error):', text);
    throw new Error(`PayPhone confirm error ${res.status}`);
  }

  const data = JSON.parse(text);

  // statusCode 3 = Approved según el video oficial
  return {
    approved:      data.statusCode === 3,
    statusCode:    data.statusCode,
    statusMessage: data.transactionStatus,
    amount:        data.amount,
  };
}

module.exports = { confirmTransaction, PLAN_PRICES };
