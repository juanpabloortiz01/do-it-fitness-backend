const PAYPHONE_TOKEN    = process.env.PAYPHONE_TOKEN?.trim();
const PAYPHONE_STORE_ID = process.env.PAYPHONE_STORE_ID?.trim();
const BASE_URL          = 'https://pay.payphonetodoesposible.com/api';

const PLAN_PRICES = {
  mensual:    3500,
  trimestral: 7000,
  semestral:  16000,
  anual:      29000,
  'promo-estudiantes': 2320,
};

/**
 * Confirma la transacción con PayPhone.
 * Usa https nativo para evitar problemas de Chunked Transfer con Undici.
 */
async function confirmTransaction({ transactionId, clientTransactionId }) {
  const bodyObj = {
    id:        parseInt(transactionId, 10),
    clientTxId: clientTransactionId.trim(),
  };

  const bodyString = JSON.stringify(bodyObj);

  console.log('📤 PayPhone confirm body:', bodyString);
  console.log('🔑 Token (30 chars):', PAYPHONE_TOKEN?.substring(0, 30));

  const https = require('https');
  const url   = new URL(`${BASE_URL}/button/V2/Confirm`);

  const data = await new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      path:     url.pathname,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(bodyString, 'utf8'),
        'Accept':         'application/json',
        'Authorization':  `Bearer ${PAYPHONE_TOKEN}`,
        'User-Agent':     'PostmanRuntime/7.32.3',
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        console.log('📥 PayPhone confirm status:', res.statusCode);
        console.log('📥 PayPhone confirm response:', raw);
        if (res.statusCode !== 200) {
          reject(new Error(`PayPhone confirm error ${res.statusCode}: ${raw}`));
        } else {
          try {
            resolve(JSON.parse(raw));
          } catch {
            reject(new Error(`PayPhone JSON parse error: ${raw}`));
          }
        }
      });
    });

    req.on('error', reject);
    req.write(bodyString);
    req.end();
  });

  return {
    approved:      data.statusCode === 3,
    statusCode:    data.statusCode,
    statusMessage: data.transactionStatus,
    amount:        data.amount,
  };
}

module.exports = { confirmTransaction, PLAN_PRICES };
