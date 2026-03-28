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
 * Confirma la transacción con PayPhone forzando Content-Length.
 */
async function confirmTransaction({ transactionId, clientTransactionId }) {
  const cleanToken = PAYPHONE_TOKEN ? String(PAYPHONE_TOKEN).trim() : '';
  
  const bodyObj = {
    id: parseInt(String(transactionId).trim(), 10),
    clientTxId: String(clientTransactionId).trim(),
  };

  const bodyString = JSON.stringify(bodyObj);
  
  // 👉 EL FIX DEFINITIVO: Calculamos el peso exacto en bytes del JSON
  const contentLength = Buffer.byteLength(bodyString, 'utf8');

  console.log('📤 PayPhone confirm body:', bodyString);
  console.log('📏 Content-Length calculado:', contentLength);

  const res = await fetch(`${BASE_URL}/button/V2/Confirm`, {
    method:  'POST',
    headers: {
      'Content-Type':   'application/json',
      'Accept':         'application/json',
      'User-Agent':     'PostmanRuntime/7.32.3',
      'Authorization':  `Bearer ${cleanToken}`,
      'Content-Length': contentLength.toString(), // 👉 Evita que ASP.NET crashee
      'Connection':     'keep-alive' 
    },
    body: bodyString,
  });

  const text = await res.text();
  console.log('📥 PayPhone confirm status:', res.status);
  
  if (!res.ok) {
    console.error('❌ PayPhone confirm error response:', text.substring(0, 200) + '...');
    throw new Error(`PayPhone confirm error ${res.status}`);
  }

  const data = JSON.parse(text);

  return {
    approved:      data.statusCode === 3,
    statusCode:    data.statusCode,
    statusMessage: data.transactionStatus,
    amount:        data.amount,
  };
}

module.exports = { confirmTransaction, PLAN_PRICES };
