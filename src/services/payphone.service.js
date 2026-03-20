/**
 * PayPhone - Cajita de Pagos
 * La cajita se renderiza en el FRONTEND con el SDK de PayPhone.
 * El backend solo prepara la transacción y devuelve el transactionId.
 */

const PAYPHONE_TOKEN    = process.env.PAYPHONE_TOKEN;
const PAYPHONE_STORE_ID = process.env.PAYPHONE_STORE_ID;
const BASE_URL          = 'https://pay.payphonetodoesposible.com/api';

// Precios en CENTAVOS
const PLAN_PRICES = {
  mensual:    3500,
  trimestral: 9000,
  semestral:  16000,
  anual:      29000,
};

/**
 * Prepara la transacción en PayPhone y devuelve el transactionId.
 * El frontend usa este ID para renderizar la cajita de pagos.
 */
async function prepareTransaction({ nombre, email, celular, plan, clientTransactionId }) {
  const monto = PLAN_PRICES[plan.toLowerCase()];
  if (!monto) throw new Error(`Plan inválido: ${plan}`);

  const body = {
    amount:              monto,
    amountWithoutTax:    monto,
    amountWithTax:       0,
    tax:                 0,
    service:             0,
    tip:                 0,
    currency:            'USD',
    clientTransactionId,
    storeId:             PAYPHONE_STORE_ID,
    reference:           `Membresía ${plan} - Do It Fitness Club`,
    responseUrl:         `${process.env.FRONTEND_URL}/membresia/confirmacion`,
    cancellationUrl:     `${process.env.FRONTEND_URL}/membresia/cancelado`,
    email,
    phoneNumber:         celular,
    documentId:          '',
    firstName:           nombre,
  };

  console.log('📤 PayPhone prepare request body:', JSON.stringify(body));
  console.log('🔑 Token primeros 30 chars:', PAYPHONE_TOKEN?.substring(0, 30));
  console.log('🏪 StoreID:', PAYPHONE_STORE_ID);

  const res = await fetch(`${BASE_URL}/button/Prepare`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${PAYPHONE_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log('📥 PayPhone status:', res.status);
  console.log('📥 PayPhone response:', text);

  if (!res.ok) {
    throw new Error(`PayPhone error ${res.status}: ${text}`);
  }

  const data = JSON.parse(text);
  return {
    transactionId:       data.transactionId,
    clientTransactionId,
  };
}

/**
 * Confirma la transacción después del pago.
 */
async function confirmTransaction({ transactionId, clientTransactionId }) {
  const body = { transactionId, clientTransactionId };

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

  if (!res.ok) throw new Error(`PayPhone confirm error ${res.status}: ${text}`);

  const data = JSON.parse(text);
  return {
    approved:      data.statusCode === 3,
    statusCode:    data.statusCode,
    statusMessage: data.transactionStatus,
    amount:        data.amount,
  };
}

module.exports = { prepareTransaction, confirmTransaction, PLAN_PRICES };
