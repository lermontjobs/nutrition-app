'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Send, Loader2, Plus, ChevronDown, ChevronUp, Flame, Clock, AlertCircle } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestion?: MealSuggestion
}

interface MealSuggestion {
  name: string; calories: number; protein: number; carbs: number; fat: number
  prepTime: number; ingredients: { name: string; quantity: number; unit: string }[]
  instructions: string; reason: string
}

const quickActions = [
  { emoji: '🔥', text: 'ארוחה עד 400 קק"ל' },
  { emoji: '💪', text: 'עשירה בחלבון' },
  { emoji: '⚡', text: 'מהירה להכנה' },
  { emoji: '🌙', text: 'ארוחת לילה קלה' },
  { emoji: '🏃‍♀️', text: 'לפני אימון' },
  { emoji: '🍰', text: 'משהו מתוק' },
]

function SuggestionCard({ s, onAdd, onDismiss }: { s: MealSuggestion; onAdd: () => void; onDismiss: () => void }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [added, setAdded] = useState(false)

  return (
    <div style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(108,76,241,0.12)', border: '1.5px solid var(--primary-light)', marginTop: '0.75rem' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary-light), #F3EEFF)', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>✨ הצעת AI</span>
            <h4 style={{ fontWeight: 800, color: 'var(--text-main)', margin: '0.25rem 0 0', fontSize: '1.0625rem' }}>{s.name}</h4>
          </div>
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', fontSize: '1.125rem', padding: '0.125rem' }}>✕</button>
        </div>
        {/* Macros */}
        <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.75rem' }}>
          {[
            { icon: '🔥', val: s.calories, unit: 'קק"ל', color: 'var(--coral)' },
            { icon: '💪', val: `${s.protein}ג`, unit: 'חלבון', color: 'var(--primary)' },
            { icon: '⏱', val: `${s.prepTime}`, unit: "דק'", color: 'var(--teal)' },
          ].map(({ icon, val, unit, color }) => (
            <div key={unit} style={{ flex: 1, background: 'white', borderRadius: '12px', padding: '0.5rem', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.75rem' }}>{icon}</p>
              <p style={{ margin: '0.125rem 0 0', fontSize: '0.875rem', fontWeight: 800, color }}>{val}</p>
              <p style={{ margin: 0, fontSize: '0.625rem', color: 'var(--text-sub)' }}>{unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div style={{ padding: '0.75rem 1rem', background: '#FAFBFF', fontSize: '0.8125rem', color: 'var(--text-sub)' }}>{s.reason}</div>

      {/* Details toggle */}
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.625rem', background: 'none', border: 'none', borderTop: '1px solid var(--primary-light)', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600 }}>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {open ? 'הסתרת פרטים' : 'מרכיבים ואופן הכנה'}
      </button>

      {open && (
        <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ background: '#F8F6FF', borderRadius: '12px', padding: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', margin: '0 0 0.5rem', textTransform: 'uppercase' }}>מרכיבים</p>
            {s.ingredients.map((ing, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-main)', padding: '0.25rem 0', borderBottom: i < s.ingredients.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span>{ing.name}</span><span style={{ color: 'var(--text-sub)', fontWeight: 600 }}>{ing.quantity} {ing.unit}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#F8F6FF', borderRadius: '12px', padding: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', margin: '0 0 0.5rem', textTransform: 'uppercase' }}>הכנה</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', whiteSpace: 'pre-line', margin: 0 }}>{s.instructions}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '0 1rem 1rem' }}>
        {added ? (
          <div style={{ background: 'var(--lime-light)', borderRadius: '12px', padding: '0.75rem', textAlign: 'center', fontSize: '0.9375rem', fontWeight: 700, color: '#5C8A00' }}>✅ נוסף ליומן!</div>
        ) : !confirm ? (
          <button onClick={() => setConfirm(true)} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, var(--primary), #9747FF)' }}>
            <Plus size={18} /> הוסיפי ליומן
          </button>
        ) : (
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.75rem' }}>לאיזו ארוחה?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {['ארוחת בוקר', 'ארוחת ביניים', 'ארוחת צהריים', 'ארוחת ערב'].map(t => (
                <button key={t} onClick={() => { setAdded(true); onAdd() }}
                  style={{ padding: '0.625rem', fontSize: '0.8125rem', borderRadius: '12px', border: '2px solid var(--primary-light)', background: 'var(--primary-light)', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>{t}</button>
              ))}
            </div>
            <button onClick={() => setConfirm(false)} style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', border: '1px solid var(--border)', background: 'white', borderRadius: '12px', fontSize: '0.875rem', color: 'var(--text-sub)', cursor: 'pointer', fontFamily: 'inherit' }}>חזרה</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: 'שלום! אני כאן כדי לעזור לך לאכול טוב ולהרגיש טוב 🌟\n\nאפשר לשאול אותי על ארוחות, לבקש הצעות מותאמות אישית, או פשוט לספר לי מה יש לך בבית ואציע מה להכין.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  if (status === 'loading') return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} /></div>
  if (!session) { redirect('/auth/login'); return null }

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: msg }])
    setInput('')
    setLoading(true)
    try {
      const dashRes = await fetch('/api/dashboard')
      const dash = dashRes.ok ? await dashRes.json() : {}
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          context: {
            dailyCalories: dash.goals?.dailyCalories || 2000,
            dailyProtein: dash.goals?.dailyProtein || 150,
            dailyCarbs: dash.goals?.dailyCarbs || 200,
            dailyFat: dash.goals?.dailyFat || 65,
            eatenCalories: Math.round(dash.eatenTotals?.calories || 0),
            remainingCalories: Math.round((dash.goals?.dailyCalories || 2000) - (dash.eatenTotals?.calories || 0)),
            eatenProtein: Math.round(dash.eatenTotals?.protein || 0),
          },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.message, suggestion: data.mealSuggestion }])
      } else {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'מצטערת, נתקלתי בשגיאה. נסי שוב.' }])
      }
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 9rem)' }}>
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '3rem', height: '3rem', background: 'linear-gradient(135deg, var(--coral), #FF8C97)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(255,92,108,0.3)' }}>✨</div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>מאמנת התזונה שלי</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', margin: 0 }}>תמיד פה, תמיד מעודדת 💜</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '0.5rem' }} className="no-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-start' : 'flex-end' }}>
            <div style={{ maxWidth: '85%' }}>
              {msg.role === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                  <div style={{ width: '1.5rem', height: '1.5rem', background: 'linear-gradient(135deg, var(--coral), #FF8C97)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>✨</div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-sub)' }}>NutriMe AI</span>
                </div>
              )}
              <div style={{
                borderRadius: msg.role === 'user' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                padding: '0.875rem 1.125rem',
                background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary), #9747FF)' : 'white',
                color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                boxShadow: msg.role === 'assistant' ? 'var(--card-shadow)' : '0 4px 12px rgba(108,76,241,0.25)',
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
              }}>{msg.content}</div>
              {msg.suggestion && (
                <SuggestionCard s={msg.suggestion}
                  onAdd={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, suggestion: undefined } : m))}
                  onDismiss={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, suggestion: undefined } : m))} />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ background: 'white', borderRadius: '18px 18px 4px 18px', padding: '0.875rem 1.125rem', boxShadow: 'var(--card-shadow)', display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animation: `pulse-coral 1.2s ease ${i * 0.2}s infinite`, opacity: 0.6 }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick chips */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.75rem 0 0.5rem' }} className="no-scrollbar">
        {quickActions.map(({ emoji, text }) => (
          <button key={text} onClick={() => sendMessage(text)}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, background: 'white', border: '1.5px solid var(--border)', color: 'var(--text-main)', borderRadius: '100px', padding: '0.5rem 0.875rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(108,76,241,0.06)', whiteSpace: 'nowrap' }}>
            <span>{emoji}</span><span>{text}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.625rem' }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="ספרי לי מה מתחשק..."
          className="input-field" style={{ flex: 1 }} />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          style={{ width: '3.25rem', height: '3.25rem', background: 'linear-gradient(135deg, var(--coral), #FF8C97)', border: 'none', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (!input.trim() || loading) ? 0.4 : 1, boxShadow: '0 4px 12px rgba(255,92,108,0.3)', flexShrink: 0 }}>
          <Send size={18} style={{ color: 'white', transform: 'rotate(180deg)' }} />
        </button>
      </div>
    </div>
  )
}
