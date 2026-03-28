/**
 * PayPhone - Cajita de Pagos
 * La cajita se renderiza en el FRONTEND con el SDK de PayPhone.
 */

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
 * Según la documentación oficial el body usa "id" y "clientTxId"
 */
async function confirmTransaction({ transactionId, clientTransactionId }) {
  // PayPhone espera "id" como número entero y "clientTxId"
  const body = {
    id:          parseInt(transactionId, 10),
    clientTxId:  clientTransactionId,
  };

  console.log('📤 PayPhone confirm body:', JSON.stringify(body));

  const res = await fetch(`${BASE_URL}/button/V2/Confirm`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${PAYPHONE_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log('📥 PayPhone confirm status:', res.status);
  console.log('📥 PayPhone confirm response:', text);

  if (!res.ok) {
    throw new Error(`PayPhone confirm error ${res.status}: ${text}`);
  }

  const data = JSON.parse(text);

  // statusCode 3 = aprobado
  return {
    approved:      data.statusCode === 3,
    statusCode:    data.statusCode,
    statusMessage: data.transactionStatus,
    amount:        data.amount,
  };
}

module.exports = { confirmTransaction, PLAN_PRICES };
