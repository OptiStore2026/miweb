const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const PAYPAL_ENV = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase();
const PAYPAL_BASE = PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const processedEvents = new Map();
const PROCESSED_TTL_MS = 1000 * 60 * 60 * 24; // 24h in-memory dedupe

function rememberEvent(eventId) {
  processedEvents.set(eventId, Date.now());
}

function isDuplicate(eventId) {
  const ts = processedEvents.get(eventId);
  if (!ts) return false;
  if (Date.now() - ts > PROCESSED_TTL_MS) {
    processedEvents.delete(eventId);
    return false;
  }
  return true;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildTextReceipt({ orderId, total, currency, items }) {
  const lines = items.map((item) => {
    const qty = item.quantity || '1';
    const price = item.unit_amount?.value || item.price || '';
    const lineCurrency = item.unit_amount?.currency_code || currency || '';
    return `- ${item.name} x${qty} - ${price} ${lineCurrency}`.trim();
  });

  return [
    'Gracias por tu compra en OptiStore.',
    '',
    `ID del pedido: ${orderId}`,
    `Total: ${total} ${currency}`,
    '',
    'Productos:',
    ...lines,
  ].join('\n');
}

function buildHtmlReceipt({ orderId, total, currency, items }) {
  const itemsHtml = items.map((item) => {
    const qty = escapeHtml(item.quantity || '1');
    const name = escapeHtml(item.name || 'Producto');
    const price = escapeHtml(item.unit_amount?.value || item.price || '');
    const lineCurrency = escapeHtml(item.unit_amount?.currency_code || currency || '');
    return `<li>${name} x${qty} - ${price} ${lineCurrency}</li>`;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Gracias por tu compra en OptiStore</h2>
      <p><strong>ID del pedido:</strong> ${escapeHtml(orderId)}</p>
      <p><strong>Total:</strong> ${escapeHtml(total)} ${escapeHtml(currency)}</p>
      <h3>Productos</h3>
      <ul>${itemsHtml}</ul>
    </div>
  `;
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET.');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error obteniendo token PayPal: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function verifyPayPalWebhook(event, headers) {
  const token = await getPayPalAccessToken();

  const payload = {
    auth_algo: headers['paypal-auth-algo'],
    cert_url: headers['paypal-cert-url'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: process.env.PAYPAL_WEBHOOK_ID,
    webhook_event: event,
  };

  if (!payload.auth_algo || !payload.cert_url || !payload.transmission_id ||
      !payload.transmission_sig || !payload.transmission_time || !payload.webhook_id) {
    throw new Error('Faltan cabeceras PayPal para validar la firma o PAYPAL_WEBHOOK_ID.');
  }

  const response = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error verificando webhook PayPal: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.verification_status === 'SUCCESS';
}

async function fetchOrderDetails(orderId) {
  const token = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error obteniendo orden PayPal ${orderId}: ${response.status} ${text}`);
  }

  return response.json();
}

function extractOrderInfo(eventResource, orderData) {
  const captureAmount = eventResource?.amount || {};
  const captureTotal = captureAmount.value || '0.00';
  const captureCurrency = captureAmount.currency_code || 'USD';

  if (!orderData) {
    return {
      orderId: eventResource?.id || 'N/A',
      total: captureTotal,
      currency: captureCurrency,
      items: [
        {
          name: 'Compra PayPal',
          quantity: '1',
          unit_amount: { value: captureTotal, currency_code: captureCurrency },
        },
      ],
      buyerEmail: eventResource?.payer?.email_address || null,
    };
  }

  const purchaseUnit = orderData.purchase_units?.[0] || {};
  const items = (purchaseUnit.items || []).map((item) => ({
    name: item.name || 'Producto',
    quantity: item.quantity || '1',
    unit_amount: item.unit_amount || { value: '0.00', currency_code: captureCurrency },
  }));

  return {
    orderId: orderData.id || eventResource?.id || 'N/A',
    total: purchaseUnit.amount?.value || captureTotal,
    currency: purchaseUnit.amount?.currency_code || captureCurrency,
    items: items.length ? items : [
      {
        name: 'Compra PayPal',
        quantity: '1',
        unit_amount: { value: captureTotal, currency_code: captureCurrency },
      },
    ],
    buyerEmail: orderData.payer?.email_address || eventResource?.payer?.email_address || null,
  };
}

async function sendReceiptEmail({ to, orderId, total, currency, items }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const text = buildTextReceipt({ orderId, total, currency, items });
  const html = buildHtmlReceipt({ orderId, total, currency, items });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `Tu compra en OptiStore (${orderId})`,
    text,
    html,
  });
}

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});

app.post('/webhook/paypal', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch (err) {
    return res.status(400).send('Payload inválido');
  }

  try {
    const isValid = await verifyPayPalWebhook(event, req.headers);
    if (!isValid) {
      return res.status(400).send('Firma PayPal inválida');
    }

    if (isDuplicate(event.id)) {
      return res.status(200).send('Evento duplicado');
    }

    rememberEvent(event.id);

    if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      return res.status(200).send('Evento ignorado');
    }

    const resource = event.resource || {};
    const orderId = resource?.supplementary_data?.related_ids?.order_id || null;

    let orderData = null;
    if (orderId) {
      try {
        orderData = await fetchOrderDetails(orderId);
      } catch (err) {
        console.error(err);
      }
    }

    const { buyerEmail, items, total, currency, orderId: resolvedOrderId } =
      extractOrderInfo(resource, orderData);

    if (!buyerEmail) {
      console.warn('No se encontro email del comprador.');
      return res.status(200).send('Sin email del comprador');
    }

    await sendReceiptEmail({
      to: buyerEmail,
      orderId: resolvedOrderId,
      total,
      currency,
      items,
    });

    return res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error interno');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
