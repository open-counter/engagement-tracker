import React, { useState, useEffect } from 'react'
import { supabase } from './supabase.js'

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif"

function useWindowWidth() {
  const [width, setWidth] = React.useState(window.innerWidth)
  React.useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}
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

const ACT_CATEGORIES   = ['Governance-SBR/QBR/Annual Business Review','Faculty-Staff Webinar','Faculty-Staff Meeting','Faculty Event','Student Webinar','Student On-Campus','Student Competition','Deployment / IT Meeting']
const ENG_VECTORS      = ['Awareness','Curriculum','Student Life','Career Readiness','Administration']
const ACT_FORMATS      = ['Virtual','In-Person','Hybrid']
const ACT_TYPES        = ['Core Product','CSM Local Activity','CSM Student Activity','Faculty Activity','Curriculum Integration','Webinar','Workshop','Meeting','SPVG']
const TARGET_AUDIENCES = ['Educators','Admin Staff','Students','Executive','Faculty']
const ACT_LOCATIONS    = ['NSW','QLD','VIC','SA','WA','ACT','NT','TAS','SG','MY','PH','ID','TH','NZ','OTHER']

const ROLE_C   = { Executive:C.navy,'Program Leadership':C.purple,Faculty:C.black,'Academic Support':C.accent,'Student Services':C.green,IT:C.amber,Library:C.mid }
const OBJ_C    = { Awareness:C.accent,'Staff and Student Engagement':C.green,'AI Innovation and Leadership':C.purple,'Curriculum Support':C.amber,'IT/Tech Support':C.black }
const STATUS_C = { Active:C.green,'Follow-up needed':C.amber,'On hold':C.mid,Closed:C.light }
const PRI_C    = { High:C.red,Medium:C.amber,Low:C.green }

const INST_COLORS = [
  '#50a0cd','#2c3e50','#8e44ad','#27ae60','#e67e22',
  '#c0392b','#16a085','#2980b9','#8e6b00','#6c3483',
  '#1a5276','#117a65','#784212','#4a235a','#0e6655',
  '#5d6d7e','#7b241c','#1a7a4a','#154360','#196f3d',
]
// Colour map is loaded from Supabase (et_meta.inst_colors) and kept in module scope
// so instColor() works in both component and non-component contexts
let instColorMap = {}
function instColor(name) {
  if(!name) return INST_COLORS[0]
  if(instColorMap[name]) return instColorMap[name]
  // Fallback: assign by position in current map
  const idx = Object.keys(instColorMap).length % INST_COLORS.length
  instColorMap[name] = INST_COLORS[idx]
  return instColorMap[name]
}
function assignColor(name, existingMap) {
  if(existingMap[name]) return existingMap[name]
  const usedColors = new Set(Object.values(existingMap))
  const next = INST_COLORS.find(c=>!usedColors.has(c)) || INST_COLORS[Object.keys(existingMap).length % INST_COLORS.length]
  return next
}
function fmtDate(d){
  if(!d)return''
  const parts=d.split('-')
  if(parts.length<3)return d
  return parts[2]+'-'+parts[1]
}

