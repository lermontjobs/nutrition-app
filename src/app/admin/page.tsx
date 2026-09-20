'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Edit3, Shield, User, Eye, EyeOff, Loader2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'

interface UserRow {
  id: string
  name: string
  email: string
  isAdmin: boolean
  createdAt: string
  goals?: { currentWeight: number; targetWeight: number; goalType: string; dailyCalories: number } | null
  _count: { foodLogs: number; bodyMeasurements: number }
}

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'ירידה במשקל',
  gain_muscle: 'בניית שריר',
  maintain: 'שמירה',
  improve_health: 'שיפור בריאות',
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [form, setForm] = useState({ name: '', email: '', password: '', isAdmin: false })
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) setUsers(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (session?.user?.isAdmin) fetchUsers() }, [session, fetchUsers])

  if (status === 'loading' || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: '#22c55e' }} />
    </div>
  )

  if (!session) { redirect('/auth/login'); return null }
  if (!session.user.isAdmin) return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</p>
      <h2 style={{ fontWeight: 700, color: '#1e293b' }}>גישה מוגבלת</h2>
      <p style={{ color: '#64748b' }}>רק מנהלי מערכת יכולים לגשת לדף זה</p>
    </div>
  )

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  const openCreate = () => {
    setEditUser(null)
    setForm({ name: '', email: '', password: '', isAdmin: false })
    setShowForm(true)
  }

  const openEdit = (u: UserRow) => {
    setEditUser(u)
    setForm({ name: u.name, email: u.email, password: '', isAdmin: u.isAdmin })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.email) { showMsg('err', 'שם ואימייל הם שדות חובה'); return }
    if (!editUser && !form.password) { showMsg('err', 'סיסמה היא שדה חובה למשתמש חדש'); return }
    setSaving(true)
    try {
      const url = editUser ? `/api/admin/users/${editUser.id}` : '/api/admin/users'
      const method = editUser ? 'PATCH' : 'POST'
      const body: Record<string, unknown> = { name: form.name, email: form.email, isAdmin: form.isAdmin }
      if (form.password) body.password = form.password
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { showMsg('err', data.error || 'שגיאה'); return }
      showMsg('ok', editUser ? 'משתמש עודכן בהצלחה' : 'משתמש נוצר בהצלחה')
      setShowForm(false)
      await fetchUsers()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showMsg('ok', 'משתמש נמחק')
      setDeleteConfirm(null)
      await fetchUsers()
    } else {
      const d = await res.json()
      showMsg('err', d.error || 'שגיאה במחיקה')
      setDeleteConfirm(null)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem',
    padding: '0.625rem 0.75rem', color: '#1e293b', outline: 'none', direction: 'rtl', fontFamily: 'inherit', fontSize: '0.875rem',
  }
  const labelStyle: React.CSSProperties = { fontSize: '0.875rem', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '0.375rem' }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>ניהול משתמשים</h1>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>{users.length} משתמשים במערכת</p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '0.75rem', padding: '0.5rem 0.875rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} /> משתמש חדש
        </button>
      </div>

      {/* Message */}
      {msg && (
        <div style={{ background: msg.type === 'ok' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${msg.type === 'ok' ? '#bbf7d0' : '#fecaca'}`, borderRadius: '0.75rem', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: msg.type === 'ok' ? '#15803d' : '#dc2626' }}>
          {msg.type === 'ok' ? <Check size={16} /> : <X size={16} />} {msg.text}
        </div>
      )}

      {/* Users list */}
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,.05)', border: u.id === session.user.id ? '2px solid #22c55e' : '1px solid #f1f5f9' }}>
            {/* Main row */}
            <div style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Avatar */}
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: u.isAdmin ? '#fef3c7' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.125rem' }}>
                {u.isAdmin ? '👑' : u.name[0]}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <p style={{ fontWeight: 600, color: '#1e293b', margin: 0, fontSize: '0.875rem' }}>{u.name}</p>
                  {u.isAdmin && <span style={{ fontSize: '0.6875rem', background: '#fef3c7', color: '#b45309', borderRadius: '9999px', padding: '0.125rem 0.5rem', fontWeight: 600 }}>מנהל</span>}
                  {u.id === session.user.id && <span style={{ fontSize: '0.6875rem', background: '#dcfce7', color: '#15803d', borderRadius: '9999px', padding: '0.125rem 0.5rem', fontWeight: 600 }}>אתה</span>}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.125rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
              </div>
              {/* Stats mini */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', margin: 0 }}>{u._count.foodLogs}</p>
                <p style={{ fontSize: '0.625rem', color: '#94a3b8', margin: 0 }}>רשומות</p>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                <button onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                  style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {expandedId === u.id ? <ChevronUp size={14} style={{ color: '#64748b' }} /> : <ChevronDown size={14} style={{ color: '#64748b' }} />}
                </button>
                <button onClick={() => openEdit(u)}
                  style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit3 size={14} style={{ color: '#2563eb' }} />
                </button>
                {u.id !== session.user.id && (
                  <button onClick={() => setDeleteConfirm(u.id)}
                    style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={14} style={{ color: '#ef4444' }} />
                  </button>
                )}
              </div>
            </div>

            {/* Expanded details */}
            {expandedId === u.id && (
              <div style={{ borderTop: '1px solid #f1f5f9', padding: '0.75rem 1rem', background: '#fafafa' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <div style={{ background: 'white', borderRadius: '0.5rem', padding: '0.5rem', textAlign: 'center' }}>
                    <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{u.goals?.dailyCalories || '—'}</p>
                    <p style={{ color: '#94a3b8', margin: 0 }}>קק"ל יעד</p>
                  </div>
                  <div style={{ background: 'white', borderRadius: '0.5rem', padding: '0.5rem', textAlign: 'center' }}>
                    <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{u.goals?.currentWeight || '—'}</p>
                    <p style={{ color: '#94a3b8', margin: 0 }}>משקל נוכחי</p>
                  </div>
                  <div style={{ background: 'white', borderRadius: '0.5rem', padding: '0.5rem', textAlign: 'center' }}>
                    <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{u._count.bodyMeasurements}</p>
                    <p style={{ color: '#94a3b8', margin: 0 }}>מדידות</p>
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>מטרה: {GOAL_LABELS[u.goals?.goalType || ''] || '—'}</span>
                  <span>הצטרף: {new Date(u.createdAt).toLocaleDateString('he-IL')}</span>
                </div>
              </div>
            )}

            {/* Delete confirm */}
            {deleteConfirm === u.id && (
              <div style={{ borderTop: '1px solid #fecaca', padding: '0.75rem 1rem', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: 0, fontWeight: 500 }}>למחוק את {u.name} ואת כל הנתונים שלו?</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleDelete(u.id)} style={{ padding: '0.375rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600 }}>מחק</button>
                  <button onClick={() => setDeleteConfirm(null)} style={{ padding: '0.375rem 0.75rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>בטל</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty */}
      {users.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>אין משתמשים עדיין</div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '1.5rem 1.5rem 0 0', width: '100%', maxWidth: '480px', padding: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>
                {editUser ? `עריכת ${editUser.name}` : 'משתמש חדש'}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label style={labelStyle}>שם מלא *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="ישראל ישראלי" />
              </div>
              <div>
                <label style={labelStyle}>אימייל *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="israel@example.com" />
              </div>
              <div>
                <label style={labelStyle}>{editUser ? 'סיסמה חדשה (ריק = ללא שינוי)' : 'סיסמה *'}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                    placeholder={editUser ? 'השאר ריק לשמירת הסיסמה הנוכחית' : 'לפחות 6 תווים'}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Admin toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fefce8', border: '1px solid #fde68a', borderRadius: '0.75rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={18} style={{ color: '#b45309' }} />
                  <div>
                    <p style={{ fontWeight: 500, color: '#92400e', margin: 0, fontSize: '0.875rem' }}>הרשאות מנהל</p>
                    <p style={{ fontSize: '0.75rem', color: '#a16207', margin: 0 }}>גישה לניהול כל המשתמשים</p>
                  </div>
                </div>
                <button onClick={() => setForm(f => ({ ...f, isAdmin: !f.isAdmin }))}
                  style={{ position: 'relative', width: '3rem', height: '1.5rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', background: form.isAdmin ? '#f59e0b' : '#e2e8f0', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: '0.125rem', width: '1.25rem', height: '1.25rem', background: 'white', borderRadius: '9999px', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'transform 0.2s', transform: form.isAdmin ? 'translateX(1.5rem)' : 'translateX(0.125rem)' }} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 size={18} className="animate-spin" /> : (editUser ? <Check size={18} /> : <Plus size={18} />)}
                  {saving ? 'שומר...' : (editUser ? 'שמור שינויים' : 'צור משתמש')}
                </button>
                <button onClick={() => setShowForm(false)} style={{ padding: '0.75rem 1rem', border: '1px solid #e2e8f0', background: 'white', borderRadius: '0.75rem', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
