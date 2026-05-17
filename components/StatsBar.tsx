import { useLang } from '@/lib/LangContext'

export default function StatsBar({ totalCount }: { totalCount: number }) {
  const { lang } = useLang()
  const items = lang === 'ko'
    ? [
        { label: '등록된 AI', value: totalCount.toLocaleString(), unit: '개' },
        { label: '대분류', value: '13', unit: '개' },
        { label: '세분류', value: '69', unit: '개' },
      ]
    : [
        { label: 'AI Indexed', value: totalCount.toLocaleString(), unit: '' },
        { label: 'Main Categories', value: '13', unit: '' },
        { label: 'Subcategories', value: '69', unit: '' },
      ]

  return (
    <div className="grid grid-cols-3 gap-3 my-6">
      {items.map(({ label, value, unit }) => (
        <div key={label} className="card p-4 text-center">
          <div className="font-display text-3xl md:text-4xl" style={{ color: 'var(--accent)' }}>
            {value}<span className="text-lg text-gray-500 ml-1">{unit}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1 font-mono">{label}</div>
        </div>
      ))}
    </div>
  )
}
