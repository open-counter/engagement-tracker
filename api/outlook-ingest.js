import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (req.headers['x-tracker-secret'] !== process.env.OUTLOOK_INGEST_SECRET) return res.status(401).json({ error: 'Unauthorized' })
  const { userId, message } = req.body || {}
  if (!userId || !message?.id || !message?.senderEmail) return res.status(400).json({ error: 'userId, message.id and message.senderEmail are required' })
  const row = {
    user_id:userId, outlook_message_id:String(message.id), internet_message_id:message.internetMessageId||null,
    sender_name:message.senderName||'', sender_email:String(message.senderEmail).toLowerCase(), subject:message.subject||'',
    received_at:message.receivedAt||new Date().toISOString(), body_preview:message.bodyPreview||'', body_text:message.bodyText||'',
    source:'outlook', status:'new', updated_at:new Date().toISOString()
  }
  const { data, error } = await supabase.from('tracker_inbox').upsert(row,{onConflict:'user_id,outlook_message_id',ignoreDuplicates:true}).select('id,status').maybeSingle()
  if (error) return res.status(500).json({ error:error.message })
  return res.status(200).json({ ok:true, item:data||null })
}
