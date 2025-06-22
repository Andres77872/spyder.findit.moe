import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import ForceGraph3D, {type ForceGraphMethods, type NodeObject} from 'react-force-graph-3d'
import * as THREE from 'three'
import './ForceGraph3DTemplate.css'

type DataItem = { vector: number[]; img: string; query: string }
type Node = DataItem & { id: string }
type Link = { source: string; target: string; value: number }

interface GraphData {
    nodes: Node[]
    links: Link[]
}

interface Props {
    dataItems: DataItem[]
    onNodeClick?: (node: Node) => void
    loading?: boolean
}

const THRESHOLD_STORAGE_KEY = 'findit-similarity-threshold'
const DEFAULT_THRESHOLD = 0.75

// Helper functions for localStorage
const loadThresholdFromStorage = (): number => {
    try {
        const stored = localStorage.getItem(THRESHOLD_STORAGE_KEY)
        if (stored !== null) {
            const parsed = parseFloat(stored)
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
                return parsed
            }
        }
    } catch (error) {
        console.warn('Failed to load threshold from localStorage:', error)
    }
    return DEFAULT_THRESHOLD
}

const saveThresholdToStorage = (threshold: number): void => {
    try {
        localStorage.setItem(THRESHOLD_STORAGE_KEY, threshold.toString())
    } catch (error) {
        console.warn('Failed to save threshold to localStorage:', error)
    }
}

