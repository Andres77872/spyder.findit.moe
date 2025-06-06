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
        if (f) {
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
                'http://192.168.1.8:5010/search/image/file',
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
                    return img && query ? { vector: item.vector, img, query } : null
                })
                .filter((x): x is { vector: number[]; img: string; query: string } => x !== null)
            // Remove duplicate items by image URL
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
                'http://192.168.1.8:5010/search/image/query',
                { method: 'POST', body: form }
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
                    return img && query ? { vector: item.vector, img, query } : null
                })
                .filter((x): x is { vector: number[]; img: string; query: string } => x !== null)
            // Append only new items with unique image URLs
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

    return (
        <div className="app-container">
            <div
                className={`upload-area${dragActive ? ' active' : ''}`}
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
                    style={{ display: 'none' }}
                />
                <label htmlFor="fileInput" className="upload-label">
                    {file ? (
                        <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="preview-image"
                        />
                    ) : (
                        <span>Drag & drop an image here, or click to select</span>
                    )}
                </label>
            </div>
            <div className="controls">
                <button onClick={handleUpload} disabled={!file || loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
                {dataItems.length > 0 && !loading && (
                    <button
                        onClick={() => {
                            setDataItems([])
                            setFile(null)
                            setError(null)
                        }}
                    >
                        Clear Results
                    </button>
                )}
            </div>
            {error && <div className="error-message">{error}</div>}
            {dataItems.length > 0 && (
                <ForceGraph3DTemplate
                    dataItems={dataItems}
                    onNodeClick={handleNodeClick}
                />
            )}
        </div>
    )
}
