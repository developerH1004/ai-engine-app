'use client'
export default function SearchBar({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div style={{position:'relative', width:'100%'}}>
      <input
        style={{
          width: '100%',
          height: '48px',
          paddingLeft: '16px',
          paddingRight: value ? '40px' : '16px',
          borderRadius: '12px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: '#fff',
          fontSize: '14px',
          outline: 'none',
        }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'AI 이름, 제조사, 기능으로 검색...'}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >✕</button>
      )}
    </div>
  )
}
