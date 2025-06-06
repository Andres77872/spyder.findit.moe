import './Sidebar.css'

type DataItem = { vector: number[]; img: string; query: string }

interface Props {
  file: File
  dataItems: DataItem[]
  loading: boolean
  error: string | null
  onUpload: () => void
  onClear: () => void
}

export default function Sidebar({
  file,
  dataItems,
  loading,
  error,
  onUpload,
  onClear,
}: Props) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          <span className="title-find">Find</span>
          <span className="title-it">It</span>
        </h2>
      </div>

      <div className="preview-section">
        <div className="preview-wrapper">
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            className="preview-image"
          />
          <div className="image-info">
            <p className="file-name">{file.name}</p>
            <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        </div>
      </div>

      <div className="controls">
        <button
          className="btn btn-primary"
          onClick={onUpload}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Searching...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              Search Similar
            </>
          )}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onClear}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2">
            <path d="M3 6h18"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Clear
        </button>
      </div>

      {error && (
        <div className="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {dataItems.length > 0 && (
        <div className="results-info">
          <h3>Results</h3>
          <p>{dataItems.length} similar images found</p>
          <p className="hint">Click any node to expand search</p>
        </div>
      )}
    </div>
  )
}