import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import ForceGraph3D, { type ForceGraphMethods, type NodeObject } from 'react-force-graph-3d'
import * as THREE from 'three'

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
}

export default function ForceGraph3DTemplate({ dataItems, onNodeClick }: Props) {
  const fgRef = useRef<ForceGraphMethods<NodeObject<Node>, Link> | undefined>(undefined)

  const [threshold, setThreshold] = useState(0.75)
  const textureLoaderRef = useRef(new THREE.TextureLoader())
  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map())

  const [hoveredNode, setHoveredNode] = useState<NodeObject<Node> | null>(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })
  const lastHoverPosRef = useRef({ x: 0, y: 0 })
  const frameRequestedRef = useRef(false)

  const nodes = useMemo<Node[]>(
    () =>
      dataItems.map((d, i) => ({ id: String(i), img: d.img, vector: d.vector, query: d.query })),
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
    () => ({ nodes, links: allLinks.filter(link => link.value > threshold) }),
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

  const handleNodeHover = useCallback((node: NodeObject<Node> | null) => setHoveredNode(node), [])
  const handleNodeClick = useCallback(
    (node: NodeObject<Node>) => onNodeClick?.(node as Node),
    [onNodeClick]
  )
  const nodeThreeObject = useCallback(
    (node: Node) => {
      const group = new THREE.Group()
      let imgTexture = textureCacheRef.current.get(node.img)
      if (!imgTexture) {
        imgTexture = textureLoaderRef.current.load(node.img)
        textureCacheRef.current.set(node.img, imgTexture)
      }
      const imgMaterial = new THREE.SpriteMaterial({ map: imgTexture })
      const imgSprite = new THREE.Sprite(imgMaterial)
      const imgSize = 8
      imgSprite.scale.set(imgSize, imgSize, 1)
      group.add(imgSprite)
      return group
    },
    []
  )
  const graphComponent = useMemo(
    () => (
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        linkOpacity={0.5}
        nodeThreeObject={nodeThreeObject}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
      />
    ),
    [graphData, nodeThreeObject, handleNodeClick, handleNodeHover]
  )
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    lastHoverPosRef.current = { x: e.clientX, y: e.clientY }
    if (!frameRequestedRef.current) {
      frameRequestedRef.current = true
      requestAnimationFrame(() => {
        setHoverPos(lastHoverPosRef.current)
        frameRequestedRef.current = false
      })
    }
  }, [])
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }} onMouseMove={handleMouseMove}>
      {graphComponent}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          backgroundColor: 'rgba(255,255,255,0.8)',
          padding: '6px 12px',
          borderRadius: 4,
          fontSize: 14,
          color: '#000',
          zIndex: 1,
        }}
      >
        <div>
          <strong>Nodes:</strong> {graphData.nodes.length}
        </div>
        <div>
          <strong>Edges:</strong> {graphData.links.length}
        </div>
        <div style={{ marginTop: 4 }}>
          <label style={{ fontSize: 12 }}>
            Threshold:&nbsp;
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
            />
            &nbsp;{threshold.toFixed(2)}
          </label>
        </div>
      </div>
      {hoveredNode && (
        <div
          style={{
            position: 'absolute',
            top: hoverPos.y + 10,
            left: hoverPos.x + 10,
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: 4,
            borderRadius: 4,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <img
            src={hoveredNode.img}
            alt={hoveredNode.query}
            style={{ width: 460, height: 460, objectFit: 'cover' }}
          />
          <div style={{ fontSize: 12 }}>{hoveredNode.query}</div>
        </div>
      )}
    </div>
  )
}