const DOMAIN_MAP = {
  'latrobe.edu.au':        'LTU',
  'sa.gov.au':             'SA Government — Education',
  'curtin.edu.au':         'Curtin',
  'curtincollege.edu.au':  'Curtin',
  'guild.uwa.edu.au':      'UWA',
  'uwa.edu.au':            'UWA',
  'rmit.edu.au':           'RMIT',
  'westernsydney.edu.au':  'WSU',
  'swin.edu.au':           'Swinburne',
  'torrens.edu.au':        'Torrens/MDS',
  'mediadesignschool.com': 'Torrens/MDS',
  'nmtafe.wa.edu.au':      'NM TAFE',
  'bond.edu.au':           'Bond',
  'ecu.edu.au':            'ECU',
  'deakin.edu.au':         'Deakin',
  'ite.edu.sg':            'ITE',
  'aut.ac.nz':             'AUT',
  'tafe.qld.edu.au':       'TAFE Qld',
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
function PinScreen({ onUnlock }) {
  const [pin,setPin] = React.useState('')
  const [error,setError] = React.useState(false)
  const [shake,setShake] = React.useState(false)

  function handleKey(k){
    if(pin.length>=6)return
    const next=pin+k
    setPin(next);setError(false)
    if(next.length===4||next.length===5||next.length===6){
      // Try immediately at 4, 5 and 6 digits
      checkPin(next)
    }
  }
  function checkPin(val){
    const correct=import.meta.env.VITE_APP_PIN||'1234'
    if(val===correct){
      sessionStorage.setItem('et_unlocked','1')
      onUnlock()
    } else if(val.length>=correct.length){
      setShake(true);setError(true);setPin('')
      setTimeout(()=>setShake(false),500)
    }
  }
  function del(){setPin(p=>p.slice(0,-1));setError(false)}

  const dots=Array.from({length:6}).map((_,i)=>i)
  const pinLen=(import.meta.env.VITE_APP_PIN||'1234').length

  return(
    <div style={{ minHeight:'100vh',background:C.black,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:FONT }}>
      <div style={{ height:4,background:C.accent,position:'fixed',top:0,left:0,right:0 }}/>
      <div style={{ fontSize:22,fontWeight:700,color:C.white,letterSpacing:-0.5,marginBottom:6 }}>Engagement Tracker</div>
      <div style={{ fontSize:11,fontWeight:300,color:'rgba(255,255,255,0.3)',letterSpacing:2,textTransform:'uppercase',marginBottom:40 }}>Enter PIN to continue</div>
      <div style={{ display:'flex',gap:14,marginBottom:32,transform:shake?'translateX(-8px)':'none',transition:'transform 0.1s' }}>
        {Array.from({length:pinLen}).map((_,i)=>(
          <div key={i} style={{ width:12,height:12,borderRadius:'50%',background:pin.length>i?(error?C.red:C.accent):'transparent',border:`2px solid ${pin.length>i?(error?C.red:C.accent):'rgba(255,255,255,0.3)'}`,transition:'background 0.15s,border-color 0.15s' }}/>
        ))}
      </div>
      {error&&<div style={{ fontSize:11,fontWeight:700,color:C.red,letterSpacing:1,textTransform:'uppercase',marginBottom:20 }}>Incorrect PIN</div>}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,72px)',gap:12 }}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k,i)=>(
          k===''?<div key={i}/>:
          <button key={i} onClick={()=>k==='⌫'?del():handleKey(String(k))}
            style={{ width:72,height:72,borderRadius:'50%',background:k==='⌫'?'transparent':'rgba(255,255,255,0.07)',border:`1px solid ${k==='⌫'?'transparent':'rgba(255,255,255,0.12)'}`,color:C.white,fontSize:k==='⌫'?20:22,fontWeight:k==='⌫'?400:300,cursor:'pointer',fontFamily:FONT,display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.1s' }}
            onMouseOver={e=>e.currentTarget.style.background=k==='⌫'?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.15)'}
            onMouseOut={e=>e.currentTarget.style.background=k==='⌫'?'transparent':'rgba(255,255,255,0.07)'}
          >{k}</button>
        ))}
      </div>
    </div>
  )
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
  const [eventTitle,setEventTitle]               = useState(initial?.event_title||'')
  const [additionalStakeholders,setAddStakes]    = useState(initial?.additional_stakeholders||'')
  const [actCategory,setActCategory]       = useState(initial?.act_category||'')
  const [targetAudience,setTargetAudience] = useState(initial?.target_audience||'')
  const [actLocation,setActLocation]       = useState(initial?.act_location||'')
  const [engVector,setEngVector]     = useState(initial?.eng_vector||'')
  const [actFormat,setActFormat]     = useState(initial?.act_format||'')
  const [actType,setActType]         = useState(initial?.act_type||'')
  const [travelNeeded,setTravelNeeded] = useState(initial?.travel_needed??false)
  const [travelJustification,setTravelJustification] = useState(initial?.travel_justification??'')
  const [travelCost,setTravelCost] = useState(initial?.travel_cost??'')
  const [travelStart,setTravelStart] = useState(initial?.travel_start??'')
  const [travelEnd,setTravelEnd] = useState(initial?.travel_end??'')

  const allS = [...stakeholders,...tmpStakes]
  const instS = inst ? allS.filter(s=>s.institution?.toLowerCase()===inst.toLowerCase()&&s.name!=='(Add stakeholder)') : allS.filter(s=>s.name!=='(Add stakeholder)')
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
    onSave({ institution:inst.trim(),stakeholder_id:stakeId,stakeholder_name:so?.name||'',date,type,objective:obj,status,owner,event_title:eventTitle.trim(),additional_stakeholders:additionalStakeholders.trim(),notes:notes.trim(),actions:actions.filter(a=>a.text.trim()),_newStakeholders:tmpStakes,act_category:actCategory,eng_vector:engVector,act_format:actFormat,act_type:actType,target_audience:targetAudience,act_location:actLocation,travel_needed:travelNeeded,travel_justification:travelJustification.trim(),travel_cost:travelCost,travel_start:travelStart,travel_end:travelEnd })
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
    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
      <div><FieldLabel>Target audience</FieldLabel><select style={{...sel,marginBottom:0}} value={targetAudience} onChange={e=>setTargetAudience(e.target.value)}><option value="">— select —</option>{TARGET_AUDIENCES.map(o=><option key={o}>{o}</option>)}</select></div>
      <div><FieldLabel>Activity location</FieldLabel><select style={{...sel,marginBottom:0}} value={actLocation} onChange={e=>setActLocation(e.target.value)}><option value="">— select —</option>{ACT_LOCATIONS.map(o=><option key={o}>{o}</option>)}</select></div>
    </div>
    <Divider/>
    <FieldLabel>Event title</FieldLabel>
    <input style={inp} value={eventTitle} onChange={e=>setEventTitle(e.target.value)} placeholder="e.g. Curtin University — Meeting — 2026-06-05"/>
    <FieldLabel>Additional stakeholders</FieldLabel>
    <input style={inp} value={additionalStakeholders} onChange={e=>setAddStakes(e.target.value)} placeholder="e.g. Jane Smith, John Doe (separate with commas)"/>
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
  const tagColor = isClosed ? '#aaa' : null
  const dotColor = isClosed ? '#ccc' : null
  const accentCol = isClosed?'#ccc':openActions.length?C.red:instColor(eng.institution)
  return <div style={{ background:isClosed?'#f5f5f5':C.white,border:`0.5px solid ${isClosed?'#ddd':C.border}`,borderLeft:`3px solid ${accentCol}`,marginBottom:8,padding:'14px 16px' }}>
    <div style={{ display:'flex',alignItems:'flex-start',gap:10,marginBottom:8 }}>
      <span style={{ fontSize:16,fontWeight:700,color:isClosed?'#aaa':C.black,fontFamily:FONT,flexShrink:0,whiteSpace:'nowrap' }}>{fmtDate(eng.date)}</span>
      <span style={{ color:isClosed?'#ccc':C.accent,fontSize:16,fontWeight:300,flexShrink:0 }}>|</span>
      <div style={{ flex:1,minWidth:0 }}>
        {eng.event_title&&<div style={{ fontSize:16,fontWeight:700,color:isClosed?'#aaa':C.black,fontFamily:FONT,marginBottom:3,lineHeight:1.2 }}>{eng.event_title}</div>}
        <div style={{ fontSize:12,fontWeight:400,color:isClosed?'#ccc':C.light,fontFamily:FONT }}>
          {!compact&&eng.institution&&<><span style={{ fontWeight:500,color:isClosed?'#bbb':C.mid }}>{eng.institution}</span><span style={{ color:C.accent,margin:'0 5px' }}>|</span></>}
          <span style={{ fontWeight:500,color:isClosed?'#bbb':C.mid }}>{eng.stakeholder_name}</span>
          {eng.additional_stakeholders&&<><span style={{ color:C.accent,margin:'0 5px' }}>|</span><span style={{ color:isClosed?'#ccc':C.light }}>{eng.additional_stakeholders}</span></>}
        </div>
      </div>
    </div>
    <div style={{ display:'flex',gap:5,flexWrap:'wrap',marginBottom:eng.notes||(eng.actions||[]).length?8:0 }}>
      <Tag color={tagColor||C.accent}>{eng.type}</Tag>
      {eng.objective&&<Tag color={tagColor||(OBJ_C[eng.objective]||C.mid)}>{eng.objective}</Tag>}
      <Tag color={tagColor||(STATUS_C[eng.status]||C.mid)}>{eng.status}</Tag>
      {openActions.length>0&&<Tag color={tagColor||C.red}>{openActions.length} open action{openActions.length!==1?'s':''}</Tag>}
      {eng.sharepoint_submitted&&<Tag color={isClosed?'#bbb':'#27ae60'}>✓ In SharePoint</Tag>}
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
      {onSharePoint&&!isClosed&&(
        eng.sharepoint_submitted
          ? <button disabled style={{ background:'transparent',border:`1px solid #ccc`,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#bbb',cursor:'not-allowed',fontFamily:FONT,padding:'4px 10px' }}>✓ SharePoint</button>
          : <button onClick={()=>onSharePoint(eng)} style={{ background:C.black,border:'none',fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.white,cursor:'pointer',fontFamily:FONT,padding:'4px 10px' }}>→ SharePoint</button>
      )}
    </div>
  </div>
}

// ── Main App ──────────────────────────────────────────────────────────────────
function InstProfile({ name, data, showEdit, onToggleEdit, onSave }) {
  const [form,setForm] = React.useState({
    parent_name: data.parent_name||'',
    parent_id:   data.parent_id||'',
    org_id:      data.org_id||'',
    domain:      data.domain||'',
    sub_id:      data.sub_id||'',
    sub_name:    data.sub_name||'',
  })
  React.useEffect(()=>{
    setForm({
      parent_name: data.parent_name||'',
      parent_id:   data.parent_id||'',
      org_id:      data.org_id||'',
      domain:      data.domain||'',
      sub_id:      data.sub_id||'',
      sub_name:    data.sub_name||'',
    })
  },[name])

  const hasData=Object.values(form).some(v=>v.trim())
  const fields=[
    {key:'parent_name',label:'Parent Name'},
    {key:'parent_id',  label:'Parent ID'},
    {key:'org_id',     label:'Org ID'},
    {key:'domain',     label:'Domain'},
    {key:'sub_id',     label:'SUB ID'},
    {key:'sub_name',   label:'SUB Name'},
  ]

  return(
    <div style={{ background:C.white,border:`0.5px solid ${C.border}`,borderLeft:`3px solid ${C.black}`,padding:'14px 16px',marginBottom:16 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:showEdit||hasData?12:0 }}>
        <div style={{ fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.mid,fontFamily:FONT }}>Account details</div>
        <button onClick={onToggleEdit} style={{ background:'none',border:'none',fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.accent,cursor:'pointer',fontFamily:FONT }}>{showEdit?'Cancel':'Edit'}</button>
      </div>
      {showEdit?(
        <>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10 }}>
            {fields.map(f=>(
              <div key={f.key}>
                <FieldLabel>{f.label}</FieldLabel>
                <input style={{ ...inp,marginBottom:0,fontSize:13 }} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.label}/>
              </div>
            ))}
          </div>
          <div style={{ display:'flex',justifyContent:'flex-end',gap:8,paddingTop:10,borderTop:`0.5px solid ${C.borderLight}` }}>
            <Btn label="Save details" small onClick={()=>onSave(form)}/>
          </div>
        </>
      ):hasData?(
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px 16px' }}>
          {fields.filter(f=>form[f.key]).map(f=>(
            <div key={f.key} style={{ fontFamily:FONT }}>
              <div style={{ fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.light,marginBottom:1 }}>{f.label}</div>
              <div style={{ fontSize:13,fontWeight:500,color:C.black }}>{form[f.key]}</div>
            </div>
          ))}
        </div>
      ):(
        <div style={{ fontSize:12,color:C.light,fontFamily:FONT }}>No account details yet — click Edit to add.</div>
      )}
    </div>
  )
}

