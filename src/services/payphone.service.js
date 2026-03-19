/**
 * PayPhone - Cajita de Pagos
 * Documentación: https://docs.payphone.app
 */

const PAYPHONE_TOKEN    = process.env.PAYPHONE_TOKEN;
const PAYPHONE_STORE_ID = process.env.PAYPHONE_STORE_ID;
const BASE_URL          = 'https://pay.payphonetodoesposible.com/api';

// Precios en CENTAVOS (PayPhone trabaja en centavos)
const PLAN_PRICES = {
  mensual:    3500,  // $35.00
  trimestral: 9000,  // $90.00
  semestral:  16000, // $160.00
  anual:      29000, // $290.00
};

/**
 * Crea una transacción en PayPhone.
 * Devuelve el paymentId y la URL de la cajita de pagos.
 */
async function createTransaction({ nombre, email, celular, plan, clientTransactionId }) {
  const monto = PLAN_PRICES[plan.toLowerCase()];
  if (!monto) throw new Error(`Plan inválido: ${plan}`);

  const body = {
    amount:              monto,
    amountWithoutTax:    monto,
    amountWithTax:       0,
    tax:                 0,
    currency:            'USD',
    clientTransactionId, // ID único nuestro — lo usamos para vincular con Supabase
    storeId:             PAYPHONE_STORE_ID,
    reference:           `Membresía ${plan} - Do It Fitness Club`,
    // URL a la que PayPhone redirige tras el pago (confirmación final vía query params)
    responseUrl: `${process.env.FRONTEND_URL}/membresia/confirmacion`,
    cancellationUrl: `${process.env.FRONTEND_URL}/membresia/cancelado`,
    // Datos del cliente (opcionales pero útiles para el panel de PayPhone)
    email,
    phoneNumber: celular,
    documentId:  '',
  };

  const res = await fetch(`${BASE_URL}/button/Prepare`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${PAYPHONE_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPhone error: ${err}`);
  }

  const data = await res.json();

  return {
    payPhoneTransactionId: data.transactionId,
    // URL de la cajita de pagos que se carga en el iframe del frontend
    cajitaUrl: `https://pay.payphonetodoesposible.com/pay?transactionId=${data.transactionId}&clientTransactionId=${clientTransactionId}`,
  };
}

/**
 * Confirma una transacción luego de que el cliente paga.
 * PayPhone redirige al frontend con ?transactionId=...&clientTransactionId=...
 * El frontend llama a nuestro backend con esos datos para confirmar.
 */
async function confirmTransaction({ transactionId, clientTransactionId }) {
  const res = await fetch(
    `${BASE_URL}/button/V2/Confirm?transactionId=${transactionId}&clientTransactionId=${clientTransactionId}`,
    {
      method:  'GET',
      headers: {
        'Authorization': `Bearer ${PAYPHONE_TOKEN}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPhone confirm error: ${err}`);
  }

  const data = await res.json();

  // statusCode 3 = aprobado
  return {
    approved:      data.statusCode === 3,
    statusCode:    data.statusCode,
    statusMessage: data.transactionStatus,
    amount:        data.amount,
  };
}

module.exports = { createTransaction, confirmTransaction, PLAN_PRICES };
