// CelikMinda — Payment Callback from ToyyibPay
// 1. Verify payment
// 2. Create Supabase Auth user (email + random password)
// 3. Record payment in Supabase
// 4. Send welcome email with credentials via Gmail SMTP

const https = require('https');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const SUPABASE_URL = 'mrqozhhpyrdapedbsauc.supabase.co';
const GAME_URL = 'https://celikminda-anakanda99.github.io/celikminda/';

function generatePassword() {
  return 'CM-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function supabaseRequest(method, path, body, serviceKey, extraHeaders) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: SUPABASE_URL, path, method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Prefer': 'return=representation',
        ...(extraHeaders || {})
      }
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d || '{}') }); }
        catch { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function sendWelcomeEmail(toEmail, toName, password) {
  const GMAIL_USER = process.env.GMAIL_USER || 'celikminda9799@gmail.com';
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_APP_PASSWORD) {
    console.log('GMAIL_APP_PASSWORD not configured. Credentials:', { email: toEmail, password });
    return { sent: false };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
  });

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#FAFAFF;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#7C3AED,#4F46E5);padding:32px;text-align:center">
        <h1 style="color:white;font-size:28px;margin:0">Selamat Datang ke CelikMinda!</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px">Terima kasih atas pembelian anda, ${toName}.</p>
      </div>
      <div style="padding:32px">
        <p style="font-size:16px;color:#374151;margin-bottom:20px">Pembayaran anda telah berjaya. Berikut adalah maklumat akses anda:</p>
        <div style="background:white;border:2px solid rgba(124,58,237,0.12);border-radius:12px;padding:24px;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#6B7280;font-size:14px">Link Aplikasi</td><td style="padding:8px 0;font-weight:700;color:#7C3AED;font-size:14px"><a href="${GAME_URL}" style="color:#7C3AED">${GAME_URL}</a></td></tr>
            <tr><td style="padding:8px 0;color:#6B7280;font-size:14px;border-top:1px solid #F3F4F6">Emel Log Masuk</td><td style="padding:8px 0;font-weight:700;color:#1E1B4B;font-size:14px;border-top:1px solid #F3F4F6">${toEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#6B7280;font-size:14px;border-top:1px solid #F3F4F6">Kata Laluan</td><td style="padding:8px 0;font-weight:700;color:#1E1B4B;font-size:16px;letter-spacing:1px;border-top:1px solid #F3F4F6">${password}</td></tr>
          </table>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${GAME_URL}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#4F46E5);color:white;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:16px">Mula Bermain Sekarang</a>
        </div>
        <p style="font-size:13px;color:#9CA3AF;text-align:center;margin-top:24px">Simpan emel ini untuk rujukan. Jangan kongsikan kata laluan anda.</p>
      </div>
      <div style="background:#F9FAFB;padding:20px;text-align:center;border-top:1px solid #E5E7EB">
        <p style="font-size:12px;color:#9CA3AF;margin:0">CelikMinda &mdash; Aplikasi Pendidikan No.1 Untuk Anak Malaysia</p>
        <p style="font-size:12px;color:#9CA3AF;margin:4px 0 0">Soalan? Hubungi celikminda9799@gmail.com</p>
      </div>
    </div>
  `;

  const text = `Selamat Datang ke CelikMinda!

Terima kasih atas pembelian anda, ${toName}.

Maklumat akses anda:
- Link Aplikasi: ${GAME_URL}
- Emel Log Masuk: ${toEmail}
- Kata Laluan: ${password}

Sila log masuk di ${GAME_URL} menggunakan maklumat di atas.

Simpan emel ini untuk rujukan. Jangan kongsikan kata laluan anda.

Soalan? Hubungi celikminda9799@gmail.com

CelikMinda - Aplikasi Pendidikan No.1 Untuk Anak Malaysia`;

  await transporter.sendMail({
    from: `"CelikMinda" <${GMAIL_USER}>`,
    replyTo: GMAIL_USER,
    to: toEmail,
    subject: `CelikMinda - Maklumat Akses Anda`,
    text,
    html
  });

  console.log('Welcome email sent to:', toEmail);
  return { sent: true };
}

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok' }) };
  }

  try {
    const params = new URLSearchParams(event.body);
    const billCode = params.get('billcode') || params.get('billCode') || '';
    const status = params.get('status') || params.get('status_id') || '';
    const transactionId = params.get('transaction_id') || params.get('order_id') || '';
    const refNo = params.get('refno') || params.get('billExternalReferenceNo') || '';

    // ToyyibPay callback POST body + query params from callback URL
    const qs = event.queryStringParameters || {};
    let billEmail = params.get('billEmail') || params.get('email') || qs.email || '';
    let billName = params.get('billName') || params.get('name') || qs.name || '';
    let billPhone = params.get('billPhone') || params.get('phone') || qs.phone || '';

    console.log('Callback received:', { billCode, status, transactionId, billEmail, billName, refNo, qs: JSON.stringify(qs) });

    if (status !== '1') {
      console.log('Payment failed. Status:', status);
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'not_paid' }) };
    }

    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SERVICE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'config' }) };
    }

    // If ToyyibPay didn't send buyer info, fetch from bill
    if (!billEmail && billCode) {
      try {
        const billInfo = await new Promise((resolve, reject) => {
          const qry = require('querystring').stringify({ billCode, userSecretKey: process.env.TOYYIBPAY_SECRET || '' });
          const req = https.request({ hostname: 'toyyibpay.com', path: '/index.php/api/getBillTransactions', method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(qry) } },
            res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{try{resolve(JSON.parse(d))}catch{resolve([])}}); });
          req.on('error', reject); req.write(qry); req.end();
        });
        if (billInfo && billInfo[0]) {
          billEmail = billInfo[0].billEmail || billEmail;
          billName = billInfo[0].billName || billName;
          billPhone = billInfo[0].billPhone || billPhone;
        }
      } catch(e) { console.log('Could not fetch bill info:', e.message); }
    }

    if (!billEmail) {
      console.error('No email found in callback or bill');
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No email' }) };
    }

    // Generate password
    const password = generatePassword();

    // Create Supabase Auth user
    const createResult = await supabaseRequest('POST', '/auth/v1/admin/users', {
      email: billEmail,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: billName, phone: billPhone, plan: 'complete', bill_code: billCode }
    }, SERVICE_KEY);

    let userId = null;

    if (createResult.status === 200 || createResult.status === 201) {
      userId = createResult.data.id;
      console.log('New user:', userId);
    } else if (createResult.status === 422 || (createResult.data && JSON.stringify(createResult.data).includes('already'))) {
      // User exists — find and update password
      const list = await supabaseRequest('GET', '/auth/v1/admin/users?per_page=1000', null, SERVICE_KEY);
      if (list.data?.users) {
        const u = list.data.users.find(x => x.email === billEmail);
        if (u) {
          userId = u.id;
          await supabaseRequest('PUT', `/auth/v1/admin/users/${userId}`, { password }, SERVICE_KEY);
          console.log('Updated existing user:', userId);
        }
      }
    } else {
      console.error('Create user failed:', JSON.stringify(createResult));
    }

    // Record payment
    await supabaseRequest('POST', '/rest/v1/payments', {
      user_id: userId, email: billEmail, name: billName, phone: billPhone,
      amount: 49.90, plan: 'complete', bill_code: billCode,
      transaction_id: transactionId || refNo, status: 'paid',
      paid_at: new Date().toISOString(), payment_method: 'fpx'
    }, SERVICE_KEY);

    // Update profile — store temp password for admin visibility (upsert with merge)
    if (userId) {
      await supabaseRequest('POST', '/rest/v1/profiles?on_conflict=id', {
        id: userId, email: billEmail, child_name: '', package: 'complete',
        temp_password: password, must_setup: true
      }, SERVICE_KEY, { 'Prefer': 'resolution=merge-duplicates' });
    }

    // Send welcome email
    await sendWelcomeEmail(billEmail, billName || 'Pengguna CelikMinda', password);

    return { statusCode: 200, headers, body: JSON.stringify({ status: 'success', userId }) };
  } catch (err) {
    console.error('Callback error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
