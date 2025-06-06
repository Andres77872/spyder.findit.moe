import { useRef, useEffect, useMemo } from 'react'
import ForceGraph3D, { type ForceGraphMethods } from 'react-force-graph-3d'
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
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined)

  const threshold = 0.75
  const textureLoaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader())
  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map())

  const graphData = useMemo<GraphData>(() => {
    const nodes: Node[] = dataItems.map((d, i) => ({
      id: String(i),
      img: d.img,
      vector: d.vector,
      query: d.query,
    }))
    const links: Link[] = []
    const cosine = (a: number[], b: number[]) => {
      const dot = a.reduce((sum, ai, idx) => sum + ai * b[idx], 0)
      const magA = Math.hypot(...a)
      const magB = Math.hypot(...b)
      return magA && magB ? dot / (magA * magB) : 0
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const sim = cosine(nodes[i].vector, nodes[j].vector)
        if (sim > threshold) {
          links.push({ source: nodes[i].id, target: nodes[j].id, value: sim })
        }
      }
    }
    return { nodes, links }
  }, [dataItems])

  useEffect(() => {
    const fg = fgRef.current
    fg?.d3Force('charge')?.strength(-200)
    const linkForce = fg?.d3Force('link')
    if (linkForce) {
      linkForce.distance((link: Link) => (1 - link.value) * 50 + 10)
    }
  }, [graphData])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <ForceGraph3D
        style={{ width: '100%', height: '100%' }}
        ref={fgRef}
        graphData={graphData}
        linkOpacity={0.5}
        nodeThreeObject={(node: Node) => {
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
        }}
        onNodeClick={onNodeClick}
      />
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
        <div><strong>Nodes:</strong> {graphData.nodes.length}</div>
        <div><strong>Edges:</strong> {graphData.links.length}</div>
      </div>
    </div>
  )
}
