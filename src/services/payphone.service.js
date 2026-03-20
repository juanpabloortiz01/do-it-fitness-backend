/**
 * PayPhone - Cajita de Pagos
 * Documentación: https://docs.payphone.app/cajita-de-pagos-payphone
 */

const PAYPHONE_TOKEN    = process.env.PAYPHONE_TOKEN;
const PAYPHONE_STORE_ID = process.env.PAYPHONE_STORE_ID;
const BASE_URL          = 'https://pay.payphonetodoesposible.com/api';

// Precios en CENTAVOS (PayPhone trabaja con valores * 100)
const PLAN_PRICES = {
  mensual:    3500,  // $35.00
  trimestral: 9000,  // $90.00
  semestral:  16000, // $160.00
  anual:      29000, // $290.00
};

/**
 * Crea una transacción en PayPhone (Cajita de Pagos).
 * Endpoint: POST /api/button/Prepare
 */
async function createTransaction({ nombre, email, celular, plan, clientTransactionId }) {
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

  console.log('📤 PayPhone request:', JSON.stringify(body, null, 2));
  console.log('🔑 Token (primeros 20 chars):', PAYPHONE_TOKEN?.substring(0, 20));
  console.log('🏪 Store ID:', PAYPHONE_STORE_ID);

  const res = await fetch(`${BASE_URL}/button/Prepare`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${PAYPHONE_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  const responseText = await res.text();
  console.log('📥 PayPhone response status:', res.status);
  console.log('📥 PayPhone response body:', responseText);

  if (!res.ok) {
    throw new Error(`PayPhone error ${res.status}: ${responseText}`);
  }

  const data = JSON.parse(responseText);

  return {
    payPhoneTransactionId: data.transactionId,
    cajitaUrl: `https://pay.payphonetodoesposible.com/pay?transactionId=${data.transactionId}&clientTransactionId=${clientTransactionId}`,
  };
}

/**
 * Confirma una transacción luego del pago.
 * Endpoint: POST /api/button/V2/Confirm
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

  const responseText = await res.text();
  console.log('📥 PayPhone confirm status:', res.status);
  console.log('📥 PayPhone confirm body:', responseText);

  if (!res.ok) {
    throw new Error(`PayPhone confirm error ${res.status}: ${responseText}`);
  }

  const data = JSON.parse(responseText);

  // statusCode 3 = aprobado
  return {
    approved:      data.statusCode === 3,
    statusCode:    data.statusCode,
    statusMessage: data.transactionStatus,
    amount:        data.amount,
  };
}

module.exports = { createTransaction, confirmTransaction, PLAN_PRICES };
