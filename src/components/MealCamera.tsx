'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, Loader2, Plus, ChevronDown, ChevronUp, Sparkles, AlertTriangle, Check } from 'lucide-react'

interface AnalysisItem {
  name: string; quantity: number; unit: string
  calories: number; protein: number; carbs: number; fat: number
}

interface MealAnalysis {
  mealName: string; description: string; confidence: 'high' | 'medium' | 'low'
  isEstimate: boolean; items: AnalysisItem[]
  totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number }
  mealType: string; prepTime: number; healthNotes: string; tips: string
}

interface Props {
  onClose: () => void
  onAddToLog?: (analysis: MealAnalysis) => void
}

const confidenceLabel = { high: { text: 'זיהוי טוב', color: '#5C8A00', bg: '#F0FAD6' }, medium: { text: 'זיהוי בינוני', color: '#B45309', bg: '#FFF3E0' }, low: { text: 'זיהוי חלקי', color: '#C0002A', bg: '#FFF0F0' } }
const mealTypeMap: Record<string, string> = { breakfast: 'ארוחת בוקר', lunch: 'ארוחת צהריים', dinner: 'ארוחת ערב', snack: 'ארוחת ביניים' }

export function MealCamera({ onClose, onAddToLog }: Props) {
  const [phase, setPhase] = useState<'capture' | 'preview' | 'analyzing' | 'result'>('capture')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imageMime, setImageMime] = useState('image/jpeg')
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showItems, setShowItems] = useState(false)
  const [added, setAdded] = useState(false)
  const [addingMealType, setAddingMealType] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { setError('יש לבחור קובץ תמונה'); return }
    if (file.size > 10 * 1024 * 1024) { setError('התמונה גדולה מדי (מקסימום 10MB)'); return }
    setImageMime(file.type)
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      setImageUrl(dataUrl)
      const base64 = dataUrl.split(',')[1]
      setImageBase64(base64)
      setPhase('preview')
    }
    reader.readAsDataURL(file)
  }, [])

  const analyze = async () => {
    if (!imageBase64) return
    setPhase('analyzing')
    setError(null)
    try {
      const res = await fetch('/api/ai/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: imageMime }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'שגיאה בניתוח'); setPhase('preview'); return }
      setAnalysis(data.analysis)
      setPhase('result')
    } catch {
      setError('שגיאת רשת — נסי שוב'); setPhase('preview')
    }
  }

  const handleAddToLog = async (mealType: string) => {
    if (!analysis) return
    try {
      await fetch('/api/diary/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName: analysis.mealName,
          calories: analysis.totals.calories,
          protein: analysis.totals.protein,
          carbs: analysis.totals.carbs,
          fat: analysis.totals.fat,
          quantity: 1,
          unit: 'מנה',
          mealType,
          isEstimate: true,
        }),
      })
      setAdded(true)
      setAddingMealType(false)
      onAddToLog?.(analysis)
      setTimeout(() => onClose(), 2000)
    } catch {
      setError('שגיאה בשמירה')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(32,32,51,0.7)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
      <div style={{ background: 'var(--cream)', borderRadius: '28px 28px 0 0', width: '100%', maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem 1.25rem' }} className="no-scrollbar">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2.75rem', height: '2.75rem', background: 'linear-gradient(135deg, var(--primary), #9747FF)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem' }}>📸</div>
            <div>
              <h3 style={{ fontWeight: 800, color: 'var(--text-main)', margin: 0, fontSize: '1.0625rem' }}>ניתוח ארוחה בתמונה</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', margin: 0 }}>AI Vision מזהה ומעריך ערכי תזונה ✨</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '2.25rem', height: '2.25rem', background: '#F0EEF9', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} style={{ color: 'var(--text-sub)' }} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FFF0F0', border: '1.5px solid #FFD0D5', borderRadius: '14px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#C0002A' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* CAPTURE phase */}
        {phase === 'capture' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--primary-light), #F3EEFF)', borderRadius: '22px', padding: '2rem 1.5rem', textAlign: 'center', border: '2px dashed rgba(108,76,241,0.3)' }}>
              <p style={{ fontSize: '3.5rem', margin: '0 0 0.75rem' }}>🍽️</p>
              <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.0625rem', margin: '0 0 0.375rem' }}>צלמי או העלי תמונת ארוחה</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)', margin: 0 }}>AI יזהה את הארוחה ויעריך את ערכי התזונה</p>
            </div>

            <button onClick={() => cameraRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', background: 'linear-gradient(135deg, var(--coral), #FF8C97)', color: 'white', border: 'none', borderRadius: '18px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 16px rgba(255,92,108,0.3)' }}>
              <Camera size={22} /> צלמי עכשיו
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />

            <button onClick={() => fileRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', background: 'white', color: 'var(--primary)', border: '2px solid var(--primary-light)', borderRadius: '18px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '1rem' }}>
              <Upload size={20} /> העלי מהגלריה
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: 1.5, padding: '0 0.5rem' }}>
              ⚠️ הערכים הם <strong>אומדן בלבד</strong> ולא מחליפים ייעוץ תזונתי מקצועי
            </p>
          </div>
        )}

        {/* PREVIEW phase */}
        {phase === 'preview' && imageUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ borderRadius: '18px', overflow: 'hidden', maxHeight: '320px', position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="ארוחה" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(32,32,51,0.7)', borderRadius: '10px', padding: '0.375rem 0.75rem', fontSize: '0.8125rem', color: 'white', fontWeight: 600 }}>
                תצוגה מקדימה
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { setPhase('capture'); setImageUrl(null); setImageBase64(null) }}
                style={{ flex: 1, padding: '0.875rem', border: '2px solid var(--border)', background: 'white', borderRadius: '16px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-sub)' }}>
                צלמי שוב
              </button>
              <button onClick={analyze}
                style={{ flex: 2, padding: '0.875rem', background: 'linear-gradient(135deg, var(--primary), #9747FF)', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 16px rgba(108,76,241,0.3)' }}>
                <Sparkles size={18} /> נתחי את הארוחה
              </button>
            </div>
          </div>
        )}

        {/* ANALYZING phase */}
        {phase === 'analyzing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '2rem 0' }}>
            {imageUrl && (
              <div style={{ borderRadius: '18px', overflow: 'hidden', width: '100%', maxHeight: '220px', position: 'relative', filter: 'brightness(0.6)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '4rem', height: '4rem', background: 'linear-gradient(135deg, var(--primary-light), #F3EEFF)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem' }}>
                🔍
              </div>
              <p style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.125rem', margin: '0 0 0.375rem' }}>מנתחת את הארוחה...</p>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.875rem', margin: 0 }}>AI Vision בודק מרכיבים וערכי תזונה</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['מזהה מרכיבים', 'מעריך כמויות', 'מחשבת ערכים'].map((t, i) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-sub)', background: 'white', borderRadius: '100px', padding: '0.375rem 0.625rem', boxShadow: '0 2px 8px rgba(0,0,0,.06)', animation: `fadeUp 0.4s ${i * 0.3}s both` }}>
                  <Loader2 size={12} className="animate-spin" style={{ color: 'var(--primary)' }} /> {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULT phase */}
        {phase === 'result' && analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Photo + name */}
            <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden' }}>
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(32,32,51,0.85) 0%, transparent 50%)' }} />
              <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', left: '1rem' }}>
                <h3 style={{ fontWeight: 900, color: 'white', fontSize: '1.25rem', margin: '0 0 0.25rem' }}>{analysis.mealName}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{analysis.description}</p>
              </div>
              {/* Confidence badge */}
              <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: confidenceLabel[analysis.confidence]?.bg || '#F0FAD6', borderRadius: '10px', padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: 700, color: confidenceLabel[analysis.confidence]?.color || '#5C8A00' }}>
                {confidenceLabel[analysis.confidence]?.text}
              </div>
            </div>

            {/* Totals */}
            <div style={{ background: 'linear-gradient(135deg, var(--primary), #9747FF)', borderRadius: '20px', padding: '1.25rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8125rem', margin: '0 0 0.875rem', fontWeight: 600 }}>
                {analysis.isEstimate ? '* הערכת ערכי תזונה' : 'ערכי תזונה'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {[
                  { label: 'קלוריות', val: analysis.totals.calories, unit: "קק\"ל", emoji: '🔥' },
                  { label: 'חלבון', val: analysis.totals.protein, unit: "ג'", emoji: '💪' },
                  { label: 'פחמימות', val: analysis.totals.carbs, unit: "ג'", emoji: '🌾' },
                  { label: 'שומן', val: analysis.totals.fat, unit: "ג'", emoji: '💧' },
                ].map(({ label, val, unit, emoji }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '14px', padding: '0.625rem', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>{emoji}</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '1.125rem', fontWeight: 900, color: 'white' }}>{Math.round(val)}</p>
                    <p style={{ margin: 0, fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)' }}>{unit}</p>
                    <p style={{ margin: 0, fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Meal type + time */}
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <div style={{ flex: 1, background: 'white', borderRadius: '16px', padding: '0.875rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
                <p style={{ margin: 0, fontSize: '1.25rem' }}>🍽️</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>{mealTypeMap[analysis.mealType] || analysis.mealType}</p>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-sub)' }}>סוג ארוחה</p>
              </div>
              <div style={{ flex: 1, background: 'white', borderRadius: '16px', padding: '0.875rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
                <p style={{ margin: 0, fontSize: '1.25rem' }}>⏱</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>{analysis.prepTime} דקות</p>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-sub)' }}>זמן הכנה</p>
              </div>
              {analysis.totals.fiber > 0 && (
                <div style={{ flex: 1, background: 'white', borderRadius: '16px', padding: '0.875rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
                  <p style={{ margin: 0, fontSize: '1.25rem' }}>🌿</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>{analysis.totals.fiber}ג׳</p>
                  <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-sub)' }}>סיבים</p>
                </div>
              )}
            </div>

            {/* Items breakdown */}
            <div style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
              <button onClick={() => setShowItems(s => !s)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9375rem' }}>פירוט מרכיבים ({analysis.items.length})</span>
                {showItems ? <ChevronUp size={18} style={{ color: 'var(--primary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--primary)' }} />}
              </button>
              {showItems && (
                <div style={{ padding: '0 1rem 1rem' }}>
                  {analysis.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: i < analysis.items.length - 1 ? '1px solid #F0EEF9' : 'none' }}>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: 0, fontSize: '0.875rem' }}>{item.name}</p>
                        <p style={{ color: 'var(--text-sub)', fontSize: '0.75rem', margin: '0.125rem 0 0' }}>{item.quantity} {item.unit}</p>
                      </div>
                      <div style={{ textAlign: 'left', display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--coral)' }}>{Math.round(item.calories)} קק"ל</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{Math.round(item.protein)}ג׳ חלבון</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Health notes & tips */}
            {(analysis.healthNotes || analysis.tips) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {analysis.healthNotes && (
                  <div style={{ background: 'var(--lime-light)', borderRadius: '14px', padding: '0.875rem', display: 'flex', gap: '0.5rem', fontSize: '0.8125rem', color: '#3D5A00' }}>
                    <span style={{ flexShrink: 0 }}>🌿</span><span>{analysis.healthNotes}</span>
                  </div>
                )}
                {analysis.tips && (
                  <div style={{ background: 'var(--primary-light)', borderRadius: '14px', padding: '0.875rem', display: 'flex', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--primary)' }}>
                    <span style={{ flexShrink: 0 }}>💡</span><span>{analysis.tips}</span>
                  </div>
                )}
              </div>
            )}

            {/* Estimate warning */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '14px', padding: '0.75rem', display: 'flex', gap: '0.5rem', fontSize: '0.8125rem', color: '#B45309' }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>ערכי התזונה הם <strong>הערכה בלבד</strong> בהתבסס על מה שנראה בתמונה. הם עשויים לחרוג מהערכים האמיתיים.</span>
            </div>

            {/* Add to log */}
            <div>
              {added ? (
                <div style={{ background: 'var(--lime-light)', borderRadius: '16px', padding: '1rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700, color: '#3D5A00', fontSize: '1rem' }}>
                  <Check size={20} /> נוסף ליומן! 🎉
                </div>
              ) : !addingMealType ? (
                <button onClick={() => setAddingMealType(true)}
                  style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, var(--primary), #9747FF)', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 16px rgba(108,76,241,0.3)' }}>
                  <Plus size={20} /> הוסיפי ליומן האכילה
                </button>
              ) : (
                <div style={{ background: 'white', borderRadius: '18px', padding: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>לאיזו ארוחה להוסיף?</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.625rem' }}>
                    {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                      <button key={type} onClick={() => handleAddToLog(type)}
                        style={{ padding: '0.75rem', borderRadius: '14px', border: '2px solid var(--primary-light)', background: 'var(--primary-light)', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.875rem' }}>
                        {mealTypeMap[type]}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setAddingMealType(false)} style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', background: 'white', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', color: 'var(--text-sub)' }}>ביטול</button>
                </div>
              )}
            </div>

            {/* Redo */}
            <button onClick={() => { setPhase('capture'); setImageUrl(null); setAnalysis(null); setAdded(false) }}
              style={{ width: '100%', padding: '0.75rem', border: '2px solid var(--border)', background: 'transparent', borderRadius: '16px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-sub)' }}>
              📸 צלמי ארוחה אחרת
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
