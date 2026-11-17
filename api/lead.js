const ALLOWED_TYPES = new Set(['contact', 'quote', 'audit', 'fault']);
const MAX_ATTACHMENT_BYTES = 1.5 * 1024 * 1024;

function clean(value, maxLength = 4000) {
  if (Array.isArray(value)) return value.map(item => clean(item, 300)).filter(Boolean).join(', ');
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return clean(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async function leadHandler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  // Only accept requests submitted by the same site origin.
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return res.status(403).json({ success: false, message: 'Request origin not allowed.' });
      }
    } catch (_) {
      return res.status(403).json({ success: false, message: 'Request origin not allowed.' });
    }
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch (_) { payload = null; }
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json({ success: false, message: 'Please check the form and try again.' });
  }

  // A filled honeypot field is treated as a bot submission.
  if (clean(payload.website, 200)) return res.status(200).json({ success: true });

  const type = clean(payload.type, 30).toLowerCase();
  if (!ALLOWED_TYPES.has(type)) {
    return res.status(400).json({ success: false, message: 'The request type is not recognised.' });
  }

  const name = clean(payload.name || payload.contactPerson || payload.property || 'Website visitor', 120);
  const phone = clean(payload.phone, 40);
  const email = clean(payload.email, 180);

  if (!phone || (type !== 'fault' && !name)) {
    return res.status(400).json({ success: false, message: 'Please enter your name and phone number.' });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  const labels = {
    contact: 'General website enquiry',
    quote: 'Quotation request',
    audit: 'Fire safety site visit request',
    fault: 'Fire safety system fault report'
  };

  const fields = [
    ['Name', name],
    ['Phone', phone],
    ['Email', email],
    ['Organisation', clean(payload.organization, 180)],
    ['Subject', clean(payload.subject, 180)],
    ['Requirement', clean(payload.requirement, 240)],
    ['Facility', clean(payload.facility || payload.propertyType, 180)],
    ['Property / Building', clean(payload.property, 220)],
    ['Location', clean(payload.location, 220)],
    ['Approximate size', clean(payload.size, 100)],
    ['Existing systems', clean(payload.systems, 500)],
    ['Service needed', clean(payload.serviceNeeded, 220)],
    ['System affected', clean(payload.system, 180)],
    ['Preferred date', clean(payload.preferredDate, 50)],
    ['Preferred time', clean(payload.preferredTime, 100)],
    ['Message / Details', clean(payload.message || payload.details || payload.notes, 6000)]
  ].filter(entry => entry[1]);

  let attachment;
  if (payload.attachment && typeof payload.attachment === 'object') {
    const filename = clean(payload.attachment.filename, 120).replace(/[^a-zA-Z0-9._ -]/g, '_');
    const contentType = clean(payload.attachment.contentType, 80).toLowerCase();
    const content = clean(payload.attachment.content, 3 * 1024 * 1024);
    const supportedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);

    if (!filename || !content || !supportedTypes.has(contentType) || !/^[A-Za-z0-9+/]+=*$/.test(content)) {
      return res.status(400).json({ success: false, message: 'The attachment must be a PDF, JPG or PNG file.' });
    }

    const approxBytes = Math.floor(content.length * 3 / 4);
    if (approxBytes > MAX_ATTACHMENT_BYTES) {
      return res.status(400).json({ success: false, message: 'The attachment is too large. Please choose a file under 1.5 MB.' });
    }

    attachment = { filename, content, content_type: contentType };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const recipients = (process.env.LEADS_TO || 'samarthfireprotectionsystem@gmail.com')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  if (!apiKey || !from) {
    return res.status(503).json({
      success: false,
      message: 'Email sending is not configured yet. Please call 99671 01472 or use WhatsApp while we finish setup.'
    });
  }

  const subject = '[Samarth Fire Website] ' + labels[type] + ' — ' + name;
  const text = [
    labels[type],
    '',
    ...fields.map(([label, value]) => label + ': ' + value),
    '',
    'Submitted from samarthfire.in'
  ].join('\n');

  const htmlRows = fields.map(([label, value]) =>
    '<tr><th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;vertical-align:top">' +
    escapeHtml(label) +
    '</th><td style="padding:8px;border-bottom:1px solid #e5e7eb;white-space:pre-wrap">' +
    escapeHtml(value) +
    '</td></tr>'
  ).join('');

  const emailBody = {
    from,
    to: recipients,
    subject,
    text,
    html: '<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#1f2937"><h2 style="color:#991b1b">' +
      escapeHtml(labels[type]) +
      '</h2><p>A new request was submitted through the Samarth Fire website.</p><table style="width:100%;border-collapse:collapse">' +
      htmlRows +
      '</table><p style="font-size:12px;color:#6b7280;margin-top:20px">Samarth Fire Protection System · Website enquiry</p></div>',
    ...(email ? { reply_to: email } : {}),
    ...(attachment ? { attachments: [attachment] } : {})
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailBody)
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Resend email send failed:', response.status, result);
      return res.status(502).json({
        success: false,
        message: 'The email could not be sent just now. Please use WhatsApp or call our team.'
      });
    }

    return res.status(200).json({ success: true, id: result.id || null });
  } catch (error) {
    console.error('Website lead email error:', error);
    return res.status(502).json({
      success: false,
      message: 'The email service could not be reached. Please use WhatsApp or call our team.'
    });
  }
};
