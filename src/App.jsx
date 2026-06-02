import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { EMAILS, LAST_FETCHED } from './emailData.js'

// ── Design tokens ─────────────────────────────────────────────────────────────
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const C = {
  black:       '#000000',
  white:       '#FFFFFF',
  bg:          '#F7F7F5',
  accent:      '#50a0cd',
  mid:         '#666666',
  light:       '#999999',
  border:      '#CCCCCC',
  borderLight: '#EBEBEB',
  red:         '#C0392B',
  amber:       '#e67e22',
  green:       '#27ae60',
  navy:        '#2c3e50',
  purple:      '#8e44ad',
}

const ROLES      = ['Executive', 'Program Leadership', 'Faculty', 'Academic Support', 'Student Services', 'IT', 'Library']
const TYPES      = ['Meeting', 'Call', 'Email', 'Conference', 'Demo', 'Workshop', 'Other']
const OBJECTIVES = ['Awareness', 'Staff and Student Engagement', 'AI Innovation and Leadership', 'Curriculum Support', 'IT/Tech Support']
const STATUSES   = ['Active', 'Follow-up needed', 'On hold', 'Closed']
const PRIORITIES = ['High', 'Medium', 'Low']

const ROLE_COLORS   = { Executive: C.navy, 'Program Leadership': C.purple, Faculty: C.black, 'Academic Support': C.accent, 'Student Services': C.green, IT: C.amber, Library: C.mid }
const OBJ_COLORS    = { Awareness: C.accent, 'Staff and Student Engagement': C.green, 'AI Innovation and Leadership': C.purple, 'Curriculum Support': C.amber, 'IT/Tech Support': C.black }
const STATUS_COLORS = { Active: C.green, 'Follow-up needed': C.amber, 'On hold': C.mid, Closed: C.light }
const PRI_COLORS    = { High: C.red, Medium: C.amber, Low: C.green }

// ── Style helpers ─────────────────────────────────────────────────────────────
const inp = {
  width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`,
  fontSize: 13, fontFamily: FONT, background: C.white, color: C.black,
  outline: 'none', borderRadius: 0, display: 'block', marginBottom: 10,
}
const sel = { ...inp, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }
const tex = { ...inp, resize: 'vertical', minHeight: 70, lineHeight: 1.5 }

function Tag({ color, outline, small, children }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: small ? 8 : 9, fontWeight: 700,
      letterSpacing: 1, textTransform: 'uppercase', padding: '2px 6px',
      background: outline ? 'transparent' : (color || C.accent),
      color: outline ? C.mid : C.white,
      border: outline ? `0.5px solid ${C.border}` : 'none',
      fontFamily: FONT, whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}
function SEP() { return <span style={{ color: C.accent, margin: '0 5px' }}>|</span> }
function FieldLabel({ children }) {
  return <label style={{ fontSize: 11, fontWeight: 700, color: C.mid, marginBottom: 4, letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: FONT, display: 'block' }}>{children}</label>
}
function SectionHead({ label, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, paddingBottom: 7, borderBottom: `1px solid ${C.black}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: 2, textTransform: 'uppercase', fontFamily: FONT }}>{label}</div>
      {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
    </div>
  )
}
function Divider() { return <div style={{ height: 1, background: C.borderLight, margin: '12px 0' }} /> }

function Btn({ label, onClick, ghost, danger, accent, orange, small, disabled, style, children }) {
  const bg    = ghost ? 'transparent' : danger ? 'transparent' : orange ? C.amber : accent ? C.accent : C.black
  const color = ghost ? C.mid : danger ? C.red : C.white
  const bdr   = ghost ? `1px solid ${C.border}` : danger ? `1px solid ${C.red}` : 'none'
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      background: disabled ? '#ccc' : bg, color: disabled ? '#fff' : color,
      border: bdr, borderRadius: 0,
      padding: small ? '6px 10px' : '10px 16px',
      fontSize: small ? 10 : 12, fontWeight: 700, fontFamily: FONT,
      cursor: disabled ? 'not-allowed' : 'pointer', letterSpacing: '0.5px',
      ...(style || {}),
    }}>{label}{children}</button>
  )
}

function Modal({ title, accentColor, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, overflowY: 'auto', padding: '40px 20px' }} onClick={onClose}>
      <div style={{ background: C.white, maxWidth: 560, margin: '0 auto', borderTop: `4px solid ${accentColor || C.accent}` }} onClick={e => e.stopPropagation()}>
        <div style={{ background: C.black, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: C.white, fontFamily: FONT }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.light, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.black, color: C.white, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '10px 20px', borderTop: `3px solid ${C.accent}`, zIndex: 9999, fontFamily: FONT }}>
      {msg}
    </div>
  )
}

function Avatar({ name, size = 30 }) {
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#e8f4fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: C.accent, flexShrink: 0, fontFamily: FONT }}>
      {initials}
    </div>
  )
}

