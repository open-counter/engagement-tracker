// api/sharepoint-proxy.js — Vercel serverless function

export const config = { api: { bodyParser: true } }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const flowUrl = process.env.SHAREPOINT_FLOW_URL
  if (!flowUrl) return res.status(500).json({ error: 'SHAREPOINT_FLOW_URL not configured' })

  try {
    const raw = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const record = raw.record || {}

    // Build clean record — only include travel date/cost fields if travel is needed
    const cleanRecord = {
      id:                   record.id || '',
      event_title:          record.event_title || '',
      institution:          record.institution || '',
      stakeholder_name:     record.stakeholder_name || '',
      contact_email:        record.contact_email || '',
      date:                 record.date || '',
      type:                 record.type || '',
      objective:            record.objective || '',
      status:               record.status || '',
      owner:                record.owner || '',
      notes:                record.notes || '',
      act_category:         record.act_category || '',
      eng_vector:           record.eng_vector || '',
      act_format:           record.act_format || '',
      act_type:             record.act_type || '',
      travel_needed:        record.travel_needed ?? false,
      travel_justification: record.travel_justification || '',
    }

    // Only add date and cost fields if travel is actually needed
    if (record.travel_needed) {
      if (record.travel_start) cleanRecord.travel_start = record.travel_start
      if (record.travel_end)   cleanRecord.travel_end   = record.travel_end
      if (record.travel_cost)  cleanRecord.travel_cost  = Number(record.travel_cost)
    }

    const payload = { ...raw, record: cleanRecord }

    const response = await fetch(flowUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const text = await response.text()
    console.log('Flow response:', response.status, text.slice(0, 300))

    if (response.ok || response.status === 202) {
      return res.status(200).json({ ok: true })
    }

    return res.status(200).json({ ok: false, flowStatus: response.status, flowBody: text.slice(0, 500) })

  } catch (err) {
    console.error('Proxy error:', err)
    return res.status(500).json({ error: err.message })
  }
}
