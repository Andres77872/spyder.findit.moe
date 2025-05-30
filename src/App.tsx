import React, {useState} from 'react'
import ForceGraph3DTemplate from './ForceGraph3DTemplate'

export default function App() {
    const [file, setFile] = useState<File | null>(null)
    const [dataItems, setDataItems] = useState<{ vector: number[]; img: string; query: string }[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null
        setFile(f)
        setDataItems([])
        setError(null)
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
            const items = jsonResp.results.data.map((item: any) => ({
                vector: item.vector as number[],
                img: item.content?.[0]?.img,
                query: item.content?.[0]?.query,
            }))
            setDataItems(items)
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Error fetching vectors')
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
            const items = jsonResp.results.data.map((item: any) => ({
                vector: item.vector as number[],
                img: item.content?.[0]?.img,
                query: item.content?.[0]?.query,
            }))
            setDataItems(prevItems => [...prevItems, ...items])
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Error fetching vectors')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <input type="file" accept="image/*" onChange={handleFileChange}/>
            <button onClick={handleUpload} disabled={!file || loading}>
                {loading ? 'Uploading...' : 'Upload Image'}
            </button>
            {error && <p style={{color: 'red'}}>{error}</p>}
            {dataItems.length > 0 && (
                <ForceGraph3DTemplate
                    dataItems={dataItems}
                    onNodeClick={handleNodeClick}
                />
            )}
        </div>
    )
}