export default function ForceGraph3DTemplate({dataItems, onNodeClick, loading}: Props) {
    const fgRef = useRef<ForceGraphMethods<NodeObject<Node>, Link> | undefined>(undefined)

    // Initialize threshold from localStorage
    const [threshold, setThreshold] = useState(() => loadThresholdFromStorage())
    const [autoRotate, setAutoRotate] = useState(false)
    const animationFrameRef = useRef<number | null>(null)
    const textureLoaderRef = useRef(new THREE.TextureLoader())
    const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map())

    const [hoveredNode, setHoveredNode] = useState<NodeObject<Node> | null>(null)
    const [hoverPos, setHoverPos] = useState({x: 0, y: 0})
    const lastHoverPosRef = useRef({x: 0, y: 0})
    const frameRequestedRef = useRef(false)

    // Handler for threshold changes with localStorage persistence
    const handleThresholdChange = useCallback((newThreshold: number) => {
        setThreshold(newThreshold)
        saveThresholdToStorage(newThreshold)
    }, [])

    const nodes = useMemo<Node[]>(
        () =>
            dataItems.map((d, i) => ({id: String(i), img: d.img, vector: d.vector, query: d.query})),
        [dataItems]
    )

    const allLinks = useMemo<Link[]>(() => {
        const links: Link[] = []
        const cosine = (a: number[], b: number[]) => {
            const dot = a.reduce((sum, ai, idx) => sum + ai * b[idx], 0)
            const magA = Math.hypot(...a)
            const magB = Math.hypot(...b)
            return magA && magB ? dot / (magA * magB) : 0
        }
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                links.push({
                    source: nodes[i].id,
                    target: nodes[j].id,
                    value: cosine(nodes[i].vector, nodes[j].vector),
                })
            }
        }
        return links
    }, [nodes])

    const graphData = useMemo<GraphData>(
        () => ({nodes, links: allLinks.filter(link => link.value > threshold)}),
        [nodes, allLinks, threshold]
    )

    useEffect(() => {
        const fg = fgRef.current
        fg?.d3Force('charge')?.strength(-200)
        const linkForce = fg?.d3Force('link')
        if (linkForce) {
            linkForce.distance((link: Link) => (1 - link.value) * 50 + 10)
        }
    }, [graphData.links])

    useEffect(() => {
        // Clean up any existing animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }

        if (autoRotate && fgRef.current) {
            const fg = fgRef.current
            const distance = 800
            let angle = 0
            
            const animate = () => {
                // Check if we should continue rotating
                if (!autoRotate) {
                    animationFrameRef.current = null
                    return
                }
                
                angle += 0.005
                const x = distance * Math.sin(angle)
                const z = distance * Math.cos(angle)
                fg.cameraPosition({x, y: 200, z}, {x: 0, y: 0, z: 0})
                animationFrameRef.current = requestAnimationFrame(animate)
            }
            animationFrameRef.current = requestAnimationFrame(animate)
        }

        // Cleanup function
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
        }
    }, [autoRotate])

    const handleNodeHover = useCallback((node: NodeObject<Node> | null) => setHoveredNode(node), [])

    const handleNodeClick = useCallback(
        (node: NodeObject<Node>) => {
            if (!loading) {
                onNodeClick?.(node as Node)
            }
        },
        [onNodeClick, loading]
    )

    const nodeThreeObject = useCallback(
        (node: Node) => {
            const group = new THREE.Group()
            let imgTexture = textureCacheRef.current.get(node.img)
            if (!imgTexture) {
                imgTexture = textureLoaderRef.current.load(node.img)
                textureCacheRef.current.set(node.img, imgTexture)
            }
            const imgMaterial = new THREE.SpriteMaterial({map: imgTexture})
            const imgSprite = new THREE.Sprite(imgMaterial)
            const imgSize = 8
            imgSprite.scale.set(imgSize, imgSize, 1)
            group.add(imgSprite)
            return group
        },
        []
    )

    const resetCamera = useCallback(() => {
        fgRef.current?.cameraPosition({x: 0, y: 0, z: 300}, {x: 0, y: 0, z: 0}, 1000)
    }, [])

    const toggleAutoRotate = useCallback(() => {
        setAutoRotate(prev => !prev)
    }, [])

    const graphComponent = useMemo(
        () => (
            <ForceGraph3D
                ref={fgRef}
                graphData={graphData}
                linkOpacity={0.3}
                linkWidth={0.5}
                nodeThreeObject={nodeThreeObject}
                onNodeClick={handleNodeClick}
                onNodeHover={handleNodeHover}
                backgroundColor="rgba(0,0,0,0)"
                showNavInfo={false}
            />
        ),
        [graphData, nodeThreeObject, handleNodeClick, handleNodeHover]
    )

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        lastHoverPosRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        }
        if (!frameRequestedRef.current) {
            frameRequestedRef.current = true
            requestAnimationFrame(() => {
                setHoverPos(lastHoverPosRef.current)
                frameRequestedRef.current = false
            })
        }
    }, [])

    return (
        <div className="graph-wrapper" onMouseMove={handleMouseMove}>
            {graphComponent}

            <div className="graph-controls">
                <div className="graph-stats">
                    <div className="stat-item">
                        <span className="stat-label">Nodes</span>
                        <span className="stat-value">{graphData.nodes.length}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Edges</span>
                        <span className="stat-value">{graphData.links.length}</span>
                    </div>
                </div>

                <div className="threshold-control">
                    <label htmlFor="threshold-slider">
                        <span className="control-label">Similarity Threshold</span>
                        <div className="slider-container">
                            <input
                                id="threshold-slider"
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={threshold}
                                onChange={e => handleThresholdChange(parseFloat(e.target.value))}
                                className="threshold-slider"
                                style={{'--value': `${threshold * 100}%`} as React.CSSProperties}
                            />
                            <span className="threshold-value">{threshold.toFixed(2)}</span>
                        </div>
                    </label>
                </div>
                
                <div className="graph-actions">
                    <button className="btn-graph" onClick={resetCamera} title="Reset camera view">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 1l6 6m0 0V3m0 4H3"/>
                            <path d="M3 11V9a6 6 0 0 1 12 0v2M21 21l-6-6m0 0v4m0-4h4"/>
                            <path d="M21 13v2a6 6 0 0 1-12 0v-2"/>
                        </svg>
                        Reset
                    </button>
                    <button 
                        className="btn-graph" 
                        onClick={toggleAutoRotate} 
                        title={autoRotate ? "Stop rotation" : "Start rotation"}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {autoRotate ? (
                                <rect x="6" y="6" width="12" height="12" rx="1"/>
                            ) : (
                                <path d="M23 12a11 11 0 1 1-22 0 11 11 0 0 1 22 0zm-5 0a6 6 0 1 1-12 0 6 6 0 0 1 12 0z"/>
                            )}
                        </svg>
                        {autoRotate ? 'Stop' : 'Rotate'}
                    </button>
                </div>
            </div>

            {hoveredNode && (
                <div
                    className="node-tooltip"
                    style={{
                        top: Math.min(hoverPos.y + 10, window.innerHeight - 500),
                        left: Math.min(hoverPos.x + 10, window.innerWidth - 480),
                    }}
                >
                    <div className="tooltip-image-wrapper">
                        <img
                            src={hoveredNode.img}
                            alt={hoveredNode.query}
                            className="tooltip-image"
                        />
                    </div>
                    <div className="tooltip-content">
                        <p className="tooltip-query">{hoveredNode.query}</p>
                        {!loading && (
                            <p className="tooltip-hint">Click to search similar</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}