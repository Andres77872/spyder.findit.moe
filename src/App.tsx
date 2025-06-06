import React, { useState } from 'react'
import './App.css'
import LandingUploader from './components/LandingUploader'
import Sidebar from './components/Sidebar'
import ExpandToggle from './components/ExpandToggle'
import GraphContainer from './components/GraphContainer'

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
    const [expandedView, setExpandedView] = useState(false)

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

    const toggleExpandedView = () => {
        setExpandedView(!expandedView)
    }

    if (!file) {
        return (
            <LandingUploader
                dragActive={dragActive}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onFileChange={handleFileChange}
            />
        )
    }

    return (
        <div className={`app-container loaded${expandedView ? ' expanded' : ''}`}>
            <Sidebar
                file={file}
                dataItems={dataItems}
                loading={loading}
                error={error}
                onUpload={handleUpload}
                onClear={() => {
                    setFile(null)
                    setDataItems([])
                    setError(null)
                    setDragActive(false)
                    setExpandedView(false)
                }}
            />
            <ExpandToggle expanded={expandedView} onToggle={toggleExpandedView} />
            <GraphContainer
                dataItems={dataItems}
                loading={loading}
                onNodeClick={handleNodeClick}
            />
        </div>
    )
}