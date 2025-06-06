import React from 'react'
import ForceGraph3DTemplate from '../ForceGraph3DTemplate'
import './GraphContainer.css'

type DataItem = { vector: number[]; img: string; query: string }

interface Props {
  dataItems: DataItem[]
  loading: boolean
  onNodeClick: (node: { query: string }) => void
}

export default function GraphContainer({ dataItems, loading, onNodeClick }: Props) {
  return (
    <div className="graph-container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner large"></div>
            <p>Analyzing image similarity...</p>
          </div>
        </div>
      )}
      {dataItems.length > 0 && !loading && (
        <ForceGraph3DTemplate dataItems={dataItems} onNodeClick={onNodeClick} loading={loading} />
      )}
      {dataItems.length === 0 && !loading && (
        <div className="empty-state">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1" opacity="0.3">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
            <path d="m20.5 7.5L16 12l4.5 4.5M3.5 7.5 8 12l-4.5 4.5"/>
          </svg>
          <p>Upload an image and click "Search Similar" to see the visualization</p>
        </div>
      )}
    </div>
  )
}