import React from 'react'
import './ExpandToggle.css'

interface Props {
  expanded: boolean
  onToggle: () => void
}

export default function ExpandToggle({ expanded, onToggle }: Props) {
  return (
    <button
      className="btn-icon expand-toggle"
      onClick={onToggle}
      title={expanded ? 'Show sidebar' : 'Hide sidebar'}
      aria-label={expanded ? 'Show sidebar' : 'Hide sidebar'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {expanded ? (
          <polyline points="9 18 15 12 9 6" />
        ) : (
          <polyline points="15 18 9 12 15 6" />
        )}
      </svg>
    </button>
  )
}