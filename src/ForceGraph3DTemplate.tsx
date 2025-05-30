import { useRef, useEffect, useState } from 'react'
import ForceGraph3D, {type ForceGraphMethods } from 'react-force-graph-3d'

type Node = { id: string }
type Link = { source: string; target: string }

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export default function ForceGraph3DTemplate() {
  const fgRef = useRef<ForceGraphMethods>(null)

  const [graphData, setGraphData] = useState<GraphData>({
    nodes: Array.from({ length: 20 }, (_, i) => ({ id: `Node ${i}` })),
    links: Array.from({ length: 40 }, () => ({
      source: `Node ${Math.floor(Math.random() * 20)}`,
      target: `Node ${Math.floor(Math.random() * 20)}`,
    })),
  })

  useEffect(() => {
    fgRef.current?.d3Force('charge')?.strength(-200)
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeAutoColorBy="id"
        linkOpacity={0.5}
      />
    </div>
  )
}
