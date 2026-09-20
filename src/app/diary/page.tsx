'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Plus, X, Camera, Sparkles, Loader2, Check, Trash2, AlertCircle, RefreshCw } from 'lucide-react'

interface FoodItem { name: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fat: number }
interface SuggestionOption { id: number; name: string; emoji: string; items: FoodItem[]; totals: { calories: number; protein: number; carbs: number; fat: number }; prepTime: number; tags: string[]; tip: string }
interface LogEntry { id: string; foodName: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fat: number; mealType: string; isEstimated?: boolean }

const MEAL_TYPES = [
  { key: 'breakfast', label: 'בוקר', emoji: '☀️' },
  { key: 'morning_snack', label: 'נשנוש בוקר', emoji: '🍎' },
  { key: 'lunch', label: 'צהריים', emoji: '🥗' },
  { key: 'afternoon_snack', label: 'נשנוש אחה"צ', emoji: '🌰' },
  { key: 'dinner', label: 'ערב', emoji: '🌙' },
]
const MEAL_LABELS: Record<string,string> = { breakfast: 'בוקר', morning_snack: 'נשנוש בוקר', lunch: 'צהריים', afternoon_snack: 'נשנוש אחה"צ', dinner: 'ערב' }

export default function DiaryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [date, setDate] = useState(new Date())
  const [logs, setLogs] = useState<Record<string,LogEntry[]>>({})
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState({ dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65 })

  const [modal, setModal] = useState<null|'add'|'suggest'|'photo'>(null)
  const [activeMealType, setActiveMealType] = useState('breakfast')

  const [textInput, setTextInput] = useState('')
  const [textLoading, setTextLoading] = useState(false)
  const [textResult, setTextResult] = useState<any>(null)
  const [textError, setTextError] = useState('')

  const [suggestions, setSuggestions] = useState<SuggestionOption[]>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionOption|null>(null)
  const [swapMode, setSwapMode] = useState<{item: FoodItem, meal: SuggestionOption}|null>(null)
  const [swapResults, setSwapResults] = useState<any[]>([])
  const [swapLoading, setSwapLoading] = useState(false)

  const [photoPreview, setPhotoPreview] = useState<string|null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoResult, setPhotoResult] = useState<any>(null)
  const [photoTargetMeal, setPhotoTargetMeal] = useState<string>('lunch')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)

  const dateStr = date.toISOString().split('T')[0]

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (session) { fetchLogs(); fetchGoals() }
  }, [session, status, date])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/diary?date=' + dateStr)
      if (res.ok) {
        const d = await res.json()
        const grouped: Record<string,LogEntry[]> = {}
        ;(d.logs || []).forEach((log: any) => {
          const mt = log.mealType || 'breakfast'
          if (!grouped[mt]) grouped[mt] = []
          grouped[mt].push({ id: log.id, foodName: log.food?.name || log.foodName || 'אוכל', quantity: log.quantity || 0, unit: log.unit || 'ג', calories: log.calories || 0, protein: log.protein || 0, carbs: log.carbs || 0, fat: log.fat || 0, mealType: mt, isEstimated: !!(log.notes?.includes('AI')) })
        })
        setLogs(grouped)
      }
    } finally { setLoading(false) }
  }

  const fetchGoals = async () => {
    const res = await fetch('/api/goals')
    if (res.ok) { const d = await res.json(); if (d.goals) setGoals({ dailyCalories: d.goals.dailyCalories||2000, dailyProtein: d.goals.dailyProtein||150, dailyCarbs: d.goals.dailyCarbs||200, dailyFat: d.goals.dailyFat||65 }) }
  }

  const navigate = (n: number) => { const nd = new Date(date); nd.setDate(nd.getDate()+n); setDate(nd) }
  const isToday = date.toDateString() === new Date().toDateString()

  const allEntries = Object.values(logs).flat()
  const totalCals = Math.round(allEntries.reduce((s,e)=>s+e.calories,0))
  const totalProtein = Math.round(allEntries.reduce((s,e)=>s+e.protein,0))
  const totalCarbs = Math.round(allEntries.reduce((s,e)=>s+e.carbs,0))
  const totalFat = Math.round(allEntries.reduce((s,e)=>s+e.fat,0))

  const fetchSuggestions = async (mealType: string) => {
    setSuggestLoading(true); setSuggestions([]); setSelectedSuggestion(null); setSwapMode(null); setSwapResults([])
    try {
      const res = await fetch('/api/ai/meal-suggestions', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ mealType }) })
      const d = await res.json()
      if (d.suggestions) setSuggestions(d.suggestions)
      else setTextError(d.error || 'שגיאה')
    } catch { setTextError('שגיאה בחיבור') }
    finally { setSuggestLoading(false) }
  }

  const fetchSwap = async (item: FoodItem, meal: SuggestionOption) => {
    setSwapMode({ item, meal }); setSwapLoading(true); setSwapResults([])
    try {
      const res = await fetch('/api/ai/meal-suggestions', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ mealType: activeMealType, swapItem: item.name, currentMeal: meal.name }) })
      const d = await res.json()
      if (d.suggestions) setSwapResults(d.suggestions)
    } catch {}
    finally { setSwapLoading(false) }
  }

  const analyzeText = async () => {
    if (!textInput.trim()) return
    setTextLoading(true); setTextError(''); setTextResult(null)
    try {
      const res = await fetch('/api/ai/analyze-text', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text: textInput }) })
      const d = await res.json()
      if (d.items) setTextResult(d)
      else setTextError(d.error || 'שגיאה בניתוח')
    } catch { setTextError('שגיאה בחיבור') }
    finally { setTextLoading(false) }
  }

  const analyzePhoto = async (file: File) => {
    setPhotoLoading(true); setPhotoResult(null)
    const formData = new FormData(); formData.append('image', file)
    try {
      const res = await fetch('/api/ai/analyze-meal', { method: 'POST', body: formData })
      const d = await res.json()
      if (d.items && d.items.length > 0) setPhotoResult(d)
      else setTextError(d.error || 'לא נזהו פריטי ארוחה בתמונה - נסי תמונה ברורה יותר')
    } catch { setTextError('שגיאה בחיבור') }
    finally { setPhotoLoading(false) }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setPhotoPreview(URL.createObjectURL(file)); analyzePhoto(file)
  }

  const saveItems = async (items: FoodItem[], mealType?: string) => {
    setSaving(true)
    try {
      for (const item of items) {
        await fetch('/api/diary/log', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ date: dateStr, mealType: mealType||activeMealType, foodName: item.name, quantity: item.quantity||100, unit: item.unit||'גרם', calories: Math.round(item.calories||0), protein: Math.round(item.protein||0), carbs: Math.round(item.carbs||0), fat: Math.round(item.fat||0), isEstimate: true }) })
      }
      await fetchLogs(); closeModal()
    } finally { setSaving(false) }
  }

  const deleteEntry = async (id: string) => { await fetch('/api/diary/log?id='+id, {method:'DELETE'}); fetchLogs() }

  const openModal = (type: 'add'|'suggest'|'photo', mealType: string) => {
    setActiveMealType(mealType); setModal(type); setTextInput(''); setTextResult(null); setTextError('')
    setPhotoPreview(null); setPhotoResult(null); setSuggestions([]); setSelectedSuggestion(null); setSwapMode(null)
    if (type === 'suggest') fetchSuggestions(mealType)
    if (type === 'photo') setPhotoTargetMeal(mealType)
  }
  const closeModal = () => setModal(null)

  if (status === 'loading' || loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'16rem'}}><Loader2 size={32} style={{color:'var(--primary)',animation:'spin 1s linear infinite'}}/></div>

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1rem',paddingBottom:'2rem'}}>

      {/* Date Nav */}
      <div className="card" style={{padding:'0.75rem 1rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button onClick={()=>navigate(-1)} style={{width:'2.25rem',height:'2.25rem',borderRadius:'10px',background:'var(--primary-light)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ChevronRight size={20} style={{color:'var(--primary)'}}/></button>
        <div style={{textAlign:'center'}}>
          <p style={{fontWeight:700,color:'var(--text-main)',margin:0,fontSize:'1rem'}}>{isToday ? 'היום' : date.toLocaleDateString('he-IL',{weekday:'long'})}</p>
          <p style={{fontSize:'0.8125rem',color:'var(--text-sub)',margin:0}}>{date.toLocaleDateString('he-IL',{day:'numeric',month:'long',year:'numeric'})}</p>
        </div>
        <button onClick={()=>navigate(1)} style={{width:'2.25rem',height:'2.25rem',borderRadius:'10px',background:'var(--primary-light)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ChevronLeft size={20} style={{color:'var(--primary)'}}/></button>
      </div>

      {/* Summary */}
      <div className="card" style={{padding:'1.125rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.875rem'}}>
          <span style={{fontWeight:700,fontSize:'0.9375rem',color:'var(--text-main)'}}>סיכום יומי</span>
          <span style={{fontSize:'0.875rem',fontWeight:700,color:totalCals>goals.dailyCalories?'var(--coral)':'var(--lime)',background:totalCals>goals.dailyCalories?'var(--coral-light)':'#F0FAD6',padding:'0.25rem 0.75rem',borderRadius:'20px'}}>{Math.max(0,goals.dailyCalories-totalCals)} קק"ל נותרו</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.5rem'}}>
          {[{label:'קלוריות',value:totalCals,target:goals.dailyCalories,color:'var(--primary)'},{label:'חלבון',value:totalProtein,target:goals.dailyProtein,color:'#3B82F6'},{label:'פחמימות',value:totalCarbs,target:goals.dailyCarbs,color:'var(--orange)'},{label:'שומן',value:totalFat,target:goals.dailyFat,color:'var(--teal)'}].map(({label,value,target,color})=>(
            <div key={label} style={{textAlign:'center',background:'#F8F7FF',borderRadius:'12px',padding:'0.625rem 0.375rem'}}>
              <p style={{fontSize:'1.125rem',fontWeight:900,color,margin:0,lineHeight:1}}>{value}</p>
              <p style={{fontSize:'0.6rem',color:'var(--text-sub)',margin:'0.2rem 0 0'}}>{label}</p>
              <div style={{height:'3px',background:'#EDE9FE',borderRadius:'100px',marginTop:'0.375rem',overflow:'hidden'}}><div style={{height:'100%',background:color,width:Math.min(100,(value/target)*100)+'%',borderRadius:'100px'}}/></div>
            </div>
          ))}
        </div>
      </div>

      {/* Photo strip */}
      <div style={{background:'linear-gradient(135deg,#EDE9FE,#F0FAD6)',borderRadius:'18px',padding:'1rem 1.25rem',display:'flex',alignItems:'center',gap:'1rem',cursor:'pointer'}} onClick={()=>openModal('photo','lunch')}>
        <div style={{width:'3rem',height:'3rem',background:'var(--primary)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.375rem',flexShrink:0}}>📸</div>
        <div style={{flex:1}}>
          <p style={{fontWeight:800,color:'var(--primary)',margin:'0 0 0.25rem',fontSize:'0.9375rem'}}>צלמי ארוחה לניתוח AI</p>
          <p style={{fontSize:'0.8125rem',color:'var(--text-sub)',margin:0}}>צלקפי, תנתח ורשמי ביומן</p>
        </div>
        <ChevronLeft size={20} style={{color:'var(--primary)'}}/>
      </div>

      {/* Meal sections */}
      {MEAL_TYPES.map(({key,label,emoji})=>{
        const entries = logs[key]||[]
        const mealCals = Math.round(entries.reduce((s,e)=>s+e.calories,0))
        return (
          <div key={key} className="card" style={{padding:'1rem'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:entries.length>0?'0.75rem':0}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <span style={{fontSize:'1.25rem'}}>{emoji}</span>
                <span style={{fontWeight:700,fontSize:'0.9375rem',color:'var(--text-main)'}}>{label}</span>
                {mealCals>0&&<span style={{fontSize:'0.75rem',color:'var(--text-sub)',background:'#F0EEF9',padding:'0.125rem 0.5rem',borderRadius:'20px'}}>{mealCals} קק"ל</span>}
              </div>
              <div style={{display:'flex',gap:'0.375rem'}}>
                <button onClick={()=>openModal('suggest',key)} style={{background:'#F0FAD6',border:'none',borderRadius:'10px',padding:'0.375rem 0.625rem',cursor:'pointer',color:'#3D6B00',fontWeight:700,fontSize:'0.75rem',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'0.25rem'}}><Sparkles size={12}/>AI</button>
                <button onClick={()=>openModal('add',key)} style={{background:'var(--primary-light)',border:'none',borderRadius:'10px',padding:'0.375rem 0.625rem',cursor:'pointer',color:'var(--primary)',fontWeight:700,fontSize:'0.75rem',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'0.25rem'}}><Plus size={12}/>הוסיפי</button>
              </div>
            </div>
            {entries.length===0&&<p style={{fontSize:'0.8125rem',color:'var(--text-sub)',margin:0,textAlign:'center',padding:'0.375rem 0'}}>לא נרשם עדיין</p>}
            {entries.map((entry,i)=>(
              <div key={entry.id||i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.5rem 0',borderTop:'1px solid #F0EEF9'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
                    <span style={{fontSize:'0.875rem',fontWeight:600,color:'var(--text-main)'}}>{entry.foodName}</span>
                    {entry.isEstimated&&<span style={{fontSize:'0.625rem',color:'var(--orange)',background:'#FFF3E0',padding:'0.125rem 0.375rem',borderRadius:'8px'}}>~אימוד</span>}
                  </div>
                  <span style={{fontSize:'0.75rem',color:'var(--text-sub)'}}>{entry.quantity}{entry.unit} · {entry.calories} קק"ל · חלב {entry.protein}ג</span>
                </div>
                <button onClick={()=>deleteEntry(entry.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#D1C7E8',padding:'0.25rem'}}><Trash2 size={15}/></button>
              </div>
            ))}
          </div>
        )
      })}

      <div style={{display:'flex',alignItems:'flex-start',gap:'0.5rem',background:'#FFFBEB',border:'1.5px solid #FDE68A',borderRadius:'14px',padding:'0.875rem'}}>
        <AlertCircle size={15} style={{color:'#D97706',flexShrink:0,marginTop:'0.125rem'}}/>
        <p style={{fontSize:'0.75rem',color:'#92400E',margin:0,lineHeight:1.5}}>ערכי תזונה מנותחי AI הם אימודים. המערכת אינה מחליפה ייעוץ תזונאי מקצועי.</p>
      </div>

      {/* ======== MODAL ======== */}
      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{background:'white',borderRadius:'24px 24px 0 0',width:'100%',maxWidth:'480px',maxHeight:'92vh',overflowY:'auto',padding:'1.5rem 1.25rem 2rem'}}>

            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
              <div>
                <h3 style={{fontWeight:800,fontSize:'1.125rem',color:'var(--text-main)',margin:0}}>
                  {modal==='suggest'?'המלצות AI לארוחה':modal==='photo'?'ניתוח תמונה':'הוסיפי ארוחה'}
                </h3>
                <p style={{fontSize:'0.8125rem',color:'var(--text-sub)',margin:0}}>{MEAL_LABELS[activeMealType]}</p>
              </div>
              <button onClick={closeModal} style={{background:'#F0EEF9',border:'none',borderRadius:'10px',width:'2rem',height:'2rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={16} style={{color:'var(--primary)'}}/></button>
            </div>

            {/* Meal pills */}
            <div style={{display:'flex',gap:'0.5rem',overflowX:'auto',paddingBottom:'0.75rem',marginBottom:'1rem'}}>
              {MEAL_TYPES.map(({key,label,emoji})=>(
                <button key={key} onClick={()=>{setActiveMealType(key);if(modal==='suggest')fetchSuggestions(key)}}
                  style={{display:'flex',alignItems:'center',gap:'0.375rem',padding:'0.375rem 0.875rem',borderRadius:'20px',border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:600,fontSize:'0.8125rem',whiteSpace:'nowrap',flexShrink:0,background:activeMealType===key?'var(--primary)':'var(--primary-light)',color:activeMealType===key?'white':'var(--primary)'}}>
                  {emoji} {label}
                </button>
              ))}
            </div>

            {textError&&<div style={{marginBottom:'0.75rem',background:'#FFF0F2',border:'1.5px solid #FFD0D8',borderRadius:'12px',padding:'0.75rem',fontSize:'0.875rem',color:'#C0002A'}}>{textError}</div>}

            {/* SUGGEST MODE */}
            {modal==='suggest'&&(
              <div>
                {suggestLoading&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.75rem',padding:'2rem 0',color:'var(--primary)'}}><Loader2 size={28} style={{animation:'spin 1s linear infinite'}}/><span style={{fontWeight:600}}>ה-AI בונה המלצות...</span></div>}

                {!suggestLoading&&!selectedSuggestion&&!swapMode&&suggestions.map((s,i)=>(
                  <div key={i} onClick={()=>setSelectedSuggestion(s)}
                    style={{border:'2px solid #EDE9FE',borderRadius:'16px',padding:'0.875rem',marginBottom:'0.625rem',cursor:'pointer'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                        <span style={{fontSize:'1.25rem'}}>{s.emoji}</span>
                        <span style={{fontWeight:700,fontSize:'0.9rem',color:'var(--text-main)'}}>{s.name}</span>
                      </div>
                      <span style={{fontWeight:700,color:'var(--primary)',fontSize:'0.875rem'}}>{s.totals?.calories} קק"ל</span>
                    </div>
                    <div style={{display:'flex',gap:'0.625rem',marginTop:'0.5rem',flexWrap:'wrap'}}>
                      {s.tags?.map((t,ti)=><span key={ti} style={{fontSize:'0.6875rem',background:'#F0FAD6',color:'#3D6B00',padding:'0.125rem 0.5rem',borderRadius:'8px'}}>{t}</span>)}
                    </div>
                    <div style={{display:'flex',gap:'0.75rem',marginTop:'0.375rem',fontSize:'0.75rem',color:'var(--text-sub)'}}>
                      <span>חלב {s.totals?.protein}ג</span>
                      <span>פחמ {s.totals?.carbs}ג</span>
                      <span>שומ {s.totals?.fat}ג</span>
                      <span>⏱ {s.prepTime} דק'</span>
                    </div>
                  </div>
                ))}

                {!suggestLoading&&suggestions.length>0&&!selectedSuggestion&&(
                  <button onClick={()=>fetchSuggestions(activeMealType)} style={{width:'100%',padding:'0.75rem',borderRadius:'14px',border:'2px dashed #EDE9FE',background:'white',color:'var(--primary)',fontFamily:'inherit',fontWeight:600,fontSize:'0.875rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
                    <RefreshCw size={14}/> רענן המלצות
                  </button>
                )}

                {selectedSuggestion&&!swapMode&&(
                  <div>
                    <button onClick={()=>setSelectedSuggestion(null)} style={{background:'none',border:'none',color:'var(--text-sub)',fontSize:'0.8125rem',cursor:'pointer',fontFamily:'inherit',marginBottom:'0.75rem'}}>← חזרי להמלצות</button>
                    <div style={{background:'linear-gradient(135deg,var(--primary-light),#F0FAD6)',borderRadius:'16px',padding:'1rem',marginBottom:'0.75rem'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.75rem'}}>
                        <span style={{fontSize:'1.5rem'}}>{selectedSuggestion.emoji}</span>
                        <span style={{fontWeight:800,fontSize:'1rem',color:'var(--text-main)'}}>{selectedSuggestion.name}</span>
                      </div>
                      {selectedSuggestion.items?.map((item,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.4rem 0',borderTop:i>0?'1px solid rgba(108,76,241,0.1)':'none'}}>
                          <span style={{fontSize:'0.875rem',color:'var(--text-main)',flex:1}}>{item.name} ({item.quantity}{item.unit})</span>
                          <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                            <span style={{fontSize:'0.75rem',color:'var(--text-sub)'}}>{item.calories} קק"ל</span>
                            <button onClick={()=>fetchSwap(item,selectedSuggestion)} style={{background:'var(--coral-light)',border:'none',borderRadius:'8px',padding:'0.25rem 0.5rem',cursor:'pointer',fontSize:'0.7rem',color:'var(--coral)',fontWeight:700,fontFamily:'inherit'}}>החלף</button>
                          </div>
                        </div>
                      ))}
                      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.5rem',marginTop:'0.75rem',textAlign:'center'}}>
                        {[{l:'קלוריות',v:selectedSuggestion.totals?.calories,c:'var(--primary)'},{l:'חלבון',v:selectedSuggestion.totals?.protein+'ג',c:'#3B82F6'},{l:'פחמימות',v:selectedSuggestion.totals?.carbs+'ג',c:'var(--orange)'},{l:'שומן',v:selectedSuggestion.totals?.fat+'ג',c:'var(--teal)'}].map(({l,v,c})=>(
                          <div key={l}><p style={{fontWeight:900,fontSize:'1rem',color:c,margin:0}}>{v}</p><p style={{fontSize:'0.65rem',color:'var(--text-sub)',margin:0}}>{l}</p></div>
                        ))}
                      </div>
                    </div>
                    {selectedSuggestion.tip&&<div style={{background:'#F0FAD6',borderRadius:'12px',padding:'0.75rem',marginBottom:'0.75rem',fontSize:'0.8125rem',color:'#3D6B00'}}>💡 {selectedSuggestion.tip}</div>}
                    <button onClick={()=>saveItems(selectedSuggestion.items)} disabled={saving} style={{width:'100%',padding:'0.9375rem',borderRadius:'14px',border:'none',background:saving?'#D1CAF0':'linear-gradient(135deg,var(--primary),#9747FF)',color:'white',fontFamily:'inherit',fontWeight:700,fontSize:'1rem',cursor:saving?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
                      {saving?<><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/>שומר...</>:<><Check size={16}/>אשרי והוסיפי ליומן</>}
                    </button>
                  </div>
                )}

                {swapMode&&(
                  <div>
                    <button onClick={()=>{setSwapMode(null);setSwapResults([])}} style={{background:'none',border:'none',color:'var(--text-sub)',fontSize:'0.8125rem',cursor:'pointer',fontFamily:'inherit',marginBottom:'0.75rem'}}>← חזרי</button>
                    <p style={{fontWeight:700,color:'var(--text-main)',marginBottom:'0.75rem',fontSize:'0.9rem'}}>חלופות לרכיב: {swapMode.item.name}</p>
                    {swapLoading&&<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',padding:'1.5rem 0',color:'var(--primary)'}}><Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/>מחפש חלופות...</div>}
                    {swapResults.map((alt,i)=>(
                      <div key={i} onClick={()=>{
                        const newItems = selectedSuggestion!.items.map(it=>it.name===swapMode.item.name?{name:alt.name,quantity:alt.quantity||100,unit:alt.unit||'ג',calories:alt.calories||0,protein:alt.protein||0,carbs:alt.carbs||0,fat:alt.fat||0}:it)
                        const newTotals = {calories:newItems.reduce((s,x)=>s+(x.calories||0),0),protein:newItems.reduce((s,x)=>s+(x.protein||0),0),carbs:newItems.reduce((s,x)=>s+(x.carbs||0),0),fat:newItems.reduce((s,x)=>s+(x.fat||0),0)}
                        setSelectedSuggestion({...selectedSuggestion!,items:newItems,totals:newTotals})
                        setSwapMode(null);setSwapResults([])
                      }} style={{border:'2px solid #EDE9FE',borderRadius:'14px',padding:'0.75rem',marginBottom:'0.5rem',cursor:'pointer'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{fontWeight:700,fontSize:'0.875rem',color:'var(--text-main)'}}>{alt.name}</span>
                          <span style={{fontWeight:700,color:'var(--primary)',fontSize:'0.875rem'}}>{alt.calories} קק"ל</span>
                        </div>
                        {alt.reason&&<p style={{fontSize:'0.75rem',color:'var(--text-sub)',margin:'0.25rem 0 0'}}>{alt.reason}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ADD (TEXT) MODE */}
            {modal==='add'&&(
              <div>
                <textarea value={textInput} onChange={e=>setTextInput(e.target.value)}
                  placeholder="לדוגמה: אכלתי שתי חביתות עם גבינה לבנה ולחם מחיטה מלאה"
                  rows={3} style={{width:'100%',boxSizing:'border-box',padding:'0.875rem',borderRadius:'14px',border:'2px solid #EDE9FE',fontFamily:'Heebo,sans-serif',fontSize:'0.9375rem',resize:'none',outline:'none',color:'var(--text-main)',direction:'rtl'}}/>
                <button onClick={analyzeText} disabled={textLoading||!textInput.trim()}
                  style={{width:'100%',marginTop:'0.75rem',padding:'0.875rem',borderRadius:'14px',border:'none',background:textLoading||!textInput.trim()?'#D1CAF0':'var(--primary)',color:'white',fontFamily:'inherit',fontWeight:700,fontSize:'0.9375rem',cursor:textLoading||!textInput.trim()?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
                  {textLoading?<><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/><span>מנתח...</span></>:<><Sparkles size={16}/><span>נתחי עם AI</span></>}
                </button>
                {textResult&&(
                  <div style={{marginTop:'1rem'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.75rem'}}>
                      <Sparkles size={16} style={{color:'var(--primary)'}}/>
                      <span style={{fontWeight:700,color:'var(--text-main)'}}>תוצאות הניתוח</span>
                      <span style={{fontSize:'0.75rem',color:'var(--orange)',background:'#FFF3E0',padding:'0.125rem 0.5rem',borderRadius:'8px'}}>~אימוד</span>
                    </div>
                    {textResult.items?.map((item: any,i: number)=>(
                      <div key={i} style={{background:'#F8F7FF',borderRadius:'12px',padding:'0.75rem',marginBottom:'0.5rem'}}>
                        <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:700,color:'var(--text-main)'}}>{item.name}</span><span style={{fontWeight:700,color:'var(--primary)'}}>{Math.round(item.calories)} קק"ל</span></div>
                        <div style={{display:'flex',gap:'0.75rem',marginTop:'0.375rem',fontSize:'0.75rem',color:'var(--text-sub)'}}>
                          {item.quantity&&<span>{item.quantity}{item.unit||'ג'}</span>}
                          <span>חלב {Math.round(item.protein||0)}ג</span><span>פחמ {Math.round(item.carbs||0)}ג</span><span>שומ {Math.round(item.fat||0)}ג</span>
                        </div>
                      </div>
                    ))}
                    {textResult.healthNotes&&<div style={{background:'#F0FAD6',borderRadius:'12px',padding:'0.75rem',marginBottom:'0.75rem',fontSize:'0.8125rem',color:'#3D6B00'}}>💡 {textResult.healthNotes}</div>}
                    <button onClick={()=>saveItems(textResult.items)} disabled={saving} style={{width:'100%',padding:'0.9375rem',borderRadius:'14px',border:'none',background:saving?'#D1CAF0':'linear-gradient(135deg,var(--primary),#9747FF)',color:'white',fontFamily:'inherit',fontWeight:700,fontSize:'1rem',cursor:saving?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
                      {saving?<><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/>שומר...</>:<><Check size={16}/>אשרי והוסיפי ליומן</>}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PHOTO MODE */}
            {modal==='photo'&&(
              <div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} style={{display:'none'}}/>
                {!photoPreview?(
                  <div onClick={()=>fileInputRef.current?.click()} style={{border:'2px dashed #EDE9FE',borderRadius:'16px',padding:'2.5rem 1rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.75rem',cursor:'pointer',background:'var(--primary-light)'}}>
                    <Camera size={40} style={{color:'var(--primary)'}}/>
                    <p style={{fontWeight:700,color:'var(--primary)',margin:0}}>צלמי או בחרי תמונה</p>
                    <p style={{fontSize:'0.8125rem',color:'var(--text-sub)',margin:0,textAlign:'center'}}>AI ינתח את הארוחה ויחשב ערכים</p>
                  </div>
                ):(
                  <div>
                    <img src={photoPreview} alt="meal" style={{width:'100%',borderRadius:'16px',maxHeight:'200px',objectFit:'cover'}}/>
                    {photoLoading&&<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',marginTop:'0.75rem',color:'var(--primary)',fontWeight:600}}><Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/>מנתח תמונה...</div>}
                    {!photoLoading&&!photoResult&&<button onClick={()=>setPhotoPreview(null)} style={{marginTop:'0.5rem',background:'none',border:'none',color:'var(--text-sub)',fontSize:'0.8125rem',cursor:'pointer',fontFamily:'inherit'}}>בחרי תמונה אחרת</button>}
                  </div>
                )}

                {photoResult&&(
                  <div style={{marginTop:'1rem'}}>
                    {photoResult.mealName&&<p style={{fontWeight:800,color:'var(--primary)',margin:'0 0 0.75rem',fontSize:'1rem'}}>📸 {photoResult.mealName}</p>}
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.75rem'}}>
                      <Sparkles size={16} style={{color:'var(--primary)'}}/>
                      <span style={{fontWeight:700,color:'var(--text-main)'}}>ערכים תזונתיים</span>
                      <span style={{fontSize:'0.75rem',color:'var(--orange)',background:'#FFF3E0',padding:'0.125rem 0.5rem',borderRadius:'8px'}}>~אימוד</span>
                    </div>
                    {photoResult.items?.map((item: any,i: number)=>(
                      <div key={i} style={{background:'#F8F7FF',borderRadius:'12px',padding:'0.75rem',marginBottom:'0.5rem'}}>
                        <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:700,color:'var(--text-main)'}}>{item.name}</span><span style={{fontWeight:700,color:'var(--primary)'}}>{Math.round(item.calories||0)} קק"ל</span></div>
                        <div style={{display:'flex',gap:'0.75rem',marginTop:'0.375rem',fontSize:'0.75rem',color:'var(--text-sub)'}}>
                          {item.quantity&&<span>{item.quantity}{item.unit||'ג'}</span>}
                          <span>חלב {Math.round(item.protein||0)}ג</span><span>פחמ {Math.round(item.carbs||0)}ג</span><span>שומ {Math.round(item.fat||0)}ג</span>
                        </div>
                      </div>
                    ))}
                    {photoResult.totals&&(
                      <div style={{background:'linear-gradient(135deg,var(--primary-light),#F0FAD6)',borderRadius:'14px',padding:'0.875rem',marginBottom:'0.75rem',display:'grid',gridTemplateColumns:'repeat(4,1fr)',textAlign:'center',gap:'0.5rem'}}>
                        {[{l:'קלוריות',v:Math.round(photoResult.totals.calories||0),c:'var(--primary)'},{l:'חלבון',v:Math.round(photoResult.totals.protein||0)+'ג',c:'#3B82F6'},{l:'פחמימות',v:Math.round(photoResult.totals.carbs||0)+'ג',c:'var(--orange)'},{l:'שומן',v:Math.round(photoResult.totals.fat||0)+'ג',c:'var(--teal)'}].map(({l,v,c})=>(
                          <div key={l}><p style={{fontWeight:900,fontSize:'1rem',color:c,margin:0}}>{v}</p><p style={{fontSize:'0.65rem',color:'var(--text-sub)',margin:0}}>{l}</p></div>
                        ))}
                      </div>
                    )}
                    {photoResult.healthNotes&&<div style={{background:'#F0FAD6',borderRadius:'12px',padding:'0.75rem',marginBottom:'0.75rem',fontSize:'0.8125rem',color:'#3D6B00'}}>💡 {photoResult.healthNotes}</div>}
                    <p style={{fontSize:'0.875rem',fontWeight:700,color:'var(--text-main)',marginBottom:'0.5rem'}}>הוסיפי לאיזו ארוחה?</p>
                    <div style={{display:'flex',gap:'0.5rem',overflowX:'auto',marginBottom:'0.875rem'}}>
                      {MEAL_TYPES.map(({key,label,emoji})=>(
                        <button key={key} onClick={()=>setPhotoTargetMeal(key)}
                          style={{display:'flex',alignItems:'center',gap:'0.25rem',padding:'0.375rem 0.75rem',borderRadius:'20px',border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:600,fontSize:'0.75rem',whiteSpace:'nowrap',flexShrink:0,background:photoTargetMeal===key?'var(--primary)':'var(--primary-light)',color:photoTargetMeal===key?'white':'var(--primary)'}}>
                          {emoji} {label}
                        </button>
                      ))}
                    </div>
                    <button onClick={()=>saveItems(photoResult.items,photoTargetMeal)} disabled={saving} style={{width:'100%',padding:'0.9375rem',borderRadius:'14px',border:'none',background:saving?'#D1CAF0':'linear-gradient(135deg,var(--primary),#9747FF)',color:'white',fontFamily:'inherit',fontWeight:700,fontSize:'1rem',cursor:saving?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
                      {saving?<><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/>שומר...</>:<><Check size={16}/>אשרי והוסיפי ליומן</>}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
