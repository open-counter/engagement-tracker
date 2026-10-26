import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function parseSender(value = '') {
  const raw = String(value).trim()
  const angleMatch = raw.match(/^(.*?)\s*<([^<>@\s]+@[^<>@\s]+)>$/)
  if (angleMatch) {
    return {
      name: angleMatch[1].trim().replace(/^["']|["']$/g, ''),
      email: angleMatch[2].trim().toLowerCase()
    }
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return { name: '', email: raw.toLowerCase() }
  }
  return { name: raw, email: '' }
}

function cleanEmailText(value = '') {
  let text = String(value)
  text = text.replace(
    /^EXTERNAL:\s*Use caution when clicking on links or opening attachments\.?\s*/i,
    ''
  )
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (req.headers['x-tracker-secret'] !== process.env.OUTLOOK_INGEST_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { userId, message } = req.body || {}
  const sender = parseSender(message?.senderEmail || message?.senderName || '')

  if (!userId || !message?.id || !message?.senderEmail) {
    return res.status(400).json({
      error: 'userId, message.id and message.senderEmail are required'
    })
  }

  const senderEmail = sender.email || String(message.senderEmail || '').trim().toLowerCase()
  const senderName = sender.name || message.senderName || senderEmail || 'Unknown sender'
  const now = new Date().toISOString()

  const { data: existing, error: lookupError } = await supabase
    .from('tracker_inbox')
    .select('id,status,engagement_id')
    .eq('user_id', userId)
    .eq('outlook_message_id', String(message.id))
    .maybeSingle()

  if (lookupError) {
    return res.status(500).json({ error: lookupError.message })
  }

  // A previously converted message must not create another engagement.
  if (existing?.status === 'converted') {
    return res.status(200).json({
      ok: true,
      item: existing,
      action: 'already_converted'
    })
  }

  const row = {
    user_id: userId,
    outlook_message_id: String(message.id),
    internet_message_id: message.internetMessageId || null,
    sender_name: senderName,
    sender_email: senderEmail,
    subject: message.subject || '',
    received_at: message.receivedAt || now,
    body_preview: cleanEmailText(message.bodyPreview || ''),
    body_text: cleanEmailText(message.bodyText || message.bodyPreview || ''),
    source: 'outlook',
    status: 'new',
    engagement_id: null,
    updated_at: now
  }

  if (existing) {
    // Re-flagging an ignored message restores the same record to the Tracker Inbox.
    const { data, error } = await supabase
      .from('tracker_inbox')
      .update(row)
      .eq('id', existing.id)
      .select('id,status')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({
      ok: true,
      item: data,
      action: existing.status === 'ignored' ? 'restored' : 'refreshed'
    })
  }

  const { data, error } = await supabase
    .from('tracker_inbox')
    .insert(row)
    .select('id,status')
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true, item: data, action: 'created' })
}
