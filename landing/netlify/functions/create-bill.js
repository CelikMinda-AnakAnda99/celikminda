// CelikMinda — Create ToyyibPay Bill
// Netlify Serverless Function
// Calls ToyyibPay sandbox API to create a bill, returns bill URL

const https = require('https');
const querystring = require('querystring');

function postToyyibPay(path, data) {
  return new Promise((resolve, reject) => {
    const body = querystring.stringify(data);
    const req = https.request({
      hostname: 'toyyibpay.com',
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error('ToyyibPay response: ' + d)); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { name, email, phone } = JSON.parse(event.body);
    if (!name || !email || !phone) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Sila isi semua maklumat.' }) };

    // Get env vars (set in Netlify dashboard)
    const TOYYIBPAY_SECRET = process.env.TOYYIBPAY_SECRET || 'qtao61bl-e6j1-bawp-5qj8-vaqsyxw5i4zs';
    const TOYYIBPAY_CATEGORY = process.env.TOYYIBPAY_CATEGORY || 'i9in6ad7';
    const SITE_URL = process.env.URL || 'https://celikminda.netlify.app';
    console.log('DEBUG: secret=' + TOYYIBPAY_SECRET.substring(0,8) + '..., category=' + TOYYIBPAY_CATEGORY + ', url=' + SITE_URL);

    const billData = {
      userSecretKey: TOYYIBPAY_SECRET,
      categoryCode: TOYYIBPAY_CATEGORY,
      billName: 'CelikMinda',
      billDescription: 'Akses penuh CelikMinda — 4 Dunia, 29 Permainan',
      billPriceSetting: 1, // fixed
      billPayorInfo: 1, // required
      billAmount: '100', // RM1.00 in cents (TESTING)
      billReturnUrl: SITE_URL + '/?status_id=1',
      billCallbackUrl: SITE_URL + '/.netlify/functions/payment-callback?email=' + encodeURIComponent(email) + '&name=' + encodeURIComponent(name) + '&phone=' + encodeURIComponent(phone),
      billExternalReferenceNo: 'CM-' + Date.now(),
      billTo: name,
      billEmail: email,
      billPhone: phone,
      billSplitPayment: 0,
      billSplitPaymentArgs: '',
      billPaymentChannel: 0, // FPX only
      billContentEmail: 'Terima kasih kerana membeli CelikMinda! Emel akses anda akan dihantar dari celikminda9799@gmail.com dalam beberapa minit. PENTING: Sila semak juga folder Spam/Junk jika tidak nampak emel tersebut di Inbox.',
      billChargeToCustomer: 1, // charge to buyer
      billExpiryDate: '',
      billExpiryDays: 3
    };

    const result = await postToyyibPay('/index.php/api/createBill', billData);

    if (result && result[0] && result[0].BillCode) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ billUrl: 'https://toyyibpay.com/' + result[0].BillCode })
      };
    } else {
      console.error('ToyyibPay error:', JSON.stringify(result));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Gagal membuat bil. Sila cuba semula.' }) };
    }
  } catch (err) {
    console.error('create-bill error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
