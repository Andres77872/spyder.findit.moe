import React, {useState} from 'react'
import ForceGraph3DTemplate from './ForceGraph3DTemplate'

interface SearchResultAPIItem {
    vector: number[]
    content?: Array<{ img: string; query: string }>
}

export default function App() {
    const [file, setFile] = useState<File | null>(null)
    const [dataItems, setDataItems] = useState<{ vector: number[]; img: string; query: string }[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null
        setFile(f)
        setDataItems([])
        setError(null)
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setDragActive(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setDragActive(false)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setDragActive(false)
        const f = e.dataTransfer.files?.[0] ?? null
        if (f && f.type.startsWith('image/')) {
            setFile(f)
            setDataItems([])
            setError(null)
        }
    }

    const handleUpload = async () => {
        if (!file) return
        setLoading(true)
        setError(null)
        try {
            const form = new FormData()
            form.append('image', file)
            form.append('limit', '64')
            form.append('with_vectors', 'true')
            form.append(
                'pool',
                'danbooru,gelbooru,zerochan,anime-pictures,yande.re,e-shuushuu,safebooru,konachan,tbib'
            )
            form.append('rating', 'g,s,q,e')

            const res = await fetch(
                'https://api.findit.moe/search/image/file',
                {
                    method: 'POST',
                    body: form,
                }
            )
            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}`)
            }
            const jsonResp = await res.json()
            if (!jsonResp.results?.data || !Array.isArray(jsonResp.results.data)) {
                throw new Error('Unexpected API response format')
            }
            const items = (jsonResp.results.data as SearchResultAPIItem[])
                .map(item => {
                    const img = item.content?.[0]?.img
                    const query = item.content?.[0]?.query
                    return img && query ? {vector: item.vector, img, query} : null
                })
                .filter((x): x is { vector: number[]; img: string; query: string } => x !== null)
            const uniqueItems = items.filter((item, index, self) =>
                self.findIndex(i => i.img === item.img) === index
            )
            setDataItems(uniqueItems)
        } catch (err: unknown) {
            console.error(err)
            const message = err instanceof Error ? err.message : String(err)
            setError(message || 'Error fetching vectors')
        } finally {
            setLoading(false)
        }
    }

    const handleNodeClick = async (node: { query: string }) => {
        setLoading(true)
        setError(null)
        try {
            const form = new FormData()
            form.append('query', node.query)
            form.append('limit', '64')
            form.append('with_vectors', 'true')
            form.append(
                'pool',
                'danbooru,gelbooru,zerochan,anime-pictures,yande.re,e-shuushuu,safebooru,konachan,tbib'
            )
            form.append('rating', 'g,s,q,e')

            const res = await fetch(
                'https://api.findit.moe/search/image/query',
                {method: 'POST', body: form}
            )
            if (!res.ok) throw new Error(`Server responded with ${res.status}`)
            const jsonResp = await res.json()
            if (!jsonResp.results?.data || !Array.isArray(jsonResp.results.data)) {
                throw new Error('Unexpected API response format')
            }
            const items = (jsonResp.results.data as SearchResultAPIItem[])
                .map(item => {
                    const img = item.content?.[0]?.img
                    const query = item.content?.[0]?.query
                    return img && query ? {vector: item.vector, img, query} : null
                })
                .filter((x): x is { vector: number[]; img: string; query: string } => x !== null)
            setDataItems(prevItems => {
                const merged = [...prevItems]
                const seen = new Set(prevItems.map(i => i.img))
                for (const item of items) {
                    if (!seen.has(item.img)) {
                        seen.add(item.img)
                        merged.push(item)
                    }
                }
                return merged
            })
        } catch (err: unknown) {
            console.error(err)
            const message = err instanceof Error ? err.message : String(err)
            setError(message || 'Error fetching vectors')
        } finally {
            setLoading(false)
        }
    }

    if (!file) {
        return (
            <div
                className="landing-uploader"
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{display: 'none'}}
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

    return (
        <div className="app-container loaded">
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
                        onClick={handleUpload}
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
                        onClick={() => {
                            setFile(null);
                            setDataItems([]);
                            setError(null);
                            setDragActive(false);
                        }}
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
                    <ForceGraph3DTemplate
                        dataItems={dataItems}
                        onNodeClick={handleNodeClick}
                    />
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
        </div>
    )
}