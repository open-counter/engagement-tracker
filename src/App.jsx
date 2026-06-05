import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const C = {
  black: '#000', white: '#FFF', bg: '#F7F7F5',
  accent: '#50a0cd', mid: '#666', light: '#999',
  border: '#CCC', borderLight: '#EBEBEB',
  red: '#C0392B', amber: '#e67e22', green: '#27ae60',
  navy: '#2c3e50', purple: '#8e44ad',
}

const ROLES      = ['Executive','Program Leadership','Faculty','Academic Support','Student Services','IT','Library']
const TYPES      = ['Meeting','Call','Email','Conference','Demo','Workshop','Other']
const OBJECTIVES = ['Awareness','Staff and Student Engagement','AI Innovation and Leadership','Curriculum Support','IT/Tech Support']
const STATUSES   = ['Active','Follow-up needed','On hold','Closed']
const PRIORITIES = ['High','Medium','Low']

const ACT_CATEGORIES = ['Governance-SBR/QBR/Annual Business Review','Faculty-Staff Webinar','Faculty-Staff Meeting','Faculty Event','Student Webinar','Student On-Campus','Student Competition','Deployment / IT Meeting']
const ENG_VECTORS    = ['Awareness','Curriculum','Student Life','Career Readiness','Administration']
const ACT_FORMATS    = ['Virtual','In-Person','Hybrid']
const ACT_TYPES      = ['Core Product','CSM Local Activity','CSM Student Activity','Faculty Activity','Curriculum Integration','Webinar','Workshop','Meeting','SPVG']

const ROLE_C   = { Executive:C.navy,'Program Leadership':C.purple,Faculty:C.black,'Academic Support':C.accent,'Student Services':C.green,IT:C.amber,Library:C.mid }
const OBJ_C    = { Awareness:C.accent,'Staff and Student Engagement':C.green,'AI Innovation and Leadership':C.purple,'Curriculum Support':C.amber,'IT/Tech Support':C.black }
const STATUS_C = { Active:C.green,'Follow-up needed':C.amber,'On hold':C.mid,Closed:C.light }
const PRI_C    = { High:C.red,Medium:C.amber,Low:C.green }

const DOMAIN_MAP = {
  'latrobe.edu.au':'La Trobe University','sa.gov.au':'SA Government — Education',
  'curtin.edu.au':'Curtin University','curtincollege.edu.au':'Curtin University',
  'guild.uwa.edu.au':'University of Western Australia','uwa.edu.au':'University of Western Australia',
  'rmit.edu.au':'RMIT University','westernsydney.edu.au':'Western Sydney University',
  'swin.edu.au':'Swinburne University','torrens.edu.au':'Torrens University & Media Design School',
  'mediadesignschool.com':'Torrens University & Media Design School',
  'nmtafe.wa.edu.au':'North Metropolitan TAFE','bond.edu.au':'Bond University',
  'ecu.edu.au':'Edith Cowan University',
}
const INTERNAL = ['adobe.com']