// ── Engagement form ───────────────────────────────────────────────────────────
function EngagementForm({ initial, stakeholders, onSave, onClose }) {
  const [inst, setInst]       = useState(initial?.institution || '')
  const [stakeId, setStakeId] = useState(initial?.stakeholder_id || '')
  const [date, setDate]       = useState(initial?.date || new Date().toISOString().slice(0, 10))
  const [type, setType]       = useState(initial?.type || 'Meeting')
  const [obj, setObj]         = useState(initial?.objective || '')
  const [status, setStatus]   = useState(initial?.status || 'Active')
  const [owner, setOwner]     = useState(initial?.owner || 'Al Briggs')
  const [notes, setNotes]     = useState(initial?.notes || '')
  const [actions, setActions] = useState(initial?.actions || [])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')
  const [tmpStakes, setTmpStakes] = useState([])

  const allStakes   = [...stakeholders, ...tmpStakes]
  const instStakes  = inst ? allStakes.filter(s => s.institution?.toLowerCase() === inst.toLowerCase()) : allStakes
  const allInsts    = [...new Set(stakeholders.map(s => s.institution).filter(Boolean))].sort()

  function addAction() { setActions(a => [...a, { id: Date.now().toString(), text: '', priority: 'Medium', done: false }]) }
  function updAction(id, k, v) { setActions(a => a.map(x => x.id === id ? { ...x, [k]: v } : x)) }
  function delAction(id) { setActions(a => a.filter(x => x.id !== id)) }

  function saveInline() {
    if (!newName.trim()) return
    const s = { id: 'tmp-' + Date.now(), name: newName.trim(), role: newRole, institution: inst, email: '', notes: '' }
    setTmpStakes(p => [...p, s])
    setStakeId(s.id)
    setShowAdd(false); setNewName(''); setNewRole('')
  }

  function submit() {
    if (!inst.trim() || !stakeId) { alert('Institution and stakeholder required.'); return }
    const so = allStakes.find(s => s.id === stakeId)
    onSave({
      institution: inst.trim(),
      stakeholder_id: stakeId,
      stakeholder_name: so?.name || '',
      date, type, objective: obj, status, owner,
      notes: notes.trim(),
      actions: actions.filter(a => a.text.trim()),
      _newStakeholders: tmpStakes,
    })
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <FieldLabel>Institution *</FieldLabel>
          <input style={inp} list="inst-dl" value={inst} onChange={e => { setInst(e.target.value); setStakeId('') }} placeholder="e.g. Curtin University" />
          <datalist id="inst-dl">{allInsts.map(n => <option key={n} value={n} />)}</datalist>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <FieldLabel>Stakeholder *</FieldLabel>
            <span onClick={() => setShowAdd(v => !v)} style={{ fontSize: 10, fontWeight: 700, color: C.accent, cursor: 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: FONT }}>+ new</span>
          </div>
          <select style={{ ...sel, marginBottom: showAdd ? 6 : 10 }} value={stakeId} onChange={e => setStakeId(e.target.value)}>
            <option value="">— select —</option>
            {instStakes.map(s => <option key={s.id} value={s.id}>{s.name}{s.role ? ` · ${s.role}` : ''}</option>)}
          </select>
          {showAdd && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
              <input style={{ ...inp, flex: 1, minWidth: 100, marginBottom: 0 }} placeholder="Full name" value={newName} onChange={e => setNewName(e.target.value)} />
              <select style={{ ...sel, width: 150, marginBottom: 0 }} value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value="">— role —</option>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
              <Btn label="Add" small accent onClick={saveInline} />
              <Btn label="×" small ghost onClick={() => setShowAdd(false)} />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><FieldLabel>Date *</FieldLabel><input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} /></div>
        <div><FieldLabel>Engagement type</FieldLabel>
          <select style={sel} value={type} onChange={e => setType(e.target.value)}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><FieldLabel>Objective</FieldLabel>
          <select style={sel} value={obj} onChange={e => setObj(e.target.value)}>
            <option value="">— select —</option>
            {OBJECTIVES.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div><FieldLabel>Status</FieldLabel>
          <select style={sel} value={status} onChange={e => setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <FieldLabel>Owner / rep</FieldLabel>
      <input style={inp} value={owner} onChange={e => setOwner(e.target.value)} placeholder="Your name" />

      <Divider />

      <FieldLabel>Notes / summary</FieldLabel>
      <textarea style={tex} value={notes} onChange={e => setNotes(e.target.value)} placeholder="What was discussed? Key outcomes?" />

      <FieldLabel>Next steps / actions</FieldLabel>
      <div style={{ marginBottom: 6 }}>
        {actions.map(a => (
          <div key={a.id} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <input style={{ ...inp, flex: 1, marginBottom: 0 }} placeholder="Describe next step…" value={a.text} onChange={e => updAction(a.id, 'text', e.target.value)} />
            <select style={{ ...sel, width: 110, marginBottom: 0 }} value={a.priority} onChange={e => updAction(a.id, 'priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
            <Btn label="×" small danger onClick={() => delAction(a.id)} />
          </div>
        ))}
      </div>
      <button onClick={addAction} style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: FONT, padding: '4px 0' }}>+ Add action</button>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 14, borderTop: `0.5px solid ${C.borderLight}` }}>
        <Btn label="Cancel" ghost onClick={onClose} />
        <Btn label="Save engagement" onClick={submit} />
      </div>
    </>
  )
}

