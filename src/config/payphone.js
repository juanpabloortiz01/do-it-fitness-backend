// Configuración de PayPhone
// Token y Store ID se obtienen en: appdeveloper.payphonetodoesposible.com

module.exports = {
  token:   process.env.PAYPHONE_TOKEN,
  storeId: process.env.PAYPHONE_STORE_ID,
  baseUrl: 'https://pay.payphonetodoesposible.com/api',
};