function MainApp() {
  const [tab,setTab]               = useState('overview')
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768
  const [engs,setEngs]             = useState([])
  const [instData,setInstData]     = useState({}) // keyed by name
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
  const [stakesOpen,setStakesOpen]       = useState(false)
  const [engsOpen,setEngsOpen]           = useState(true)
  const [showInstForm,setShowInstForm]   = useState(false)
  const [showInstEdit,setShowInstEdit]   = useState(false)
  const [editingInstName,setEditingInstName] = useState(false)
  const [newInstNameVal,setNewInstNameVal]   = useState('')
  const [dragSrc,setDragSrc]             = useState(null)
  const [newInstName,setNewInstName]     = useState('')
  const [instSearch,setInstSearch]       = useState('')
  const [stakeSearch,setStakeSearch]     = useState('')
  const [stakeInstF,setStakeInstF]       = useState('')
  const [stakeRoleF,setStakeRoleF]       = useState('')
  const [fType,setFType]   = useState('')
  const [fObj,setFObj]     = useState('')
  const [fStatus,setFStatus] = useState('')
  const [ovSearch,setOvSearch]   = useState('')
  const [showSearch,setShowSearch] = useState(false)

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(''),2800)}

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(()=>{
    async function load(){
      setLoading(true)
      const [{data:eRows},{data:sRows},{data:mRow},{data:iRows}] = await Promise.all([
        supabase.from('engagements').select('*').order('date',{ascending:false}),
        supabase.from('stakeholders').select('*').order('name'),
        supabase.from('et_meta').select('*').eq('id','singleton').single(),
        supabase.from('institutions').select('*'),
      ])
      const e=eRows||[],s=sRows||[]
      setEngs(e);setStakes(s)
      // Restore saved order from et_meta, filling in any missing institutions
      const allInstNames=[...new Set(e.map(x=>x.institution).concat(s.map(x=>x.institution)).filter(Boolean))]
      const savedOrder=mRow?.inst_order||[]
      const merged=[...savedOrder.filter(n=>allInstNames.includes(n)),...allInstNames.filter(n=>!savedOrder.includes(n))]
      setInstOrder(merged)
      // Load institution detail data
      const iMap={};(iRows||[]).forEach(i=>iMap[i.name]=i);setInstData(iMap)
      // Restore saved colour assignments, assign new ones for any missing institutions
      const savedColors=mRow?.inst_colors||{}
      const newColorMap={...savedColors}
      merged.forEach(name=>{ if(!newColorMap[name]) newColorMap[name]=assignColor(name,newColorMap) })
      instColorMap=newColorMap
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
  async function upsertInst(data){
    const existing=instData[data.name]
    const row={...data,updated_at:new Date().toISOString()}
    if(existing?.id) row.id=existing.id
    const{data:saved}=await supabase.from('institutions').upsert(row).select().single()
    if(saved) setInstData(p=>({...p,[data.name]:saved}))
    return saved
  }
  async function deleteInst(name){
    if(!window.confirm(`Delete ${name} and all its stakeholders and engagements?`))return
    const existing=instData[name]
    if(existing?.id) await supabase.from('institutions').delete().eq('id',existing.id)
    // Delete all engagements and stakeholders for this institution
    await supabase.from('engagements').delete().eq('institution',name)
    await supabase.from('stakeholders').delete().eq('institution',name)
    setEngs(p=>p.filter(e=>e.institution!==name))
    setStakes(p=>p.filter(s=>s.institution!==name))
    setInstData(p=>{const n={...p};delete n[name];return n})
    setInstOrder(p=>p.filter(i=>i!==name))
    setSelInst(null)
    showToast(`✓ ${name} deleted`)
  }
  async function renameInst(oldName, newName){
    const trimmed = newName.trim()
    if(!trimmed||trimmed===oldName){setEditingInstName(false);return}
    if(instOrder.includes(trimmed)){showToast('An institution with that name already exists');return}
    // Update all engagements and stakeholders
    await supabase.from('engagements').update({institution:trimmed}).eq('institution',oldName)
    await supabase.from('stakeholders').update({institution:trimmed}).eq('institution',oldName)
    // Update institution details record if exists
    const existing=instData[oldName]
    if(existing?.id) await supabase.from('institutions').update({name:trimmed}).eq('id',existing.id)
    // Update colour map
    if(instColorMap[oldName]){instColorMap[trimmed]=instColorMap[oldName];delete instColorMap[oldName]}
    // Update local state
    setEngs(p=>p.map(e=>e.institution===oldName?{...e,institution:trimmed}:e))
    setStakes(p=>p.map(s=>s.institution===oldName?{...s,institution:trimmed}:s))
    setInstData(p=>{const n={...p};if(n[oldName]){n[trimmed]={...n[oldName],name:trimmed};delete n[oldName]}return n})
    setInstOrder(p=>p.map(i=>i===oldName?trimmed:i))
    setSelInst(trimmed)
    setEditingInstName(false)
    showToast(`✓ Renamed to ${trimmed}`)
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
    // Fetch fresh data from Supabase to ensure we have all fields
    const { data: freshEng } = await supabase.from('engagements').select('*').eq('id', eng.id).single()
    const e = freshEng || eng
    console.log('Sending to SharePoint:', JSON.stringify(e, null, 2))
    const stake = stakes.find(s=>s.id===e.stakeholder_id)
    try {
      const res = await fetch('/api/sharepoint-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MANUAL',
          record: {
            id:                   e.id,
            event_title:          e.event_title || '',
            additional_stakeholders: e.additional_stakeholders || '',
            institution:          e.institution,
            stakeholder_name:     e.stakeholder_name,
            contact_email:        stake?.email || '',
            date:                 e.date,
            type:                 e.type,
            objective:            e.objective || '',
            status:               e.status,
            owner:                e.owner || '',
            notes:                e.notes || '',
            act_category:         e.act_category || '',
            eng_vector:           e.eng_vector || '',
            act_format:           e.act_format || '',
            act_type:             e.act_type || '',
            target_audience:      e.target_audience || '',
            act_location:         e.act_location || '',
            travel_needed:        e.travel_needed ?? false,
            travel_justification: e.travel_justification ?? '',
            travel_cost:          e.travel_cost ?? null,
            travel_start:         e.travel_start ?? '',
            travel_end:           e.travel_end ?? '',
          }
        })
      })
      const json = await res.json().catch(()=>({}))
      if(json.ok){
        // Mark engagement as submitted in Supabase
        await supabase.from('engagements').update({sharepoint_submitted:true}).eq('id',e.id)
        setEngs(p=>p.map(x=>x.id===e.id?{...x,sharepoint_submitted:true}:x))
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

  // ── Persist instOrder to Supabase when it changes ───────────────────────────
  const instOrderRef = React.useRef(instOrder)
  React.useEffect(()=>{
    instOrderRef.current=instOrder
    if(!loading&&instOrder.length>0){
      supabase.from('et_meta').upsert({id:'singleton',inst_order:instOrder,inst_colors:{...instColorMap},updated_at:new Date().toISOString()})
    }
  },[instOrder,loading])

  // ── Derived ──────────────────────────────────────────────────────────────────
  const allInsts=[...new Set([...instOrder,...engs.map(e=>e.institution),...stakes.map(s=>s.institution)].filter(Boolean))]
  const allActs=engs.flatMap(e=>((e.actions&&Array.isArray(e.actions)?e.actions:[])).map(a=>({...a,inst:e.institution,stake:e.stakeholder_name,date:e.date,engId:e.id})))
  const openActs=allActs.filter(a=>!a.done).sort((a,b)=>a.date.localeCompare(b.date))

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
    await upsertEng({
      institution:      formData.institution,
      stakeholder_id:   sid,
      stakeholder_name: so?.name||formData.stakeholder_name,
      date:             formData.date,
      type:             formData.type,
      objective:        formData.objective,
      status:           formData.status,
      owner:            formData.owner,
      event_title:              formData.event_title||'',
      additional_stakeholders:  formData.additional_stakeholders||'',
      notes:            formData.notes,
      actions:          formData.actions,
      act_category:     formData.act_category||'',
      eng_vector:       formData.eng_vector||'',
      act_format:       formData.act_format||'',
      act_type:         formData.act_type||'',
      target_audience:  formData.target_audience||'',
      act_location:     formData.act_location||'',
      sharepoint_submitted: formData.sharepoint_submitted??false,
      travel_needed:    formData.travel_needed??false,
      travel_justification: formData.travel_justification||'',
      travel_cost:      formData.travel_cost||null,
      travel_start:     formData.travel_start||null,
      travel_end:       formData.travel_end||null,
    },editEngId||undefined)
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
    const eng=engs.find(e=>e.id===engId)
    const closedActions=(eng?.actions||[]).map(a=>({...a,done:true}))
    await supabase.from('engagements').update({status:'Closed',actions:closedActions}).eq('id',engId)
    setEngs(p=>p.map(e=>e.id===engId?{...e,status:'Closed',actions:closedActions}:e))
    showToast('✓ Engagement closed')
  }
  async function addInstitution(){
    const name=newInstName.trim()
    if(!name)return
    if(allInsts.includes(name)){showToast('Already exists');return}
    // Assign a colour for the new institution
    const newColor = assignColor(name, instColorMap)
    instColorMap = {...instColorMap, [name]: newColor}
    // Save placeholder stakeholder so institution persists
    await upsertStake({name:'(Add stakeholder)',role:'',institution:name,email:'',notes:'placeholder'})
    // Persist updated colour map
    await supabase.from('et_meta').upsert({id:'singleton',inst_colors:{...instColorMap},updated_at:new Date().toISOString()})
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
  function selectInst(name){setSelInst(name);setShowEngForm(false);setShowStakeForm(false);setStakesOpen(false);setEngsOpen(true)}
  function sortEngs(list){
    return list.slice().sort((a,b)=>{
      const aClosed=a.status==='Closed'?1:0
      const bClosed=b.status==='Closed'?1:0
      if(aClosed!==bClosed)return aClosed-bClosed
      return a.date.localeCompare(b.date)
    })
  }
  const instEngs=selInst?sortEngs(engs.filter(e=>e.institution===selInst)):[]
  const instStakes=selInst?stakes.filter(s=>s.institution===selInst&&s.notes!=='placeholder'):[]
  const instOpenActs=instEngs.flatMap(e=>(e.actions||[]).filter(a=>!a.done).map(a=>({...a,stake:e.stakeholder_name,date:e.date,engId:e.id})))

  return(
    <div style={{ fontFamily:FONT,minHeight:'100vh',background:C.bg }}>
      <style>{`*{box-sizing:border-box}input,select,textarea,button{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;border-radius:0!important}body{margin:0}input:focus,select:focus,textarea:focus{outline:none;border-color:${C.accent}!important}`}</style>
      <div style={{ height:4,background:C.accent,position:'fixed',top:0,left:0,right:0,zIndex:300 }}/>
      <div style={{ background:C.black,borderBottom:`4px solid ${C.accent}`,paddingTop:4,position:'fixed',top:0,left:0,right:0,zIndex:200 }}>
        <div style={{ padding:isMobile?'12px 16px 0':'16px 24px 0' }}>
          <div style={{ fontSize:isMobile?18:24,fontWeight:700,letterSpacing:-0.5,color:C.white,fontFamily:FONT }}>Engagement Tracker — Al</div>
          <div style={{ fontSize:11,fontWeight:300,color:'rgba(255,255,255,0.35)',marginTop:4,paddingBottom:12,fontFamily:FONT }}>
            {engs.length} engagement{engs.length!==1?'s':''}<span style={{ color:C.accent }}> | </span>
            {allInsts.length} institution{allInsts.length!==1?'s':''}<span style={{ color:C.accent }}> | </span>
            {stakes.length} stakeholder{stakes.length!==1?'s':''}
          </div>
          <div style={{ display:'flex',alignItems:'flex-end',width:'100%' }}>
            {[tabs[0],tabs[1],tabs[2]].map((t,i)=><button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'10px 0',marginRight:i<1?32:0,marginLeft:i===2?'auto':0,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:tab===t.id?C.white:C.accent,background:'transparent',border:'none',borderBottom:tab===t.id?`2px solid ${C.accent}`:'2px solid transparent',marginBottom:-1,cursor:'pointer',fontFamily:FONT }}>{t.label}</button>)}
          </div>
        </div>
      </div>

      <div style={{ paddingTop:isMobile?100:112 }}>

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'320px 1fr',height:isMobile?'auto':'calc(100vh - 112px)',overflow:isMobile?'visible':'hidden' }}>
            {/* Left — open actions */}
            <div style={{ borderRight:isMobile?'none':`1px solid ${C.border}`,borderBottom:isMobile?`1px solid ${C.border}`:'none',overflowY:'auto',background:C.white,maxHeight:isMobile?300:'none' }}>
              <div style={{ padding:'14px 16px',borderBottom:`1px solid ${C.borderLight}`,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:C.white,zIndex:10 }}>
                <div style={{ fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:C.accent,fontFamily:FONT }}>Open actions</div>
                <div style={{ fontSize:11,fontWeight:700,color:C.red }}>{openActs.length} pending</div>
              </div>
              {openActs.length?openActs.map((a,i)=>(
                <div key={i} style={{ padding:'12px 16px',borderBottom:`0.5px solid ${C.borderLight}` }}>
                  <div style={{ display:'flex',alignItems:'flex-start',gap:8 }}>
                    <div style={{ width:7,height:7,borderRadius:'50%',background:PRI_C[a.priority]||C.amber,marginTop:5,flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex',alignItems:'baseline',gap:0,flexWrap:'wrap',fontFamily:FONT }}>
                        <span style={{ fontSize:13,fontWeight:600,color:C.black }}>{fmtDate(a.date)}</span>
                        <span style={{ color:C.accent,fontSize:13,fontWeight:300,margin:'0 6px' }}>|</span>
                        <span style={{ fontSize:13,fontWeight:600,color:C.black }}>{a.text}</span>
                      </div>
                      <div style={{ fontSize:11,color:C.light,marginTop:2,fontFamily:FONT }}>{a.inst}<span style={{ color:C.accent }}> · </span>{a.stake}</div>
                    </div>
                    <Tag color={PRI_C[a.priority]||C.amber}>{a.priority}</Tag>
                  </div>
                  <button onClick={()=>toggleAction(a.engId,a.id)} style={{ marginTop:6,marginLeft:15,background:'transparent',border:`1px solid ${C.border}`,padding:'3px 9px',fontSize:11,fontWeight:700,letterSpacing:'0.5px',textTransform:'uppercase',cursor:'pointer',fontFamily:FONT,color:C.mid }}>Mark done</button>
                </div>
              )):<div style={{ textAlign:'center',padding:'40px 20px',color:C.light,fontSize:13,fontFamily:FONT }}>No open actions</div>}
            </div>
            {/* Right — stats + recent */}
            <div style={{ overflowY:'auto',padding:isMobile?'16px':'20px 24px' }}>
              <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:1,background:C.border,border:`0.5px solid ${C.border}`,marginBottom:20 }}>
                {[{v:engs.length,l:'Engagements',c:C.accent},{v:allInsts.length,l:'Institutions'},{v:openActs.length,l:'Open actions',c:C.red},{v:engs.filter(e=>e.status==='Closed').length,l:'Completed'}].map(({v,l,c})=>(
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
              <div style={{ marginBottom:10 }}>
                <button onClick={()=>setShowSearch(v=>!v)} style={{ display:'flex',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer',fontFamily:FONT,padding:0,marginBottom:showSearch?10:0 }}>
                  <span style={{ fontSize:10,fontWeight:700,color:C.accent,letterSpacing:2,textTransform:'uppercase' }}>Search & filter</span>
                  <span style={{ fontSize:12,color:C.light }}>{showSearch?'▲':'▼'}</span>
                </button>
                {showSearch&&<div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                  <input style={{ ...inp,flex:1,minWidth:120,marginBottom:0,fontSize:13 }} placeholder="Search…" value={ovSearch} onChange={e=>setOvSearch(e.target.value)}/>
                  <select style={{ ...sel,minWidth:120,marginBottom:0,fontSize:13 }} value={fType} onChange={e=>setFType(e.target.value)}><option value="">All types</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
                  <select style={{ ...sel,minWidth:140,marginBottom:0,fontSize:13 }} value={fObj} onChange={e=>setFObj(e.target.value)}><option value="">All objectives</option>{OBJECTIVES.map(o=><option key={o}>{o}</option>)}</select>
                  <select style={{ ...sel,minWidth:140,marginBottom:0,fontSize:13 }} value={fStatus} onChange={e=>setFStatus(e.target.value)}><option value="">All statuses</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
                </div>}
              </div>
              {sortEngs(engs.filter(e=>{
                if(fType&&e.type!==fType)return false
                if(fObj&&e.objective!==fObj)return false
                if(fStatus&&e.status!==fStatus)return false
                if(ovSearch&&![e.institution,e.stakeholder_name,e.notes,e.owner,e.objective,e.event_title||'',e.additional_stakeholders||''].join(' ').toLowerCase().includes(ovSearch.toLowerCase()))return false
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
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'320px 1fr',height:isMobile?'auto':'calc(100vh - 112px)',overflow:isMobile?'visible':'hidden' }}>
            {/* Left list */}
            <div style={{ borderRight:isMobile?'none':`1px solid ${C.border}`,borderBottom:isMobile?`1px solid ${C.border}`:'none',overflowY:'auto',background:C.white,maxHeight:isMobile?280:'none' }}>
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
                  style={{ padding:'14px 16px',borderBottom:`0.5px solid ${C.borderLight}`,cursor:'grab',position:'relative',background:selInst===name?'#E6F1FB':C.white,borderLeft:`3px solid ${selInst===name?instColor(name):'transparent'}`,opacity:isDragging?0.4:1,transition:'opacity 0.15s' }}
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
            <div style={{ overflowY:isMobile?'visible':'auto',background:C.bg }}>
              {!selInst?(
                <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:C.light,fontSize:14,fontWeight:300,gap:8,fontFamily:FONT }}>
                  <div style={{ fontSize:40,color:'#ddd' }}>⌗</div>
                  <div>Select an institution</div>
                </div>
              ):(
                <>
                  <div style={{ background:C.white,borderBottom:`1px solid ${C.border}`,padding:'20px 24px',position:'sticky',top:0,zIndex:10 }}>
                    <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12 }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        {editingInstName
                          ? <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                              <input
                                style={{ ...inp,fontSize:20,fontWeight:700,marginBottom:0,flex:1 }}
                                value={newInstNameVal}
                                onChange={e=>setNewInstNameVal(e.target.value)}
                                onKeyDown={e=>{if(e.key==='Enter')renameInst(selInst,newInstNameVal);if(e.key==='Escape')setEditingInstName(false)}}
                                autoFocus
                              />
                              <Btn label="Save" small onClick={()=>renameInst(selInst,newInstNameVal)}/>
                              <Btn label="Cancel" small ghost onClick={()=>setEditingInstName(false)}/>
                            </div>
                          : <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:4 }}>
                              <div style={{ fontSize:24,fontWeight:700,color:C.black,fontFamily:FONT }}>{selInst}</div>
                              <button onClick={()=>{setNewInstNameVal(selInst);setEditingInstName(true)}} style={{ background:'none',border:'none',fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.accent,cursor:'pointer',fontFamily:FONT,padding:0 }}>Rename</button>
                            </div>
                        }
                        <div style={{ fontSize:12,fontWeight:300,color:C.light,fontFamily:FONT }}>
                          {instEngs.length} engagement{instEngs.length!==1?'s':''}<SEP/>
                          {instStakes.length} stakeholder{instStakes.length!==1?'s':''}<SEP/>
                          <span style={{ color:instOpenActs.length?C.red:C.green,fontWeight:instOpenActs.length?700:300 }}>{instOpenActs.length} open action{instOpenActs.length!==1?'s':''}</span>
                        </div>
                      </div>
                      <button onClick={()=>deleteInst(selInst)} style={{ background:'none',border:`1px solid ${C.border}`,padding:'5px 10px',fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:C.light,cursor:'pointer',fontFamily:FONT,flexShrink:0,marginTop:4 }}>Delete institution</button>
                    </div>
                    <div style={{ display:'flex',gap:8,marginTop:14 }}>
                      <Btn label="+ Engagement" small accent onClick={()=>{setShowEngForm(v=>!v);setShowStakeForm(false)}}/>
                      <Btn label="+ Stakeholder" small ghost onClick={()=>{setShowStakeForm(v=>!v);setShowEngForm(false)}}/>
                    </div>
                  </div>
                  <div style={{ padding:'20px 24px' }}>
                    {/* Institution profile */}
                    <InstProfile
                      name={selInst}
                      data={instData[selInst]||{}}
                      showEdit={showInstEdit}
                      onToggleEdit={()=>setShowInstEdit(v=>!v)}
                      onSave={async(d)=>{await upsertInst({...d,name:selInst});setShowInstEdit(false);showToast('✓ Institution details saved')}}
                    />
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
                          <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:8,padding:'6px 0',borderBottom:`0.5px solid ${C.borderLight}`,fontFamily:FONT }}>
                            <div style={{ width:7,height:7,borderRadius:'50%',background:PRI_C[a.priority]||C.amber,marginTop:5,flexShrink:0 }}/>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex',alignItems:'baseline',gap:0,flexWrap:'wrap' }}>
                                <span style={{ fontSize:13,fontWeight:700,color:C.black }}>{fmtDate(a.date)}</span>
                                <span style={{ color:C.accent,fontSize:13,fontWeight:300,margin:'0 6px' }}>|</span>
                                <span style={{ fontSize:13,fontWeight:700,color:C.black }}>{a.text}</span>
                              </div>
                              <div style={{ fontSize:11,color:C.light,marginTop:2 }}>{a.stake}</div>
                            </div>
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
          <div style={{ padding:isMobile?'16px':'20px 24px',maxWidth:960 }}>
            <div style={{ display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center' }}>
              <input style={{ ...inp,flex:1,marginBottom:0,fontSize:13 }} placeholder="Search stakeholders…" value={stakeSearch} onChange={e=>setStakeSearch(e.target.value)}/>
              <select style={{ ...sel,minWidth:180,marginBottom:0,fontSize:13 }} value={stakeInstF} onChange={e=>setStakeInstF(e.target.value)}><option value="">All institutions</option>{allInsts.map(n=><option key={n}>{n}</option>)}</select>
              <select style={{ ...sel,minWidth:160,marginBottom:0,fontSize:13 }} value={stakeRoleF} onChange={e=>setStakeRoleF(e.target.value)}><option value="">All roles</option>{ROLES.map(r=><option key={r}>{r}</option>)}</select>
              <Btn label="+ Add stakeholder" small onClick={()=>{setEditStakeId(null);setStakeModal({})}}/>
              <Btn label="Merge duplicates" small ghost onClick={mergeDuplicates}/>
            </div>
            {stakes.filter(s=>{
              if(s.notes==='placeholder')return false
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
        const base={'Event Title':e.event_title||'',Institution:e.institution,Stakeholder:e.stakeholder_name,'Additional Stakeholders':e.additional_stakeholders||'',Role:s?.role||'',Date:e.date,Type:e.type,Objective:e.objective||'','Activity Category':e.act_category||'','Engagement Vector':e.eng_vector||'','Activity Format':e.act_format||'','Activity Type':e.act_type||'','Target Audience':e.target_audience||'','Activity Location':e.act_location||'',Status:e.status,Owner:e.owner||'','Travel Needed':e.travel_needed?'Yes':'No','Travel Justification':e.travel_justification||'','Travel Cost':e.travel_cost||'','Travel Start':e.travel_start||'','Travel End':e.travel_end||'',Notes:e.notes||'',Source:e.synced_email_id?'Email sync':'Manual'}
        const acts=e.actions||[]
        if(!acts.length)rows.push({...base,'Action/Next step':'',Priority:'','Action status':''})
        else acts.forEach((a,i)=>rows.push({...(i===0?base:Object.fromEntries(Object.keys(base).map(k=>[k,'']))),'Action/Next step':a.text,Priority:a.priority,'Action status':a.done?'Complete':'Open'}))
      })
      const ws=XLSX.utils.json_to_sheet(rows)
      ws['!cols']=[28,22,22,24,20,12,12,28,32,20,20,16,16,16,12,16,24,10,12,12,40,10,32,10,12].map(w=>({wch:w}))
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

export default function App() {
  const [unlocked,setUnlocked] = useState(()=>sessionStorage.getItem('et_unlocked')==='1')
  if(!unlocked) return <PinScreen onUnlock={()=>setUnlocked(true)}/>
  return <MainApp/>
}
