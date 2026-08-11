import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className={className}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: copied ? '#3fb950' : '#6e7681',
        padding: '2px 4px',
        borderRadius: 4,
        display: 'inline-flex',
        alignItems: 'center',
        transition: 'color 0.15s',
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  )
}
