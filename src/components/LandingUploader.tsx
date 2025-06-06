import React from 'react'
import './LandingUploader.css'

interface Props {
  dragActive: boolean
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function LandingUploader({
  dragActive,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
}: Props) {
  return (
    <div
      className="landing-uploader"
      onDragOver={onDragOver}
      onDragEnter={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        id="fileInput"
        type="file"
        accept="image/*"
        onChange={onFileChange}
        style={{ display: 'none' }}
      />
      <label htmlFor="fileInput" className={`upload-area${dragActive ? ' active' : ''}`}>
        <div className="upload-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
        <div className="landing-content">
          <h1 className="app-title">
            <span className="title-find">Find</span>
            <span className="title-it">It</span>
          </h1>
          <p className="app-subtitle">Visual Image Search Engine</p>
          <div className="upload-instructions">
            <p className="main-instruction">Drop an image here or click to browse</p>
            <p className="file-types">Supports: JPG, PNG, GIF, WebP</p>
          </div>
        </div>
      </label>
    </div>
  )
}