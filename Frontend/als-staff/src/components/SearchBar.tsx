import { SearchIcon, XIcon } from './Icon'

interface Props { value: string; onChange: (v: string) => void; placeholder?: string }

export default function SearchBar({ value, onChange, placeholder = 'ค้นหา...' }: Props) {
  return (
    <div className="search-wrap">
      <span className="search-icon"><SearchIcon size={14} /></span>
      <input className="search-input" type="text" placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)} />
      {value && <button className="search-clear" onClick={() => onChange('')}><XIcon size={14} /></button>}
    </div>
  )
}