function getDomain(email) { return (email||'').split('@')[1]?.toLowerCase()||'' }
function isInternal(email) { const d=getDomain(email); return INTERNAL.some(i=>d===i||d.endsWith('.'+i)) }
function getInstitution(email) { const d=getDomain(email); for(const[k,v]of Object.entries(DOMAIN_MAP)){if(d===k||d.endsWith('.'+k))return v} return null }
function guessObjective(subject) {
  const s=(subject||'').toLowerCase()
  if(s.includes('ai ')||s.includes('innovation')||s.includes('grad benefit'))return'AI Innovation and Leadership'
  if(s.includes('curriculum')||s.includes('brand kit')||s.includes('express')||s.includes('storytelling'))return'Curriculum Support'
  if(s.includes('pdf')||s.includes('pilot')||s.includes('portal')||s.includes('licensing')||s.includes('migration'))return'IT/Tech Support'
  if(s.includes('webinar')||s.includes('training')||s.includes('café')||s.includes('o-day')||s.includes('presentation'))return'Staff and Student Engagement'
  return 'Awareness'
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const inp = { width:'100%',padding:'10px 12px',border:`1px solid ${C.border}`,fontSize:14,fontFamily:FONT,background:C.white,color:C.black,outline:'none',borderRadius:0,display:'block',marginBottom:10 }
const sel = { ...inp,appearance:'none',WebkitAppearance:'none',cursor:'pointer' }
const tex = { ...inp,resize:'vertical',minHeight:70,lineHeight:1.5 }

function Tag({ color, outline, small, children }) {
  return <span style={{ display:'inline-block',fontSize:small?8:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',padding:'2px 7px',background:outline?'transparent':(color||C.accent),color:outline?C.mid:C.white,border:outline?`0.5px solid ${C.border}`:'none',fontFamily:FONT,whiteSpace:'nowrap' }}>{children}</span>
}
function SEP() { return <span style={{ color:C.accent,margin:'0 5px' }}>|</span> }
function FieldLabel({ children }) {
  return <label style={{ fontSize:12,fontWeight:700,color:C.mid,marginBottom:5,letterSpacing:'0.5px',textTransform:'uppercase',fontFamily:FONT,display:'block' }}>{children}</label>
}
function SectionHead({ label, right }) {
  return <div style={{ display:'flex',alignItems:'baseline',gap:8,marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${C.black}` }}>
    <div style={{ fontSize:11,fontWeight:700,color:C.accent,letterSpacing:2,textTransform:'uppercase',fontFamily:FONT }}>{label}</div>
    {right&&<div style={{ marginLeft:'auto' }}>{right}</div>}
  </div>
}
function Divider() { return <div style={{ height:1,background:C.borderLight,margin:'12px 0' }} /> }
function Btn({ label, onClick, ghost, danger, accent, orange, small, disabled, style, children }) {
  const bg=ghost?'transparent':danger?'transparent':orange?C.amber:accent?C.accent:C.black
  const color=ghost?C.mid:danger?C.red:C.white
  const bdr=ghost?`1px solid ${C.border}`:danger?`1px solid ${C.red}`:'none'
  return <button onClick={onClick} disabled={disabled} style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,background:disabled?'#ccc':bg,color:disabled?C.white:color,border:bdr,borderRadius:0,padding:small?'6px 10px':'10px 16px',fontSize:small?11:13,fontWeight:700,fontFamily:FONT,cursor:disabled?'not-allowed':'pointer',letterSpacing:'0.5px',...(style||{}) }}>{label}{children}</button>
}
function Modal({ title, accentColor, onClose, wide, children }) {
  return <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,overflowY:'auto',padding:'40px 20px' }} onClick={onClose}>
    <div style={{ background:C.white,maxWidth:wide?680:560,margin:'0 auto',borderTop:`4px solid ${accentColor||C.accent}` }} onClick={e=>e.stopPropagation()}>
      <div style={{ background:C.black,padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <div style={{ fontSize:13,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.white,fontFamily:FONT }}>{title}</div>
        <button onClick={onClose} style={{ background:'none',border:'none',color:C.light,fontSize:22,cursor:'pointer',lineHeight:1,padding:0 }}>×</button>
      </div>
      <div style={{ padding:20 }}>{children}</div>
    </div>
  </div>
}
function Toast({ msg }) {
  if(!msg) return null
  return <div style={{ position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:C.black,color:C.white,fontSize:12,fontWeight:700,letterSpacing:1,textTransform:'uppercase',padding:'10px 20px',borderTop:`3px solid ${C.accent}`,zIndex:9999,fontFamily:FONT }}>{msg}</div>
}
function Avatar({ name, size=32 }) {
  const ini=(name||'?').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()
  return <div style={{ width:size,height:size,borderRadius:'50%',background:'#e8f4fb',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.34,fontWeight:700,color:C.accent,flexShrink:0,fontFamily:FONT }}>{ini}</div>
}

// ── Engagement form ───────────────────────────────────────────────────────────
function EngagementForm({ initial, stakeholders, onSave, onClose }) {
  const [inst,setInst]       = useState(initial?.institution||'')
  const [stakeId,setStakeId] = useState(initial?.stakeholder_id||'')
  const [date,setDate]       = useState(initial?.date||new Date().toISOString().slice(0,10))
  const [type,setType]       = useState(initial?.type||'Meeting')
  const [obj,setObj]         = useState(initial?.objective||'')
  const [status,setStatus]   = useState(initial?.status||'Active')
  const [owner,setOwner]     = useState(initial?.owner||'Al Briggs')
  const [notes,setNotes]     = useState(initial?.notes||'')
  const [actions,setActions] = useState(initial?.actions||[])
  const [showAdd,setShowAdd] = useState(false)
  const [newName,setNewName] = useState('')
  const [newRole,setNewRole] = useState('')
  const [tmpStakes,setTmpStakes] = useState([])
  const [eventTitle,setEventTitle]   = useState(initial?.event_title||'')
  const [actCategory,setActCategory] = useState(initial?.act_category||'')
  const [engVector,setEngVector]     = useState(initial?.eng_vector||'')
  const [actFormat,setActFormat]     = useState(initial?.act_format||'')
  const [actType,setActType]         = useState(initial?.act_type||'')
  const [travelNeeded,setTravelNeeded] = useState(initial?.travel_needed??false)
  const [travelJustification,setTravelJustification] = useState(initial?.travel_justification??'')
  const [travelCost,setTravelCost] = useState(initial?.travel_cost??'')
  const [travelStart,setTravelStart] = useState(initial?.travel_start??'')
  const [travelEnd,setTravelEnd] = useState(initial?.travel_end??'')

  const allS = [...stakeholders,...tmpStakes]
  const instS = inst ? allS.filter(s=>s.institution?.toLowerCase()===inst.toLowerCase()) : allS
  const allInsts = [...new Set(stakeholders.map(s=>s.institution).filter(Boolean))].sort()

  function addAction() { setActions(a=>[...a,{id:Date.now().toString(),text:'',priority:'Medium',done:false}]) }
  function updAction(id,k,v) { setActions(a=>a.map(x=>x.id===id?{...x,[k]:v}:x)) }
  function delAction(id) { setActions(a=>a.filter(x=>x.id!==id)) }
  function saveInline() {
    if(!newName.trim())return
    const s={id:'tmp-'+Date.now(),name:newName.trim(),role:newRole,institution:inst,email:'',notes:''}
    setTmpStakes(p=>[...p,s]);setStakeId(s.id);setShowAdd(false);setNewName('');setNewRole('')
  }
  function submit() {
    if(!inst.trim()||!stakeId){alert('Institution and stakeholder required.');return}
    const so=allS.find(s=>s.id===stakeId)
    onSave({ institution:inst.trim(),stakeholder_id:stakeId,stakeholder_name:so?.name||'',date,type,objective:obj,status,owner,event_title:eventTitle.trim(),notes:notes.trim(),actions:actions.filter(a=>a.text.trim()),_newStakeholders:tmpStakes,act_category:actCategory,eng_vector:engVector,act_format:actFormat,act_type:actType,travel_needed:travelNeeded,travel_justification:travelJustification.trim(),travel_cost:travelCost,travel_start:travelStart,travel_end:travelEnd })
  }

  return <>
    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
      <div>
        <FieldLabel>Institution *</FieldLabel>
        <input style={inp} list="inst-dl" value={inst} onChange={e=>{setInst(e.target.value);setStakeId('')}} placeholder="e.g. Curtin University" />
        <datalist id="inst-dl">{allInsts.map(n=><option key={n} value={n}/>)}</datalist>
      </div>
      <div>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:5 }}>
          <FieldLabel>Stakeholder *</FieldLabel>
          <span onClick={()=>setShowAdd(v=>!v)} style={{ fontSize:11,fontWeight:700,color:C.accent,cursor:'pointer',letterSpacing:'0.5px',textTransform:'uppercase',fontFamily:FONT }}>+ new</span>
        </div>
        <select style={{ ...sel,marginBottom:showAdd?6:10 }} value={stakeId} onChange={e=>setStakeId(e.target.value)}>
          <option value="">— select —</option>
          {instS.map(s=><option key={s.id} value={s.id}>{s.name}{s.role?` · ${s.role}`:''}</option>)}
        </select>
        {showAdd&&<div style={{ display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:10 }}>
          <input style={{ ...inp,flex:1,minWidth:100,marginBottom:0 }} placeholder="Full name" value={newName} onChange={e=>setNewName(e.target.value)} />
          <select style={{ ...sel,width:150,marginBottom:0 }} value={newRole} onChange={e=>setNewRole(e.target.value)}>
            <option value="">— role —</option>{ROLES.map(r=><option key={r}>{r}</option>)}
          </select>
          <Btn label="Add" small accent onClick={saveInline}/>
          <Btn label="×" small ghost onClick={()=>setShowAdd(false)}/>
        </div>}
      </div>
    </div>
    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
      <div><FieldLabel>Date *</FieldLabel><input type="date" style={inp} value={date} onChange={e=>setDate(e.target.value)}/></div>
      <div><FieldLabel>Engagement type</FieldLabel><select style={sel} value={type} onChange={e=>setType(e.target.value)}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
    </div>
    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
      <div><FieldLabel>Objective</FieldLabel><select style={sel} value={obj} onChange={e=>setObj(e.target.value)}><option value="">— select —</option>{OBJECTIVES.map(o=><option key={o}>{o}</option>)}</select></div>
      <div><FieldLabel>Status</FieldLabel><select style={sel} value={status} onChange={e=>setStatus(e.target.value)}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
    </div>
    <FieldLabel>Owner / rep</FieldLabel>
    <input style={inp} value={owner} onChange={e=>setOwner(e.target.value)} placeholder="Your name"/>
    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
      <div><FieldLabel>Activity category</FieldLabel><select style={{...sel,marginBottom:0}} value={actCategory} onChange={e=>setActCategory(e.target.value)}><option value="">— select —</option>{ACT_CATEGORIES.map(o=><option key={o}>{o}</option>)}</select></div>
      <div><FieldLabel>Engagement vector</FieldLabel><select style={{...sel,marginBottom:0}} value={engVector} onChange={e=>setEngVector(e.target.value)}><option value="">— select —</option>{ENG_VECTORS.map(o=><option key={o}>{o}</option>)}</select></div>
    </div>
    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
      <div><FieldLabel>Activity format</FieldLabel><select style={{...sel,marginBottom:0}} value={actFormat} onChange={e=>setActFormat(e.target.value)}><option value="">— select —</option>{ACT_FORMATS.map(o=><option key={o}>{o}</option>)}</select></div>
      <div><FieldLabel>Activity type</FieldLabel><select style={{...sel,marginBottom:0}} value={actType} onChange={e=>setActType(e.target.value)}><option value="">— select —</option>{ACT_TYPES.map(o=><option key={o}>{o}</option>)}</select></div>
    </div>
    <Divider/>
    <FieldLabel>Event title</FieldLabel>
    <input style={inp} value={eventTitle} onChange={e=>setEventTitle(e.target.value)} placeholder="e.g. Curtin University — Meeting — 2026-06-05"/>
    <FieldLabel>Notes / summary</FieldLabel>
    <textarea style={tex} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="What was discussed? Key outcomes?"/>
    <FieldLabel>Next steps / actions</FieldLabel>
    <div style={{ marginBottom:6 }}>
      {actions.map(a=><div key={a.id} style={{ display:'flex',gap:6,alignItems:'center',marginBottom:6 }}>
        <input style={{ ...inp,flex:1,marginBottom:0 }} placeholder="Describe next step…" value={a.text} onChange={e=>updAction(a.id,'text',e.target.value)}/>
        <select style={{ ...sel,width:120,marginBottom:0 }} value={a.priority} onChange={e=>updAction(a.id,'priority',e.target.value)}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select>
        <Btn label="×" small danger onClick={()=>delAction(a.id)}/>
      </div>)}
    </div>
    <button onClick={addAction} style={{ fontSize:12,fontWeight:700,color:C.accent,background:'none',border:'none',cursor:'pointer',letterSpacing:'0.5px',textTransform:'uppercase',fontFamily:FONT,padding:'4px 0' }}>+ Add action</button>
    <Divider/>
    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:travelNeeded?12:4 }}>
      <FieldLabel>Travel needed?</FieldLabel>
      <div style={{ display:'flex',gap:6 }}>
        <button onClick={()=>setTravelNeeded(false)} style={{ background:!travelNeeded?C.black:'transparent',border:`1px solid ${!travelNeeded?C.black:C.border}`,color:!travelNeeded?C.white:C.mid,padding:'4px 14px',fontSize:11,fontWeight:700,letterSpacing:'0.5px',textTransform:'uppercase',cursor:'pointer',fontFamily:FONT,borderRadius:0 }}>No</button>
        <button onClick={()=>setTravelNeeded(true)} style={{ background:travelNeeded?C.amber:'transparent',border:`1px solid ${travelNeeded?C.amber:C.border}`,color:travelNeeded?C.white:C.mid,padding:'4px 14px',fontSize:11,fontWeight:700,letterSpacing:'0.5px',textTransform:'uppercase',cursor:'pointer',fontFamily:FONT,borderRadius:0 }}>Yes</button>
      </div>
    </div>
    {travelNeeded&&<div style={{ background:'#F7F7F5',border:`0.5px solid ${C.border}`,borderLeft:`3px solid ${C.amber}`,padding:14,marginBottom:12 }}>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
        <div><FieldLabel>Travel start date</FieldLabel><input type="date" style={{ ...inp,marginBottom:0 }} value={travelStart} onChange={e=>setTravelStart(e.target.value)}/></div>
        <div><FieldLabel>Travel end date</FieldLabel><input type="date" style={{ ...inp,marginBottom:0 }} value={travelEnd} onChange={e=>setTravelEnd(e.target.value)}/></div>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
        <div><FieldLabel>Est. cost (USD)</FieldLabel><input type="number" style={{ ...inp,marginBottom:0 }} placeholder="0" value={travelCost} onChange={e=>setTravelCost(e.target.value)}/></div>
        <div></div>
      </div>
      <FieldLabel>Travel justification</FieldLabel>
      <textarea style={{ ...tex,minHeight:50,marginBottom:0 }} value={travelJustification} onChange={e=>setTravelJustification(e.target.value)} placeholder="Why is travel required?"/>
    </div>}
    <div style={{ display:'flex',justifyContent:'flex-end',gap:8,marginTop:20,paddingTop:14,borderTop:`0.5px solid ${C.borderLight}` }}>
      <Btn label="Cancel" ghost onClick={onClose}/>
      <Btn label="Save engagement" onClick={submit}/>
    </div>
  </>
}

// ── Stakeholder form ──────────────────────────────────────────────────────────
function StakeholderForm({ initial, allInsts, onSave, onClose }) {
  const [name,setName]   = useState(initial?.name||'')
  const [role,setRole]   = useState(initial?.role||'')
  const [inst,setInst]   = useState(initial?.institution||'')
  const [email,setEmail] = useState(initial?.email||'')
  const [notes,setNotes] = useState(initial?.notes||'')
  function submit() {
    if(!name.trim()||!inst.trim()){alert('Name and institution required.');return}
    onSave({name:name.trim(),role,institution:inst.trim(),email:email.trim(),notes:notes.trim()})
  }
  return <>
    <FieldLabel>Full name *</FieldLabel><input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Jane Smith"/>
    <FieldLabel>Role *</FieldLabel><select style={sel} value={role} onChange={e=>setRole(e.target.value)}><option value="">— select role —</option>{ROLES.map(r=><option key={r}>{r}</option>)}</select>
    <FieldLabel>Institution *</FieldLabel><input style={inp} list="sm-inst-dl" value={inst} onChange={e=>setInst(e.target.value)} placeholder="e.g. Curtin University"/><datalist id="sm-inst-dl">{allInsts.map(n=><option key={n} value={n}/>)}</datalist>
    <FieldLabel>Email</FieldLabel><input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="jane@uni.edu.au"/>
    <FieldLabel>Notes</FieldLabel><textarea style={{ ...tex,minHeight:50 }} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any context…"/>
    <div style={{ display:'flex',justifyContent:'flex-end',gap:8,marginTop:8 }}>
      <Btn label="Cancel" ghost onClick={onClose}/>
      <Btn label="Save" onClick={submit}/>
    </div>
  </>
}

// ── Engagement card ───────────────────────────────────────────────────────────
function EngCard({ eng, stake, onEdit, onDelete, onToggleAction, onClose, onSharePoint, compact }) {
  const openActions = (eng.actions||[]).filter(a=>!a.done)
  const isClosed = eng.status==='Closed'
  // When closed: all colours flatten to grey
  const tagColor = isClosed ? '#aaa' : null
  const dotColor = isClosed ? '#ccc' : null
  return <div style={{ background:isClosed?'#f5f5f5':C.white,border:`0.5px solid ${isClosed?'#ddd':C.border}`,borderLeft:`3px solid ${isClosed?'#ccc':openActions.length?C.red:C.accent}`,marginBottom:8,padding:'14px 16px' }}>
    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:8 }}>
      <div>
        {!compact&&<div style={{ fontSize:15,fontWeight:700,color:isClosed?'#aaa':C.black,fontFamily:FONT }}>{eng.institution}</div>}
        <div style={{ fontSize:compact?15:13,fontWeight:compact?700:400,color:isClosed?'#bbb':compact?C.black:C.mid,marginTop:compact?0:2,fontFamily:FONT }}>
          {eng.stakeholder_name}{stake?.role?<><SEP/>{stake.role}</>:null}{eng.owner?<><SEP/>{eng.owner}</>:null}
        </div>
      </div>
      <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
        <span style={{ fontSize:12,fontWeight:700,color:isClosed?'#bbb':C.mid,fontFamily:FONT }}>{eng.date}</span>
      </div>
    </div>
    <div style={{ display:'flex',gap:5,flexWrap:'wrap',marginBottom:eng.notes||(eng.actions||[]).length?8:0 }}>
      <Tag color={tagColor||C.accent}>{eng.type}</Tag>
      {eng.objective&&<Tag color={tagColor||(OBJ_C[eng.objective]||C.mid)}>{eng.objective}</Tag>}
      <Tag color={tagColor||(STATUS_C[eng.status]||C.mid)}>{eng.status}</Tag>
      {openActions.length>0&&<Tag color={tagColor||C.red}>{openActions.length} open action{openActions.length!==1?'s':''}</Tag>}
    </div>
    {eng.notes&&<div style={{ fontSize:13,color:isClosed?'#bbb':C.mid,marginBottom:8,lineHeight:1.6,fontFamily:FONT }}>{eng.notes}</div>}
    {(eng.actions||[]).length>0&&<div style={{ borderTop:`0.5px solid ${C.borderLight}`,paddingTop:8 }}>
      {(eng.actions||[]).map(a=><div key={a.id} style={{ display:'flex',alignItems:'center',gap:8,padding:'4px 0',fontSize:13,fontFamily:FONT }}>
        <div style={{ width:7,height:7,borderRadius:'50%',background:dotColor||(PRI_C[a.priority]||C.amber),flexShrink:0 }}/>
        <span style={{ flex:1,color:isClosed||a.done?'#bbb':C.black,textDecoration:a.done?'line-through':'none' }}>{a.text}</span>
        <Tag color={tagColor||(PRI_C[a.priority]||C.amber)}>{a.priority}</Tag>
        {!isClosed&&<button
          onClick={()=>onToggleAction(eng.id,a.id)}
          style={{ background:a.done?'#e8f5ee':'transparent',border:`1px solid ${a.done?C.green:C.border}`,padding:'3px 9px',fontSize:11,fontWeight:700,letterSpacing:'0.5px',textTransform:'uppercase',cursor:'pointer',fontFamily:FONT,color:a.done?C.green:C.mid,whiteSpace:'nowrap' }}
        >{a.done?'✓ Done':'Mark done'}</button>}
      </div>)}
    </div>}
    <div style={{ display:'flex',justifyContent:'flex-end',gap:14,marginTop:10,paddingTop:10,borderTop:`0.5px solid ${C.borderLight}` }}>
      {!isClosed&&<button onClick={()=>onClose(eng.id)} style={{ background:'none',border:'none',fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.green,cursor:'pointer',fontFamily:FONT }}>✓ Close</button>}
      <button onClick={onEdit} style={{ background:'none',border:'none',fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:isClosed?'#bbb':C.accent,cursor:'pointer',fontFamily:FONT }}>Edit</button>
      <button onClick={onDelete} style={{ background:'none',border:'none',fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.light,cursor:'pointer',fontFamily:FONT }}>Delete</button>
      {onSharePoint&&!isClosed&&<button onClick={()=>onSharePoint(eng)} style={{ background:C.black,border:'none',fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.white,cursor:'pointer',fontFamily:FONT,padding:'4px 10px' }}>→ SharePoint</button>}
    </div>
  </div>
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]               = useState('institutions')
  const [engs,setEngs]             = useState([])
  const [stakes,setStakes]         = useState([])
  const [instOrder,setInstOrder]   = useState([])
  const [loading,setLoading]       = useState(true)
  const [syncing,setSyncing]       = useState(false)
  const [toast,setToast]           = useState('')
  const [selInst,setSelInst]       = useState(null)
  const [engModal,setEngModal]     = useState(null)
  const [editEngId,setEditEngId]   = useState(null)
  const [stakeModal,setStakeModal] = useState(null)
  const [editStakeId,setEditStakeId] = useState(null)
  const [showEngForm,setShowEngForm]   = useState(false)
  const [showStakeForm,setShowStakeForm] = useState(false)
  const [stakesOpen,setStakesOpen]       = useState(true)
  const [engsOpen,setEngsOpen]           = useState(true)
  const [showInstForm,setShowInstForm]   = useState(false)
  const [dragSrc,setDragSrc]             = useState(null)
  const [newInstName,setNewInstName]     = useState('')
  const [instSearch,setInstSearch]       = useState('')
  const [stakeSearch,setStakeSearch]     = useState('')
  const [stakeInstF,setStakeInstF]       = useState('')
  const [stakeRoleF,setStakeRoleF]       = useState('')
  const [fType,setFType]   = useState('')
  const [fObj,setFObj]     = useState('')
  const [fStatus,setFStatus] = useState('')
  const [ovSearch,setOvSearch] = useState('')

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(''),2800)}

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(()=>{
    async function load(){
      setLoading(true)
      const [{data:eRows},{data:sRows},{data:mRow}] = await Promise.all([
        supabase.from('engagements').select('*').order('date',{ascending:false}),
        supabase.from('stakeholders').select('*').order('name'),
        supabase.from('et_meta').select('*').eq('id','singleton').single(),
      ])
      const e=eRows||[],s=sRows||[]
      setEngs(e);setStakes(s)
      const order=[...new Set(e.map(x=>x.institution).concat(s.map(x=>x.institution)).filter(Boolean))]
      setInstOrder(order)
      setLoading(false)
    }
    load()
  },[])

  // ── Supabase helpers ─────────────────────────────────────────────────────────
  async function upsertEng(data,id){
    const row={...data,updated_at:new Date().toISOString()};if(id)row.id=id
    const{data:saved}=await supabase.from('engagements').upsert(row).select().single()
    setEngs(p=>id?p.map(e=>e.id===id?saved:e):[saved,...p])
    return saved
  }
  async function deleteEng(id){
    await supabase.from('engagements').delete().eq('id',id)
    setEngs(p=>p.filter(e=>e.id!==id))
  }
  async function upsertStake(data,id){
    const row={...data,updated_at:new Date().toISOString()};if(id)row.id=id
    const{data:saved}=await supabase.from('stakeholders').upsert(row).select().single()
    setStakes(p=>id?p.map(s=>s.id===id?saved:s):[...p,saved])
    return saved
  }
  async function deleteStake(id){
    await supabase.from('stakeholders').delete().eq('id',id)
    setStakes(p=>p.filter(s=>s.id!==id))
  }

  // ── Inbox sync ───────────────────────────────────────────────────────────────
  // Only syncs from the active Outlook inbox — ask Claude to fetch and provide
  // new email data when you want to sync.
  async function runInboxSync(emailData){
    if(!emailData||!emailData.length){showToast('No new emails to sync');return}
    setSyncing(true)
    try{
      const syncedIds=new Set(engs.map(e=>e.synced_email_id).filter(Boolean))
      const newEmails=emailData.filter(em=>!syncedIds.has(em.id))
      let added=0
      for(const em of newEmails){
        let stake=stakes.find(s=>s.email?.toLowerCase()===em.primaryEmail.toLowerCase())
        if(!stake){
          const namePart=em.primaryEmail.split('@')[0].split(/[._-]/)[0]
          const name=namePart.charAt(0).toUpperCase()+namePart.slice(1).toLowerCase()+(em.recipients.length>1?` + ${em.recipients.length-1} others`:'')
          stake=await upsertStake({name,role:'',institution:em.institution,email:em.primaryEmail,notes:'Added via email sync'})
          setInstOrder(p=>[...new Set([...p,em.institution])])
        }
        await upsertEng({synced_email_id:em.id,institution:em.institution,stakeholder_id:stake.id,stakeholder_name:stake.name,date:em.date,type:'Email',objective:em.objective,status:'Follow-up needed',owner:'Al Briggs',notes:em.summary,actions:[]})
        added++
      }
      await supabase.from('et_meta').upsert({id:'singleton',last_sync_at:new Date().toISOString(),updated_at:new Date().toISOString()})
      showToast(added>0?`✓ ${added} new engagement${added!==1?'s':''} added`:'✓ Already up to date')
    }catch(err){console.error(err);showToast('Sync failed')}
    finally{setSyncing(false)}
  }

  // ── SharePoint manual submit ─────────────────────────────────────────────────
  // Replace the URL below with your Power Automate HTTP POST URL
  async function sendToSharePoint(eng) {
    const stake = stakes.find(s=>s.id===eng.stakeholder_id)
    try {
      const res = await fetch('/api/sharepoint-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MANUAL',
          record: {
            id:                   eng.id,
            institution:          eng.institution,
            stakeholder_name:     eng.stakeholder_name,
            contact_email:        stake?.email || '',
            date:                 eng.date,
            type:                 eng.type,
            objective:            eng.objective || '',
            status:               eng.status,
            owner:                eng.owner || '',
            notes:                eng.notes || '',
            travel_needed:        eng.travel_needed ?? false,
            travel_justification: eng.travel_justification ?? '',
            travel_cost:          eng.travel_cost ?? null,
            travel_start:         eng.travel_start ?? '',
            travel_end:           eng.travel_end ?? '',
          }
        })
      })
      if(res.ok || res.status === 202){
        showToast('✓ Sent to SharePoint')
      } else {
        showToast('SharePoint error — check flow')
      }
    } catch(err) {
      console.error(err)
      showToast('Failed to reach SharePoint flow')
    }
  }

  // ── Auto-merge duplicate stakeholders ────────────────────────────────────────
  async function mergeDuplicates(){
    const byEmail={}
    stakes.forEach(s=>{if(!s.email)return;const k=s.email.toLowerCase();if(!byEmail[k])byEmail[k]=[];byEmail[k].push(s)})
    let merged=0
    for(const group of Object.values(byEmail)){
      if(group.length<2)continue
      group.sort((a,b)=>(b.role?2:0)+b.name.length-((a.role?2:0)+a.name.length))
      const primary=group[0]
      for(const dupe of group.slice(1)){
        const affected=engs.filter(e=>e.stakeholder_id===dupe.id)
        for(const e of affected){
          await supabase.from('engagements').update({stakeholder_id:primary.id,stakeholder_name:primary.name}).eq('id',e.id)
        }
        await supabase.from('stakeholders').delete().eq('id',dupe.id)
        merged++
      }
    }
    if(merged>0){
      const[{data:eRows},{data:sRows}]=await Promise.all([supabase.from('engagements').select('*').order('date',{ascending:false}),supabase.from('stakeholders').select('*').order('name')])
      setEngs(eRows||[]);setStakes(sRows||[])
      showToast(`✓ ${merged} duplicate${merged!==1?'s':''} merged`)
    }else{showToast('No duplicates found')}
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const allInsts=[...new Set([...instOrder,...engs.map(e=>e.institution),...stakes.map(s=>s.institution)].filter(Boolean))]
  const allActs=engs.flatMap(e=>((e.actions&&Array.isArray(e.actions)?e.actions:[])).map(a=>({...a,inst:e.institution,stake:e.stakeholder_name,date:e.date,engId:e.id})))
  const openActs=allActs.filter(a=>!a.done)

  // ── Save handlers ─────────────────────────────────────────────────────────────
  async function handleSaveEng(formData){
    const tmpToReal={}
    for(const s of(formData._newStakeholders||[])){
      const saved=await upsertStake({name:s.name,role:s.role,institution:s.institution,email:'',notes:''})
      tmpToReal[s.id]=saved.id
      setInstOrder(p=>[...new Set([...p,s.institution])])
    }
    const sid=tmpToReal[formData.stakeholder_id]||formData.stakeholder_id
    const so=[...stakes,...(formData._newStakeholders||[])].find(s=>s.id===formData.stakeholder_id)||stakes.find(s=>s.id===sid)
    await upsertEng({institution:formData.institution,stakeholder_id:sid,stakeholder_name:so?.name||formData.stakeholder_name,date:formData.date,type:formData.type,objective:formData.objective,status:formData.status,owner:formData.owner,notes:formData.notes,actions:formData.actions},editEngId||undefined)
    setInstOrder(p=>[...new Set([...p,formData.institution])])
    setEngModal(null);setEditEngId(null)
    showToast(editEngId?'✓ Engagement updated':'✓ Engagement saved')
  }
  async function handleSaveStake(formData){
    await upsertStake(formData,editStakeId||undefined)
    setInstOrder(p=>[...new Set([...p,formData.institution])])
    setStakeModal(null);setEditStakeId(null)
    showToast(editStakeId?'✓ Stakeholder updated':'✓ Stakeholder saved')
  }
  async function toggleAction(engId,actionId){
    const e=engs.find(x=>x.id===engId);if(!e)return
    const newActions=(e.actions||[]).map(a=>a.id===actionId?{...a,done:!a.done}:a)
    await supabase.from('engagements').update({actions:newActions}).eq('id',engId)
    setEngs(p=>p.map(x=>x.id===engId?{...x,actions:newActions}:x))
    const a=newActions.find(x=>x.id===actionId)
    showToast(a?.done?'✓ Action complete':'Action reopened')
  }
  async function closeEng(engId){
    await supabase.from('engagements').update({status:'Closed'}).eq('id',engId)
    setEngs(p=>p.map(e=>e.id===engId?{...e,status:'Closed'}:e))
    showToast('✓ Engagement closed')
  }
  async function addInstitution(){
    const name=newInstName.trim()
    if(!name)return
    if(allInsts.includes(name)){showToast('Already exists');return}
    setInstOrder(p=>[name,...p]);setNewInstName('');setShowInstForm(false)
    setSelInst(name);showToast(`✓ ${name} added`)
  }

  const tabs=[{id:'overview',label:'Overview'},{id:'institutions',label:'Institutions'},{id:'stakeholders',label:'Stakeholders'}]

  if(loading)return(
    <div style={{ fontFamily:FONT,background:C.black,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12 }}>
      <div style={{ height:4,background:C.accent,width:40 }}/>
      <div style={{ color:'rgba(255,255,255,0.35)',fontSize:13,fontWeight:300,letterSpacing:1 }}>Loading</div>
    </div>
  )

  const filteredInsts=allInsts.filter(n=>n.toLowerCase().includes(instSearch.toLowerCase()))
  function selectInst(name){setSelInst(name);setShowEngForm(false);setShowStakeForm(false);setStakesOpen(true);setEngsOpen(true)}
  function sortEngs(list){
    return list.slice().sort((a,b)=>{
      const aClosed=a.status==='Closed'?1:0
      const bClosed=b.status==='Closed'?1:0
      if(aClosed!==bClosed)return aClosed-bClosed
      return b.date.localeCompare(a.date)
    })
  }
  const instEngs=selInst?sortEngs(engs.filter(e=>e.institution===selInst)):[]
  const instStakes=selInst?stakes.filter(s=>s.institution===selInst):[]
  const instOpenActs=instEngs.flatMap(e=>(e.actions||[]).filter(a=>!a.done).map(a=>({...a,stake:e.stakeholder_name,date:e.date,engId:e.id})))

  return(
    <div style={{ fontFamily:FONT,minHeight:'100vh',background:C.bg }}>
      <style>{`*{box-sizing:border-box}input,select,textarea,button{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;border-radius:0!important}body{margin:0}input:focus,select:focus,textarea:focus{outline:none;border-color:${C.accent}!important}`}</style>
      <div style={{ height:4,background:C.accent,position:'fixed',top:0,left:0,right:0,zIndex:300 }}/>
      <div style={{ background:C.black,borderBottom:`4px solid ${C.accent}`,paddingTop:4,position:'fixed',top:0,left:0,right:0,zIndex:200 }}>
        <div style={{ padding:'16px 24px 0' }}>
          <div style={{ fontSize:24,fontWeight:700,letterSpacing:-0.5,color:C.white,fontFamily:FONT }}>Engagement Tracker</div>
          <div style={{ fontSize:11,fontWeight:300,color:'rgba(255,255,255,0.35)',marginTop:4,paddingBottom:12,fontFamily:FONT }}>
            {engs.length} engagement{engs.length!==1?'s':''}<span style={{ color:C.accent }}> | </span>
            {allInsts.length} institution{allInsts.length!==1?'s':''}<span style={{ color:C.accent }}> | </span>
            {stakes.length} stakeholder{stakes.length!==1?'s':''}
          </div>
          <div style={{ display:'flex' }}>
            {tabs.map((t,i)=><button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'10px 0',marginRight:32,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:tab===t.id?C.white:C.accent,background:'transparent',border:'none',borderBottom:tab===t.id?`2px solid ${C.accent}`:'2px solid transparent',marginBottom:-1,cursor:'pointer',fontFamily:FONT }}>{t.label}</button>)}
          </div>
        </div>
      </div>

      <div style={{ paddingTop:112 }}>

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div style={{ display:'grid',gridTemplateColumns:'320px 1fr',height:'calc(100vh - 112px)',overflow:'hidden' }}>
            {/* Left — open actions */}
            <div style={{ borderRight:`1px solid ${C.border}`,overflowY:'auto',background:C.white }}>
              <div style={{ padding:'14px 16px',borderBottom:`1px solid ${C.borderLight}`,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:C.white,zIndex:10 }}>
                <div style={{ fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.accent,fontFamily:FONT }}>Open actions</div>
                <div style={{ fontSize:11,fontWeight:700,color:C.red }}>{openActs.length} pending</div>
              </div>
              {openActs.length?openActs.map((a,i)=>(
                <div key={i} style={{ padding:'12px 16px',borderBottom:`0.5px solid ${C.borderLight}` }}>
                  <div style={{ display:'flex',alignItems:'flex-start',gap:8 }}>
                    <div style={{ width:7,height:7,borderRadius:'50%',background:PRI_C[a.priority]||C.amber,marginTop:5,flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:600,color:C.black,fontFamily:FONT }}>{a.text}</div>
                      <div style={{ fontSize:11,color:C.light,marginTop:2,fontFamily:FONT }}>{a.inst}<span style={{ color:C.accent }}> · </span>{a.stake}<span style={{ color:C.accent }}> · </span>{a.date}</div>
                    </div>
                    <Tag color={PRI_C[a.priority]||C.amber}>{a.priority}</Tag>
                  </div>
                  <button onClick={()=>toggleAction(a.engId,a.id)} style={{ marginTop:6,marginLeft:15,background:'transparent',border:`1px solid ${C.border}`,padding:'3px 9px',fontSize:11,fontWeight:700,letterSpacing:'0.5px',textTransform:'uppercase',cursor:'pointer',fontFamily:FONT,color:C.mid }}>Mark done</button>
                </div>
              )):<div style={{ textAlign:'center',padding:'40px 20px',color:C.light,fontSize:13,fontFamily:FONT }}>No open actions</div>}
            </div>
            {/* Right — stats + recent */}
            <div style={{ overflowY:'auto',padding:'20px 24px' }}>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:1,background:C.border,border:`0.5px solid ${C.border}`,marginBottom:20 }}>
                {[{v:engs.length,l:'Engagements',c:C.accent},{v:allInsts.length,l:'Institutions'},{v:openActs.length,l:'Open actions',c:C.red},{v:allActs.filter(a=>a.done).length,l:'Completed'}].map(({v,l,c})=>(
                  <div key={l} style={{ background:C.white,padding:'14px 16px' }}>
                    <div style={{ fontSize:30,fontWeight:700,color:c||C.black,lineHeight:1,fontFamily:FONT }}>{v}</div>
                    <div style={{ fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:C.light,marginTop:4,fontFamily:FONT }}>{l}</div>
                  </div>
                ))}
              </div>
              <SectionHead label="Recent engagements" right={
                <div style={{ display:'flex',gap:8 }}>
                  <Btn label="+ Log engagement" small accent onClick={()=>{setEditEngId(null);setEngModal('new')}}/>
                  <Btn label="↓ Export" small ghost onClick={exportXLSX}/>
                </div>
              }/>
              <div style={{ display:'flex',gap:8,marginBottom:14,flexWrap:'wrap' }}>
                <input style={{ ...inp,flex:1,minWidth:120,marginBottom:0,fontSize:13 }} placeholder="Search…" value={ovSearch} onChange={e=>setOvSearch(e.target.value)}/>
                <select style={{ ...sel,minWidth:120,marginBottom:0,fontSize:13 }} value={fType} onChange={e=>setFType(e.target.value)}><option value="">All types</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
                <select style={{ ...sel,minWidth:140,marginBottom:0,fontSize:13 }} value={fObj} onChange={e=>setFObj(e.target.value)}><option value="">All objectives</option>{OBJECTIVES.map(o=><option key={o}>{o}</option>)}</select>
                <select style={{ ...sel,minWidth:140,marginBottom:0,fontSize:13 }} value={fStatus} onChange={e=>setFStatus(e.target.value)}><option value="">All statuses</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
              </div>
              {sortEngs(engs.filter(e=>{
                if(fType&&e.type!==fType)return false
                if(fObj&&e.objective!==fObj)return false
                if(fStatus&&e.status!==fStatus)return false
                if(ovSearch&&![e.institution,e.stakeholder_name,e.notes,e.owner,e.objective].join(' ').toLowerCase().includes(ovSearch.toLowerCase()))return false
                return true
              })).map(e=>(
                <EngCard key={e.id} eng={e} stake={stakes.find(s=>s.id===e.stakeholder_id)}
                  onEdit={()=>{setEditEngId(e.id);setEngModal(e)}}
                  onDelete={()=>{if(window.confirm('Delete?'))deleteEng(e.id)}}
                  onToggleAction={toggleAction} onClose={closeEng} onSharePoint={sendToSharePoint}/>
              ))}
            </div>
          </div>
        )}

        {/* ── INSTITUTIONS ── */}
        {tab==='institutions'&&(
          <div style={{ display:'grid',gridTemplateColumns:'320px 1fr',height:'calc(100vh - 112px)',overflow:'hidden' }}>
            {/* Left list */}
            <div style={{ borderRight:`1px solid ${C.border}`,overflowY:'auto',background:C.white }}>
              <div style={{ padding:'14px 16px',borderBottom:`1px solid ${C.borderLight}`,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:C.white,zIndex:10 }}>
                <div style={{ fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.accent,fontFamily:FONT }}>Institutions</div>
                <Btn label="+ Add" small accent onClick={()=>setShowInstForm(v=>!v)}/>
              </div>
              {showInstForm&&(
                <div style={{ padding:'12px 16px',borderBottom:`0.5px solid ${C.borderLight}`,background:'#f9f9f9' }}>
                  <input style={{ ...inp,marginBottom:8,fontSize:13 }} placeholder="Institution name…" value={newInstName} onChange={e=>setNewInstName(e.target.value)} autoFocus onKeyDown={e=>e.key==='Enter'&&addInstitution()}/>
                  <div style={{ display:'flex',gap:6 }}>
                    <Btn label="Add" small onClick={addInstitution}/>
                    <Btn label="Cancel" small ghost onClick={()=>{setShowInstForm(false);setNewInstName('')}}/>
                  </div>
                </div>
              )}
              <div style={{ padding:'8px 16px 4px' }}>
                <input style={{ ...inp,marginBottom:0,fontSize:13,background:'#f9f9f9' }} placeholder="Search…" value={instSearch} onChange={e=>setInstSearch(e.target.value)}/>
              </div>
              {filteredInsts.map(name=>{
                const ie=engs.filter(e=>e.institution===name)
                const open=ie.filter(e=>e.status!=='Closed').length
                const isDragging=dragSrc===name
                return <div
                  key={name}
                  draggable
                  onDragStart={e=>{setDragSrc(name);e.dataTransfer.effectAllowed='move'}}
                  onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect='move'}}
                  onDrop={e=>{
                    e.preventDefault()
                    if(!dragSrc||dragSrc===name)return
                    setInstOrder(prev=>{
                      const next=[...prev]
                      const from=next.indexOf(dragSrc)
                      const to=next.indexOf(name)
                      if(from<0||to<0)return prev
                      next.splice(from,1)
                      next.splice(to,0,dragSrc)
                      return next
                    })
                    setDragSrc(null)
                  }}
                  onDragEnd={()=>setDragSrc(null)}
                  onClick={()=>selectInst(name)}
                  style={{ padding:'14px 16px',borderBottom:`0.5px solid ${C.borderLight}`,cursor:'grab',position:'relative',background:selInst===name?'#E6F1FB':C.white,borderLeft:selInst===name?`3px solid ${C.accent}`:'3px solid transparent',opacity:isDragging?0.4:1,transition:'opacity 0.15s' }}
                >
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ color:'#ccc',fontSize:14,userSelect:'none',flexShrink:0 }}>⠿</span>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:14,fontWeight:700,color:selInst===name?'#0C447C':C.black,fontFamily:FONT,paddingRight:50 }}>{name}</div>
                      <div style={{ fontSize:11,fontWeight:300,color:C.light,marginTop:2,fontFamily:FONT,lineHeight:1.6 }}>
                        {open>0?<span style={{ color:C.red,fontWeight:700 }}>{open} open engagement{open!==1?'s':''}</span>:<span style={{ color:C.green }}>No open engagements</span>}
                      </div>
                    </div>
                  </div>
                  {open>0&&<div style={{ position:'absolute',top:14,right:14,background:C.red,color:C.white,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',padding:'2px 7px' }}>{open} open</div>}
                </div>
              })}
            </div>
            {/* Right detail */}
            <div style={{ overflowY:'auto',background:C.bg }}>
              {!selInst?(
                <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:C.light,fontSize:14,fontWeight:300,gap:8,fontFamily:FONT }}>
                  <div style={{ fontSize:40,color:'#ddd' }}>⌗</div>
                  <div>Select an institution</div>
                </div>
              ):(
                <>
                  <div style={{ background:C.white,borderBottom:`1px solid ${C.border}`,padding:'20px 24px',position:'sticky',top:0,zIndex:10 }}>
                    <div style={{ fontSize:24,fontWeight:700,color:C.black,fontFamily:FONT,marginBottom:4 }}>{selInst}</div>
                    <div style={{ fontSize:12,fontWeight:300,color:C.light,fontFamily:FONT }}>
                      {instEngs.length} engagement{instEngs.length!==1?'s':''}<SEP/>
                      {instStakes.length} stakeholder{instStakes.length!==1?'s':''}<SEP/>
                      <span style={{ color:instOpenActs.length?C.red:C.green,fontWeight:instOpenActs.length?700:300 }}>{instOpenActs.length} open action{instOpenActs.length!==1?'s':''}</span>
                    </div>
                    <div style={{ display:'flex',gap:8,marginTop:14 }}>
                      <Btn label="+ Engagement" small accent onClick={()=>{setShowEngForm(v=>!v);setShowStakeForm(false)}}/>
                      <Btn label="+ Stakeholder" small ghost onClick={()=>{setShowStakeForm(v=>!v);setShowEngForm(false)}}/>
                    </div>
                  </div>
                  <div style={{ padding:'20px 24px' }}>
                    {/* Inline engagement form */}
                    {showEngForm&&(
                      <div style={{ background:'#F7F7F5',border:`0.5px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,padding:16,marginBottom:16 }}>
                        <div style={{ fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.accent,marginBottom:14,fontFamily:FONT }}>New engagement — {selInst}</div>
                        <EngagementForm initial={{ institution:selInst }} stakeholders={instStakes} onSave={d=>{handleSaveEng(d);setShowEngForm(false)}} onClose={()=>setShowEngForm(false)}/>
                      </div>
                    )}
                    {/* Inline stakeholder form */}
                    {showStakeForm&&(
                      <div style={{ background:'#F7F7F5',border:`0.5px solid ${C.border}`,borderLeft:`3px solid ${C.green}`,padding:16,marginBottom:16 }}>
                        <div style={{ fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.green,marginBottom:14,fontFamily:FONT }}>New stakeholder — {selInst}</div>
                        <StakeholderForm initial={{ institution:selInst }} allInsts={allInsts} onSave={d=>{handleSaveStake(d);setShowStakeForm(false)}} onClose={()=>setShowStakeForm(false)}/>
                      </div>
                    )}
                    {/* Open actions */}
                    {instOpenActs.length>0&&(
                      <div style={{ background:C.white,border:`0.5px solid ${C.border}`,borderLeft:`3px solid ${C.red}`,padding:'14px 16px',marginBottom:20 }}>
                        <div style={{ fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.red,marginBottom:10,fontFamily:FONT }}>Open actions — {instOpenActs.length}</div>
                        {instOpenActs.map((a,i)=>(
                          <div key={i} style={{ display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:`0.5px solid ${C.borderLight}`,fontSize:13,fontFamily:FONT }}>
                            <div style={{ width:7,height:7,borderRadius:'50%',background:PRI_C[a.priority]||C.amber,flexShrink:0 }}/>
                            <div style={{ flex:1 }}><span style={{ fontWeight:600 }}>{a.text}</span><span style={{ fontSize:11,color:C.light,marginLeft:8 }}>{a.stake} · {a.date}</span></div>
                            <Tag color={PRI_C[a.priority]||C.amber}>{a.priority}</Tag>
                            <button onClick={()=>toggleAction(a.engId,a.id)} style={{ background:'transparent',border:`1px solid ${C.border}`,padding:'3px 9px',fontSize:11,fontWeight:700,letterSpacing:'0.5px',textTransform:'uppercase',cursor:'pointer',fontFamily:FONT,color:C.mid }}>Mark done</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Stakeholders */}
                    <div style={{ marginBottom:24 }}>
                      <SectionHead label="Stakeholders" right={
                        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                          <span style={{ fontSize:11,fontWeight:300,color:C.light }}>{instStakes.length}</span>
                          <button onClick={()=>setStakesOpen(v=>!v)} style={{ background:'none',border:'none',fontSize:13,cursor:'pointer',color:C.light,lineHeight:1,padding:0,fontFamily:FONT }}>{stakesOpen?'▲':'▼'}</button>
                        </div>
                      }/>
                      {stakesOpen&&(instStakes.length?instStakes.map(s=>(
                        <div key={s.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:`0.5px solid ${C.borderLight}` }}>
                          <Avatar name={s.name}/>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:14,fontWeight:700,color:C.black,fontFamily:FONT }}>{s.name}</div>
                            <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:3 }}>
                              {s.role&&<Tag small color={ROLE_C[s.role]||C.mid}>{s.role}</Tag>}
                              {s.email&&<span style={{ fontSize:11,color:C.light,fontFamily:FONT }}>{s.email}</span>}
                            </div>
                          </div>
                          <span style={{ fontSize:11,color:C.light,fontFamily:FONT }}>{engs.filter(e=>e.stakeholder_id===s.id).length} eng.</span>
                          <button onClick={()=>{setEditStakeId(s.id);setStakeModal(s)}} style={{ background:'none',border:'none',fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.accent,cursor:'pointer',fontFamily:FONT }}>Edit</button>
                          <button onClick={()=>{if(window.confirm('Delete this stakeholder?'))deleteStake(s.id)}} style={{ background:'none',border:'none',fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.light,cursor:'pointer',fontFamily:FONT }}>Delete</button>
                        </div>
                      )):<div style={{ fontSize:13,color:C.light,padding:'8px 0',fontFamily:FONT }}>None yet — click "+ Stakeholder" above.</div>)}
                    </div>
                    {/* Engagements */}
                    <SectionHead label="Engagements" right={
                      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                        <span style={{ fontSize:11,fontWeight:300,color:C.light }}>{instEngs.length}</span>
                        <button onClick={()=>setEngsOpen(v=>!v)} style={{ background:'none',border:'none',fontSize:13,cursor:'pointer',color:C.light,lineHeight:1,padding:0,fontFamily:FONT }}>{engsOpen?'▲':'▼'}</button>
                      </div>
                    }/>
                    {engsOpen&&(instEngs.length?instEngs.map(e=>(
                      <EngCard key={e.id} eng={e} stake={stakes.find(s=>s.id===e.stakeholder_id)} compact
                        onEdit={()=>{setEditEngId(e.id);setEngModal(e)}}
                        onDelete={()=>{if(window.confirm('Delete?'))deleteEng(e.id)}}
                        onToggleAction={toggleAction} onClose={closeEng} onSharePoint={sendToSharePoint}/>
                    )):<div style={{ fontSize:13,color:C.light,padding:'8px 0',fontFamily:FONT }}>None yet — click "+ Engagement" above.</div>)}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── STAKEHOLDERS ── */}
        {tab==='stakeholders'&&(
          <div style={{ padding:'20px 24px',maxWidth:960 }}>
            <div style={{ display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center' }}>
              <input style={{ ...inp,flex:1,marginBottom:0,fontSize:13 }} placeholder="Search stakeholders…" value={stakeSearch} onChange={e=>setStakeSearch(e.target.value)}/>
              <select style={{ ...sel,minWidth:180,marginBottom:0,fontSize:13 }} value={stakeInstF} onChange={e=>setStakeInstF(e.target.value)}><option value="">All institutions</option>{allInsts.map(n=><option key={n}>{n}</option>)}</select>
              <select style={{ ...sel,minWidth:160,marginBottom:0,fontSize:13 }} value={stakeRoleF} onChange={e=>setStakeRoleF(e.target.value)}><option value="">All roles</option>{ROLES.map(r=><option key={r}>{r}</option>)}</select>
              <Btn label="+ Add stakeholder" small onClick={()=>{setEditStakeId(null);setStakeModal({})}}/>
              <Btn label="Merge duplicates" small ghost onClick={mergeDuplicates}/>
            </div>
            {stakes.filter(s=>{
              if(stakeInstF&&s.institution!==stakeInstF)return false
              if(stakeRoleF&&s.role!==stakeRoleF)return false
              if(stakeSearch&&![s.name,s.role,s.institution,s.email].join(' ').toLowerCase().includes(stakeSearch.toLowerCase()))return false
              return true
            }).map(s=>{
              const n=engs.filter(e=>e.stakeholder_id===s.id).length
              return <div key={s.id} style={{ background:C.white,border:`0.5px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,marginBottom:6,padding:'12px 16px',display:'flex',alignItems:'center',gap:14 }}>
                <Avatar name={s.name} size={40}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:15,fontWeight:700,color:C.black,fontFamily:FONT }}>{s.name}</div>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:3,flexWrap:'wrap' }}>
                    {s.role&&<Tag small color={ROLE_C[s.role]||C.mid}>{s.role}</Tag>}
                    <span style={{ fontSize:12,fontWeight:300,color:C.light,fontFamily:FONT }}>{s.institution||'—'}</span>
                  </div>
                  {s.email&&<div style={{ fontSize:12,fontWeight:300,color:C.light,marginTop:2,fontFamily:FONT }}>{s.email}</div>}
                </div>
                <div style={{ fontSize:12,fontWeight:300,color:C.light,whiteSpace:'nowrap',fontFamily:FONT }}>{n} eng.</div>
                <button onClick={()=>{setEditStakeId(s.id);setStakeModal(s)}} style={{ background:'none',border:'none',fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.accent,cursor:'pointer',fontFamily:FONT }}>Edit</button>
                <button onClick={()=>{if(window.confirm('Delete?'))deleteStake(s.id)}} style={{ background:'none',border:'none',fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.light,cursor:'pointer',fontFamily:FONT }}>Del</button>
              </div>
            })}
          </div>
        )}
      </div>

      {/* Engagement modal */}
      {engModal&&(
        <Modal title={editEngId?'Edit engagement':'Log engagement'} onClose={()=>{setEngModal(null);setEditEngId(null)}}>
          <EngagementForm initial={editEngId?engModal:(engModal!=='new'?engModal:null)} stakeholders={stakes} onSave={handleSaveEng} onClose={()=>{setEngModal(null);setEditEngId(null)}}/>
        </Modal>
      )}

      {/* Stakeholder modal */}
      {stakeModal!==null&&(
        <Modal title={editStakeId?'Edit stakeholder':'Add stakeholder'} onClose={()=>{setStakeModal(null);setEditStakeId(null)}}>
          <StakeholderForm initial={editStakeId?stakeModal:(stakeModal?.institution?stakeModal:null)} allInsts={allInsts} onSave={handleSaveStake} onClose={()=>{setStakeModal(null);setEditStakeId(null)}}/>
        </Modal>
      )}

      <Toast msg={toast}/>
    </div>
  )

  function exportXLSX(){
    import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js').then(XLSX=>{
      const wb=XLSX.utils.book_new(),rows=[]
      engs.forEach(e=>{
        const s=stakes.find(x=>x.id===e.stakeholder_id)
        const base={Institution:e.institution,Stakeholder:e.stakeholder_name,Role:s?.role||'',Date:e.date,Type:e.type,Objective:e.objective||'',Status:e.status,Owner:e.owner||'',Notes:e.notes||'',Source:e.synced_email_id?'Email sync':'Manual'}
        const acts=e.actions||[]
        if(!acts.length)rows.push({...base,'Action/Next step':'',Priority:'','Action status':''})
        else acts.forEach((a,i)=>rows.push({...(i===0?base:Object.fromEntries(Object.keys(base).map(k=>[k,'']))),'Action/Next step':a.text,Priority:a.priority,'Action status':a.done?'Complete':'Open'}))
      })
      const ws=XLSX.utils.json_to_sheet(rows)
      ws['!cols']=[22,22,20,12,12,28,16,16,40,10,32,10,12].map(w=>({wch:w}))
      XLSX.utils.book_append_sheet(wb,'Engagements',ws)
      const byI={}
      engs.forEach(e=>{
        if(!byI[e.institution])byI[e.institution]={institution:e.institution,engagements:0,openActions:0,closedActions:0,stakeholders:new Set(),objectives:new Set()}
        byI[e.institution].engagements++;byI[e.institution].stakeholders.add(e.stakeholder_name)
        if(e.objective)byI[e.institution].objectives.add(e.objective)
        ;(e.actions||[]).forEach(a=>a.done?byI[e.institution].closedActions++:byI[e.institution].openActions++)
      })
      const ws2=XLSX.utils.json_to_sheet(Object.values(byI).map(r=>({Institution:r.institution,Engagements:r.engagements,Stakeholders:r.stakeholders.size,'Objectives covered':[...r.objectives].join(', '),'Open actions':r.openActions,'Completed actions':r.closedActions})))
      ws2['!cols']=[26,14,14,40,14,18].map(w=>({wch:w}))
      XLSX.utils.book_append_sheet(wb,'Summary by institution',ws2)
      if(stakes.length){const ws3=XLSX.utils.json_to_sheet(stakes.map(s=>({Name:s.name,Role:s.role||'',Institution:s.institution||'',Email:s.email||'',Engagements:engs.filter(e=>e.stakeholder_id===s.id).length})));ws3['!cols']=[22,20,24,28,14].map(w=>({wch:w}));XLSX.utils.book_append_sheet(wb,'Stakeholders',ws3)}
      XLSX.writeFile(wb,'engagements_export.xlsx')
    })
  }
}