// ── Stakeholder form ──────────────────────────────────────────────────────────
function StakeholderForm({ initial, allInsts, onSave, onClose }) {
  const [name, setName]   = useState(initial?.name || '')
  const [role, setRole]   = useState(initial?.role || '')
  const [inst, setInst]   = useState(initial?.institution || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [notes, setNotes] = useState(initial?.notes || '')

  function submit() {
    if (!name.trim() || !inst.trim()) { alert('Name and institution required.'); return }
    onSave({ name: name.trim(), role, institution: inst.trim(), email: email.trim(), notes: notes.trim() })
  }
  return (
    <>
      <FieldLabel>Full name *</FieldLabel>
      <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Smith" />
      <FieldLabel>Role *</FieldLabel>
      <select style={sel} value={role} onChange={e => setRole(e.target.value)}>
        <option value="">— select role —</option>
        {ROLES.map(r => <option key={r}>{r}</option>)}
      </select>
      <FieldLabel>Institution *</FieldLabel>
      <input style={inp} list="sm-inst-dl" value={inst} onChange={e => setInst(e.target.value)} placeholder="e.g. Curtin University" />
      <datalist id="sm-inst-dl">{allInsts.map(n => <option key={n} value={n} />)}</datalist>
      <FieldLabel>Email</FieldLabel>
      <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@uni.edu.au" />
      <FieldLabel>Notes</FieldLabel>
      <textarea style={{ ...tex, minHeight: 50 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any context…" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <Btn label="Cancel" ghost onClick={onClose} />
        <Btn label="Save" onClick={submit} />
      </div>
    </>
  )
}

// ── Engagement card ───────────────────────────────────────────────────────────
function EngCard({ eng, stake, onEdit, onDelete }) {
  const open = (eng.actions || []).filter(a => !a.done)
  return (
    <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderLeft: `3px solid ${open.length ? C.red : C.accent}`, marginBottom: 6, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.black, fontFamily: FONT }}>{eng.institution}</div>
          <div style={{ fontSize: 10, fontWeight: 300, color: C.light, marginTop: 2, fontFamily: FONT }}>
            {eng.stakeholder_name}
            {stake?.role ? <><SEP />{stake.role}</> : null}
            {eng.owner ? <><SEP />{eng.owner}</> : null}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {eng.synced_email_id && <Tag color={C.amber}>synced</Tag>}
          <span style={{ fontSize: 10, fontWeight: 300, color: C.light, fontFamily: FONT }}>{eng.date}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: eng.notes || eng.actions?.length ? 8 : 0 }}>
        <Tag color={C.accent}>{eng.type}</Tag>
        {eng.objective && <Tag color={OBJ_COLORS[eng.objective] || C.mid}>{eng.objective}</Tag>}
        <Tag color={STATUS_COLORS[eng.status] || C.mid}>{eng.status}</Tag>
        {open.length > 0 && <Tag color={C.red}>{open.length} open action{open.length !== 1 ? 's' : ''}</Tag>}
      </div>

      {eng.notes && <div style={{ fontSize: 12, color: C.mid, marginBottom: 8, lineHeight: 1.5, fontFamily: FONT }}>{eng.notes}</div>}

      {(eng.actions || []).length > 0 && (
        <div style={{ borderTop: `0.5px solid ${C.borderLight}`, paddingTop: 6 }}>
          {eng.actions.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '3px 0', fontSize: 11, fontFamily: FONT }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRI_COLORS[a.priority] || C.amber, marginTop: 4, flexShrink: 0 }} />
              <span style={{ flex: 1, color: a.done ? C.light : C.black, textDecoration: a.done ? 'line-through' : 'none' }}>{a.text}</span>
              <Tag color={PRI_COLORS[a.priority] || C.amber}>{a.priority}</Tag>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 8, paddingTop: 8, borderTop: `0.5px solid ${C.borderLight}` }}>
        <span onClick={onEdit} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: C.accent, cursor: 'pointer', fontFamily: FONT }}>Edit</span>
        <span onClick={onDelete} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: C.light, cursor: 'pointer', fontFamily: FONT }}>Delete</span>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]           = useState('overview')
  const [engs, setEngs]         = useState([])
  const [stakes, setStakes]     = useState([])
  const [meta, setMeta]         = useState({})
  const [loading, setLoading]   = useState(true)
  const [syncing, setSyncing]   = useState(false)
  const [toast, setToast]       = useState('')
  const [selInst, setSelInst]   = useState(null)
  const [engModal, setEngModal] = useState(null)
  const [editEngId, setEditEngId]     = useState(null)
  const [stakeModal, setStakeModal]   = useState(null)
  const [editStakeId, setEditStakeId] = useState(null)
  const [search, setSearch]   = useState('')
  const [fType, setFType]     = useState('')
  const [fObj, setFObj]       = useState('')
  const [fStatus, setFStatus] = useState('')
  const [iSrch, setISrch]     = useState('')
  const [sSrch, setSSrch]     = useState('')
  const [sInst, setSInst]     = useState('')
  const [sRole, setSRole]     = useState('')

  function toast2(msg) { setToast(msg); setTimeout(() => setToast(''), 2800) }

  // ── Load from Supabase ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [{ data: eRows }, { data: sRows }, { data: mRow }] = await Promise.all([
        supabase.from('engagements').select('*').order('date', { ascending: false }),
        supabase.from('stakeholders').select('*').order('name'),
        supabase.from('et_meta').select('*').eq('id', 'singleton').single(),
      ])
      setEngs(eRows || [])
      setStakes(sRows || [])
      setMeta(mRow || {})
      setLoading(false)
    }
    load()
  }, [])

  // ── Supabase helpers ────────────────────────────────────────────────────────
  async function upsertEng(data, id) {
    const row = { ...data, updated_at: new Date().toISOString() }
    if (id) row.id = id
    const { data: saved } = await supabase.from('engagements').upsert(row).select().single()
    setEngs(p => id ? p.map(e => e.id === id ? saved : e) : [saved, ...p])
    return saved
  }
  async function deleteEng(id) {
    await supabase.from('engagements').delete().eq('id', id)
    setEngs(p => p.filter(e => e.id !== id))
  }
  async function upsertStake(data, id) {
    const row = { ...data, updated_at: new Date().toISOString() }
    if (id) row.id = id
    const { data: saved } = await supabase.from('stakeholders').upsert(row).select().single()
    setStakes(p => id ? p.map(s => s.id === id ? saved : s) : [...p, saved])
    return saved
  }
  async function deleteStake(id) {
    await supabase.from('stakeholders').delete().eq('id', id)
    setStakes(p => p.filter(s => s.id !== id))
  }
  async function saveMeta(updates) {
    const row = { id: 'singleton', ...meta, ...updates, updated_at: new Date().toISOString() }
    await supabase.from('et_meta').upsert(row)
    setMeta(row)
  }

  // ── Email sync ──────────────────────────────────────────────────────────────
  // Processes the static EMAILS array from emailData.js against what's already
  // in Supabase. New emails not yet synced are added automatically.
  // To get fresh emails: ask Claude to fetch and update emailData.js, then redeploy.
  async function runSync() {
    setSyncing(true)
    try {
      const syncedIds = new Set(engs.map(e => e.synced_email_id).filter(Boolean))
      const newEmails = EMAILS.filter(em => !syncedIds.has(em.id))
      let added = 0

      for (const em of newEmails) {
        let stake = stakes.find(s => s.email?.toLowerCase() === em.primaryEmail.toLowerCase())
        if (!stake) {
          const namePart = em.primaryEmail.split('@')[0].split(/[\._\-]/)[0]
          const name = namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase()
            + (em.recipients.length > 1 ? ` + ${em.recipients.length - 1} others` : '')
          stake = await upsertStake({ name, role: '', institution: em.institution, email: em.primaryEmail, notes: 'Added via email sync' })
        }
        await upsertEng({
          synced_email_id:  em.id,
          institution:      em.institution,
          stakeholder_id:   stake.id,
          stakeholder_name: stake.name,
          date:             em.date,
          type:             'Email',
          objective:        em.objective,
          status:           'Follow-up needed',
          owner:            'Al Briggs',
          notes:            em.summary,
          actions:          [],
        })
        added++
      }

      await saveMeta({ last_sync_at: new Date().toISOString(), email_data_date: LAST_FETCHED })
      toast2(added > 0 ? `✓ ${added} new engagement${added !== 1 ? 's' : ''} added` : '✓ Already up to date')
    } catch (err) {
      console.error(err)
      toast2('Sync failed — check console')
    } finally {
      setSyncing(false)
    }
  }

  // ── Save handlers ───────────────────────────────────────────────────────────
  async function handleSaveEng(formData) {
    const tmpToReal = {}
    for (const s of (formData._newStakeholders || [])) {
      const saved = await upsertStake({ name: s.name, role: s.role, institution: s.institution, email: '', notes: '' })
      tmpToReal[s.id] = saved.id
    }
    const sid = tmpToReal[formData.stakeholder_id] || formData.stakeholder_id
    const so  = [...stakes, ...(formData._newStakeholders || [])].find(s => s.id === formData.stakeholder_id) || stakes.find(s => s.id === sid)
    await upsertEng({
      institution: formData.institution, stakeholder_id: sid,
      stakeholder_name: so?.name || formData.stakeholder_name,
      date: formData.date, type: formData.type, objective: formData.objective,
      status: formData.status, owner: formData.owner, notes: formData.notes, actions: formData.actions,
    }, editEngId || undefined)
    setEngModal(null); setEditEngId(null)
    toast2(editEngId ? '✓ Engagement updated' : '✓ Engagement saved')
  }

  async function handleSaveStake(formData) {
    await upsertStake(formData, editStakeId || undefined)
    setStakeModal(null); setEditStakeId(null)
    toast2(editStakeId ? '✓ Stakeholder updated' : '✓ Stakeholder saved')
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const allInsts   = [...new Set([...engs.map(e => e.institution), ...stakes.map(s => s.institution)].filter(Boolean))].sort()
  const allActs    = engs.flatMap(e => (e.actions || []).map(a => ({ ...a, inst: e.institution, stake: e.stakeholder_name, date: e.date })))
  const openActs   = allActs.filter(a => !a.done)
  const filteredE  = engs.filter(e => {
    if (fType && e.type !== fType) return false
    if (fObj && e.objective !== fObj) return false
    if (fStatus && e.status !== fStatus) return false
    if (search && ![e.institution, e.stakeholder_name, e.notes, e.owner, e.objective].join(' ').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function syncBarText() {
    const syncedCount = engs.filter(e => e.synced_email_id).length
    if (!meta.last_sync_at) return `Email data: ${LAST_FETCHED} — click Sync to import`
    const d = new Date(meta.last_sync_at)
    const fmt = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    return `Last synced: ${fmt} · ${syncedCount} email engagement${syncedCount !== 1 ? 's' : ''} imported · data: ${LAST_FETCHED}`
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  function exportXLSX() {
    import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js').then(XLSX => {
      const wb = XLSX.utils.book_new()
      const rows = []
      engs.forEach(e => {
        const s    = stakes.find(x => x.id === e.stakeholder_id)
        const base = { Institution: e.institution, Stakeholder: e.stakeholder_name, Role: s?.role || '', Date: e.date, Type: e.type, Objective: e.objective || '', Status: e.status, Owner: e.owner || '', Notes: e.notes || '', Source: e.synced_email_id ? 'Email sync' : 'Manual' }
        const acts = e.actions || []
        if (!acts.length) rows.push({ ...base, 'Action/Next step': '', Priority: '', 'Action status': '' })
        else acts.forEach((a, i) => rows.push({ ...(i === 0 ? base : Object.fromEntries(Object.keys(base).map(k => [k, '']))), 'Action/Next step': a.text, Priority: a.priority, 'Action status': a.done ? 'Complete' : 'Open' }))
      })
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [22,22,20,12,12,28,16,16,40,10,32,10,12].map(w => ({ wch: w }))
      XLSX.utils.book_append_sheet(wb, 'Engagements', ws)
      const byI = {}
      engs.forEach(e => {
        if (!byI[e.institution]) byI[e.institution] = { institution: e.institution, engagements: 0, openActions: 0, closedActions: 0, stakeholders: new Set(), objectives: new Set() }
        byI[e.institution].engagements++; byI[e.institution].stakeholders.add(e.stakeholder_name)
        if (e.objective) byI[e.institution].objectives.add(e.objective)
        ;(e.actions || []).forEach(a => a.done ? byI[e.institution].closedActions++ : byI[e.institution].openActions++)
      })
      const ws2 = XLSX.utils.json_to_sheet(Object.values(byI).map(r => ({ Institution: r.institution, Engagements: r.engagements, Stakeholders: r.stakeholders.size, 'Objectives covered': [...r.objectives].join(', '), 'Open actions': r.openActions, 'Completed actions': r.closedActions })))
      ws2['!cols'] = [26,14,14,40,14,18].map(w => ({ wch: w }))
      XLSX.utils.book_append_sheet(wb, 'Summary by institution', ws2)
      if (stakes.length) {
        const ws3 = XLSX.utils.json_to_sheet(stakes.map(s => ({ Name: s.name, Role: s.role || '', Institution: s.institution || '', Email: s.email || '', Engagements: engs.filter(e => e.stakeholder_id === s.id).length })))
        ws3['!cols'] = [22,20,24,28,14].map(w => ({ wch: w }))
        XLSX.utils.book_append_sheet(wb, 'Stakeholders', ws3)
      }
      XLSX.writeFile(wb, 'engagements_export.xlsx')
    })
  }

  if (loading) {
    return (
      <div style={{ fontFamily: FONT, background: C.black, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 4, background: C.accent, width: 40 }} />
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 300, letterSpacing: 1 }}>Loading</div>
      </div>
    )
  }

  const tabs = [{ id: 'overview', label: 'Overview' }, { id: 'institutions', label: 'Institutions' }, { id: 'stakeholders', label: 'Stakeholders' }]

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: C.bg, paddingBottom: 40 }}>
      <style>{`* { box-sizing: border-box; } input,select,textarea,button { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; border-radius: 0 !important; } body { margin: 0; } input:focus,select:focus,textarea:focus { outline: none; border-color: ${C.accent} !important; }`}</style>

      {/* Top rule */}
      <div style={{ height: 4, background: C.accent, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }} />

      {/* Header */}
      <div style={{ background: C.black, borderBottom: `4px solid ${C.accent}`, paddingTop: 4 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 20px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: C.white, fontFamily: FONT }}>Engagement Tracker</div>
          <div style={{ fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.35)', marginTop: 5, paddingBottom: 14, fontFamily: FONT }}>
            {engs.length} engagement{engs.length !== 1 ? 's' : ''}
            <span style={{ color: C.accent }}> | </span>
            {allInsts.length} institution{allInsts.length !== 1 ? 's' : ''}
            <span style={{ color: C.accent }}> | </span>
            {stakes.length} stakeholder{stakes.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 0', marginRight: 28, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: tab === t.id ? C.white : C.accent, background: 'transparent', border: 'none', borderBottom: tab === t.id ? `2px solid ${C.accent}` : '2px solid transparent', marginBottom: -1, cursor: 'pointer', fontFamily: FONT }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 20px' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: C.border, border: `0.5px solid ${C.border}`, marginBottom: 16 }}>
            {[
              { val: engs.length,               label: 'Engagements',  color: C.accent },
              { val: allInsts.length,            label: 'Institutions'               },
              { val: openActs.length,            label: 'Open actions', color: C.red  },
              { val: allActs.filter(a=>a.done).length, label: 'Completed'            },
            ].map(({ val, label, color }) => (
              <div key={label} style={{ background: C.white, padding: '12px 14px' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: color || C.black, lineHeight: 1, fontFamily: FONT }}>{val}</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: C.light, marginTop: 3, fontFamily: FONT }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Sync bar */}
          <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderLeft: `3px solid ${C.amber}`, padding: '11px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#7a4000', fontFamily: FONT }}>⟳ Outlook sync — abriggs@adobe.com</div>
              <div style={{ fontSize: 12, color: C.mid, marginTop: 3, fontFamily: FONT }}>{syncBarText()}</div>
            </div>
            <Btn label={syncing ? 'Syncing…' : 'Sync now'} orange small disabled={syncing} onClick={runSync} />
          </div>

          {/* Open actions */}
          {openActs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SectionHead label="Open actions" right={<span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: C.red, textTransform: 'uppercase', fontFamily: FONT }}>{openActs.length} pending</span>} />
              {openActs.slice(0, 10).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: `0.5px solid ${C.borderLight}` }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRI_COLORS[a.priority] || C.amber, marginTop: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.black, fontFamily: FONT }}>{a.text}</div>
                    <div style={{ fontSize: 10, fontWeight: 300, color: C.light, marginTop: 1, fontFamily: FONT }}>{a.inst}<SEP />{a.stake}<SEP />{a.date}</div>
                  </div>
                  <Tag color={PRI_COLORS[a.priority] || C.amber}>{a.priority}</Tag>
                </div>
              ))}
              {openActs.length > 10 && <div style={{ fontSize: 10, color: C.light, padding: '6px 0', fontFamily: FONT }}>{openActs.length - 10} more not shown</div>}
            </div>
          )}

          {/* Engagements */}
          <SectionHead label="Engagements" right={
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn label="+ Log engagement" small accent onClick={() => { setEditEngId(null); setEngModal('new') }} />
              <Btn label="↓ Export" small ghost onClick={exportXLSX} />
            </div>
          } />

          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <input style={{ ...inp, flex: 1, minWidth: 120, marginBottom: 0 }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            <select style={{ ...sel, minWidth: 110, marginBottom: 0 }} value={fType} onChange={e => setFType(e.target.value)}><option value="">All types</option>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
            <select style={{ ...sel, minWidth: 130, marginBottom: 0 }} value={fObj} onChange={e => setFObj(e.target.value)}><option value="">All objectives</option>{OBJECTIVES.map(o => <option key={o}>{o}</option>)}</select>
            <select style={{ ...sel, minWidth: 130, marginBottom: 0 }} value={fStatus} onChange={e => setFStatus(e.target.value)}><option value="">All statuses</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
          </div>

          {filteredE.length === 0
            ? <div style={{ textAlign: 'center', padding: '32px 16px', color: C.light, fontSize: 12, fontFamily: FONT }}>{engs.length ? 'No engagements match.' : 'Click "Sync now" to import from Outlook, or log one manually.'}</div>
            : filteredE.map(e => (
              <EngCard key={e.id} eng={e} stake={stakes.find(s => s.id === e.stakeholder_id)}
                onEdit={() => { setEditEngId(e.id); setEngModal(e) }}
                onDelete={() => { if (window.confirm('Delete this engagement?')) deleteEng(e.id) }}
              />
            ))
          }
        </>}

        {/* ── INSTITUTIONS ── */}
        {tab === 'institutions' && <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input style={{ ...inp, maxWidth: 260, marginBottom: 0 }} placeholder="Search institutions…" value={iSrch} onChange={e => setISrch(e.target.value)} />
            <div style={{ marginLeft: 'auto' }}><Btn label="+ Log engagement" small accent onClick={() => { setEditEngId(null); setEngModal('new') }} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8, marginBottom: selInst ? 16 : 0 }}>
            {allInsts.filter(n => n.toLowerCase().includes(iSrch.toLowerCase())).map(name => {
              const ie    = engs.filter(e => e.institution === name)
              const is_   = stakes.filter(s => s.institution === name)
              const open  = ie.flatMap(e => e.actions || []).filter(a => !a.done).length
              const isSel = selInst === name
              return (
                <div key={name} onClick={() => setSelInst(selInst === name ? null : name)} style={{ background: C.white, border: `0.5px solid ${isSel ? C.accent : C.border}`, borderTop: `3px solid ${isSel ? C.accent : 'transparent'}`, padding: 12, cursor: 'pointer' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.black, marginBottom: 5, fontFamily: FONT }}>{name}</div>
                  <div style={{ fontSize: 10, fontWeight: 300, color: C.light, lineHeight: 1.7, fontFamily: FONT }}>
                    {is_.length} stakeholder{is_.length !== 1 ? 's' : ''}<br />
                    {ie.length} engagement{ie.length !== 1 ? 's' : ''}<br />
                    {open > 0 ? <span style={{ color: C.red, fontWeight: 700 }}>{open} open action{open !== 1 ? 's' : ''}</span> : <span style={{ color: C.green }}>No open actions</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {selInst && (() => {
            const ie     = engs.filter(e => e.institution === selInst).slice().reverse()
            const is_    = stakes.filter(s => s.institution === selInst)
            const oActs  = ie.flatMap(e => (e.actions || []).filter(a => !a.done).map(a => ({ ...a, stake: e.stakeholder_name, date: e.date })))
            return (
              <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.black}` }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.black, fontFamily: FONT }}>{selInst}</div>
                    <div style={{ fontSize: 10, fontWeight: 300, color: C.light, marginTop: 3, fontFamily: FONT }}>
                      {ie.length} engagement{ie.length !== 1 ? 's' : ''}<SEP />
                      {is_.length} stakeholder{is_.length !== 1 ? 's' : ''}<SEP />
                      <span style={{ color: oActs.length ? C.red : C.green, fontWeight: oActs.length ? 700 : 300 }}>{oActs.length} open action{oActs.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn label="+ Engagement" small accent onClick={() => { setEditEngId(null); setEngModal({ institution: selInst }) }} />
                    <Btn label="+ Stakeholder" small ghost onClick={() => { setEditStakeId(null); setStakeModal({ institution: selInst }) }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <SectionHead label="Stakeholders" right={<span style={{ fontSize: 10, fontWeight: 300, color: C.light }}>{is_.length}</span>} />
                    {is_.length === 0
                      ? <div style={{ fontSize: 11, color: C.light, fontFamily: FONT }}>None added yet.</div>
                      : is_.map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: `0.5px solid ${C.borderLight}` }}>
                          <Avatar name={s.name} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.black, fontFamily: FONT }}>{s.name}</div>
                            {s.role && <Tag small color={ROLE_COLORS[s.role] || C.mid}>{s.role}</Tag>}
                          </div>
                          <span onClick={() => { setEditStakeId(s.id); setStakeModal(s) }} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: C.accent, cursor: 'pointer', fontFamily: FONT }}>Edit</span>
                        </div>
                      ))
                    }
                  </div>
                  <div>
                    <SectionHead label="Engagements" right={<span style={{ fontSize: 10, fontWeight: 300, color: C.light }}>{ie.length}</span>} />
                    {ie.length === 0
                      ? <div style={{ fontSize: 11, color: C.light, fontFamily: FONT }}>None yet.</div>
                      : ie.slice(0, 6).map(e => (
                        <div key={e.id} onClick={() => { setEditEngId(e.id); setEngModal(e) }} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: `0.5px solid ${C.borderLight}`, cursor: 'pointer' }}>
                          <div style={{ fontSize: 10, fontWeight: 300, color: C.light, whiteSpace: 'nowrap', marginTop: 1, minWidth: 58, fontFamily: FONT }}>{e.date}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.black, fontFamily: FONT }}>{e.type}{e.objective ? <><SEP />{e.objective}</> : null}</div>
                            <div style={{ fontSize: 10, color: C.light, fontFamily: FONT }}>{e.stakeholder_name}</div>
                          </div>
                          <Tag color={STATUS_COLORS[e.status] || C.mid}>{e.status}</Tag>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {oActs.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.black}` }}>
                    <SectionHead label={`Open actions — ${oActs.length}`} />
                    {oActs.map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: `0.5px solid ${C.borderLight}` }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRI_COLORS[a.priority] || C.amber, marginTop: 4, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: 12, fontWeight: 600, fontFamily: FONT }}>{a.text}</div>
                        <span style={{ fontSize: 10, color: C.light, fontFamily: FONT, marginRight: 8 }}>{a.stake} · {a.date}</span>
                        <Tag color={PRI_COLORS[a.priority] || C.amber}>{a.priority}</Tag>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </>}

        {/* ── STAKEHOLDERS ── */}
        {tab === 'stakeholders' && <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <input style={{ ...inp, flex: 1, marginBottom: 0 }} placeholder="Search stakeholders…" value={sSrch} onChange={e => setSSrch(e.target.value)} />
            <select style={{ ...sel, minWidth: 130, marginBottom: 0 }} value={sInst} onChange={e => setSInst(e.target.value)}><option value="">All institutions</option>{allInsts.map(n => <option key={n}>{n}</option>)}</select>
            <select style={{ ...sel, minWidth: 130, marginBottom: 0 }} value={sRole} onChange={e => setSRole(e.target.value)}><option value="">All roles</option>{ROLES.map(r => <option key={r}>{r}</option>)}</select>
            <Btn label="+ Add stakeholder" small onClick={() => { setEditStakeId(null); setStakeModal({}) }} />
          </div>

          {stakes
            .filter(s => {
              if (sInst && s.institution !== sInst) return false
              if (sRole && s.role !== sRole) return false
              if (sSrch && ![s.name, s.role, s.institution, s.email].join(' ').toLowerCase().includes(sSrch.toLowerCase())) return false
              return true
            })
            .map(s => {
              const n = engs.filter(e => e.stakeholder_id === s.id).length
              return (
                <div key={s.id} style={{ background: C.white, border: `0.5px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, marginBottom: 6, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={s.name} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.black, fontFamily: FONT }}>{s.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                      {s.role && <Tag small color={ROLE_COLORS[s.role] || C.mid}>{s.role}</Tag>}
                      <span style={{ fontSize: 10, fontWeight: 300, color: C.light, fontFamily: FONT }}>{s.institution || '—'}</span>
                    </div>
                    {s.email && <div style={{ fontSize: 10, fontWeight: 300, color: C.light, marginTop: 1, fontFamily: FONT }}>{s.email}</div>}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 300, color: C.light, whiteSpace: 'nowrap', fontFamily: FONT }}>{n} eng.</div>
                  <span onClick={() => { setEditStakeId(s.id); setStakeModal(s) }} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: C.accent, cursor: 'pointer', fontFamily: FONT }}>Edit</span>
                  <span onClick={() => { if (window.confirm('Delete?')) deleteStake(s.id) }} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: C.light, cursor: 'pointer', fontFamily: FONT }}>Del</span>
                </div>
              )
            })
          }
          {stakes.length === 0 && <div style={{ textAlign: 'center', padding: '32px 16px', color: C.light, fontSize: 12, fontFamily: FONT }}>No stakeholders yet.</div>}
        </>}

      </div>

      {/* Modals */}
      {engModal && (
        <Modal title={editEngId ? 'Edit engagement' : 'Log engagement'} onClose={() => { setEngModal(null); setEditEngId(null) }}>
          <EngagementForm
            initial={editEngId ? engModal : (engModal !== 'new' ? engModal : null)}
            stakeholders={stakes}
            onSave={handleSaveEng}
            onClose={() => { setEngModal(null); setEditEngId(null) }}
          />
        </Modal>
      )}
      {stakeModal !== null && (
        <Modal title={editStakeId ? 'Edit stakeholder' : 'Add stakeholder'} onClose={() => { setStakeModal(null); setEditStakeId(null) }}>
          <StakeholderForm
            initial={editStakeId ? stakeModal : (stakeModal?.institution ? stakeModal : null)}
            allInsts={allInsts}
            onSave={handleSaveStake}
            onClose={() => { setStakeModal(null); setEditStakeId(null) }}
          />
        </Modal>
      )}

      <Toast msg={toast} />
    </div>
  )
}
