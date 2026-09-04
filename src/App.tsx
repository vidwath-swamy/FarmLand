import { useMemo, useRef, useState } from 'react'
import { ChevronDown, Crosshair, Eye, EyeOff, Map, Minus, Plus, RotateCcw, Save, SlidersHorizontal, Upload } from 'lucide-react'

type Point = { x: number; y: number }

const initialPoints: Point[] = [
  { x: 93.3866, y: 78.6889 },
  { x: 483.9712, y: 212.6019 },
  { x: 550.9286, y: 977.8193 },
  { x: 192.2284, y: 971.4425 },
  { x: 136.4306, y: 1024.0512 },
  { x: 87.0097, y: 1027.2396 },
  { x: 88, y: 965 },
]

const mapWidth = 614
const mapHeight = 1100

function polygonArea(points: Point[]) {
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length]
    return sum + point.x * next.y - next.x * point.y
  }, 0) / 2)
}

function polygonPerimeter(points: Point[]) {
  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length]
    return sum + Math.hypot(next.x - point.x, next.y - point.y)
  }, 0)
}

type Dimension = { start: number; end: number; label: string; offset: number }

const dimensions: Dimension[] = [
  { start: 0, end: 1, label: '70 m · ROAD', offset: -30 },
  { start: 1, end: 2, label: '150 m · WEST', offset: -35 },
  { start: 6, end: 0, label: '196 m · EAST', offset: -38 },
  { start: 2, end: 3, label: '53 m', offset: -28 },
  { start: 3, end: 4, label: '12 m', offset: -30 },
  { start: 4, end: 5, label: '12 m', offset: -34 },
]

function DimensionLines({ points }: { points: Point[] }) {
  return (
    <g className="dimensions" aria-label="Farm boundary dimensions">
      {dimensions.map((dimension) => {
        const start = points[dimension.start]
        const end = points[dimension.end]
        const dx = end.x - start.x
        const dy = end.y - start.y
        const length = Math.hypot(dx, dy)
        const normalX = (-dy / length) * dimension.offset
        const normalY = (dx / length) * dimension.offset
        const x1 = start.x + normalX
        const y1 = start.y + normalY
        const x2 = end.x + normalX
        const y2 = end.y + normalY
        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2
        return (
          <g key={`${dimension.start}-${dimension.end}`} className="dimension-line">
            <line x1={start.x} y1={start.y} x2={x1} y2={y1} />
            <line x1={end.x} y1={end.y} x2={x2} y2={y2} />
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            <line x1={x1 - dy / length * 5} y1={y1 + dx / length * 5} x2={x1 + dy / length * 5} y2={y1 - dx / length * 5} />
            <line x1={x2 - dy / length * 5} y1={y2 + dx / length * 5} x2={x2 + dy / length * 5} y2={y2 - dx / length * 5} />
            <text x={midX} y={midY - 6} textAnchor="middle">{dimension.label}</text>
          </g>
        )
      })}
    </g>
  )
}

function edgeOffset(points: Point[], startIndex: number, endIndex: number, offset: number) {
  const start = points[startIndex]
  const end = points[endIndex]
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy)
  return {
    start: { x: start.x - (dy / length) * offset, y: start.y + (dx / length) * offset },
    end: { x: end.x - (dy / length) * offset, y: end.y + (dx / length) * offset },
  }
}

function NorthRoad({ points }: { points: Point[] }) {
  const inner = edgeOffset(points, 0, 1, -42)
  const outer = edgeOffset(points, 0, 1, -78)
  return (
    <g className="road-layer" aria-label="North road">
      <polygon points={`${inner.start.x},${inner.start.y} ${inner.end.x},${inner.end.y} ${outer.end.x},${outer.end.y} ${outer.start.x},${outer.start.y}`} />
      <line x1={inner.start.x} y1={inner.start.y} x2={inner.end.x} y2={inner.end.y} />
      <line x1={outer.start.x} y1={outer.start.y} x2={outer.end.x} y2={outer.end.y} />
      <text x={(inner.start.x + inner.end.x) / 2} y={(inner.start.y + inner.end.y) / 2 - 11} textAnchor="middle">NORTH ROAD</text>
    </g>
  )
}

function Compass() {
  return (
    <g className="compass" aria-label="Full compass">
      <circle cx="548" cy="68" r="25" />
      <path d="M548 37 V99 M517 68 H579" />
      <path d="M548 42 L544 52 L548 49 L552 52 Z" className="compass-north" />
      <text x="548" y="31" textAnchor="middle">N</text>
      <text x="588" y="72" textAnchor="middle">E</text>
      <text x="548" y="114" textAnchor="middle">S</text>
      <text x="508" y="72" textAnchor="middle">W</text>
    </g>
  )
}

function NeighbourLabels({ points }: { points: Point[] }) {
  const east = edgeOffset(points, 6, 0, -58)
  const west = edgeOffset(points, 1, 2, -58)
  const back = edgeOffset(points, 2, 3, -42)
  return (
    <g className="neighbour-layer" aria-label="Neighbour plot owners">
      <text x={(east.start.x + east.end.x) / 2} y={(east.start.y + east.end.y) / 2} textAnchor="middle" transform={`rotate(-82 ${(east.start.x + east.end.x) / 2} ${(east.start.y + east.end.y) / 2})`}>PRAKASH</text>
      <text x={(west.start.x + west.end.x) / 2} y={(west.start.y + west.end.y) / 2} textAnchor="middle" transform={`rotate(82 ${(west.start.x + west.end.x) / 2} ${(west.start.y + west.end.y) / 2})`}>SANTOSH</text>
      <text x={(back.start.x + back.end.x) / 2} y={(back.start.y + back.end.y) / 2 + 18} textAnchor="middle">ANIL</text>
    </g>
  )
}

function SatelliteTexture() {
  return (
    <svg className="satellite-texture" viewBox={`0 0 ${mapWidth} ${mapHeight}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="soil" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#706b51" />
          <stop offset="0.5" stopColor="#918467" />
          <stop offset="1" stopColor="#4b5442" />
        </linearGradient>
        <pattern id="rows" width="23" height="23" patternUnits="userSpaceOnUse" patternTransform="rotate(4)">
          <rect width="23" height="23" fill="#8f8064" />
          <path d="M 2 0 V 23 M 8 0 V 23 M 15 0 V 23 M 21 0 V 23" stroke="#4a5b43" strokeWidth="2.5" opacity=".66" />
          <path d="M 4 0 V 23 M 18 0 V 23" stroke="#c3aa7a" strokeWidth="1.2" opacity=".7" />
        </pattern>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" stitchTiles="stitch" /><feColorMatrix values=".5 0 0 0 .1 .5 0 0 0 .08 .5 0 0 0 .04 0 0 0 .25 0" /></filter>
      </defs>
      <rect width={mapWidth} height={mapHeight} fill="url(#soil)" />
      <path d="M0 0 H614 V1100 H0Z" fill="#172f2c" opacity=".22" />
      <path d="M0 0 H150 L95 1100 H0Z" fill="#23483d" opacity=".94" />
      <path d="M520 140 H614 V1100 H475 Z" fill="#153a35" opacity=".94" />
      <path d="M100 156 L574 218 L441 1000 L88 960Z" fill="url(#rows)" opacity=".82" />
      <path d="M115 168 L570 225" stroke="#d0b687" strokeWidth="7" opacity=".5" />
      <path d="M0 1050 H614" stroke="#6e5945" strokeWidth="56" opacity=".7" />
      <path d="M38 0 L24 1100 M581 0 L592 1100" stroke="#819b87" strokeWidth="2" opacity=".25" />
      <rect width={mapWidth} height={mapHeight} filter="url(#grain)" opacity=".3" />
    </svg>
  )
}

function App() {
  const [points, setPoints] = useState<Point[]>(initialPoints)
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const [visibleLayers, setVisibleLayers] = useState({ dimensions: true, road: true, neighbours: true })
  const svgRef = useRef<SVGSVGElement>(null)
  const area = useMemo(() => polygonArea(points), [points])
  const perimeter = useMemo(() => polygonPerimeter(points), [points])
  const viewBox = useMemo(() => {
    const width = mapWidth / zoom
    const height = mapHeight / zoom
    return `${(mapWidth - width) / 2} ${(mapHeight - height) / 2} ${width} ${height}`
  }, [zoom])

  function updatePoint(index: number, event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const bounds = svg.getBoundingClientRect()
    const viewBoxParts = viewBox.split(' ').map(Number)
    const x = viewBoxParts[0] + ((event.clientX - bounds.left) / bounds.width) * viewBoxParts[2]
    const y = viewBoxParts[1] + ((event.clientY - bounds.top) / bounds.height) * viewBoxParts[3]
    setPoints((current) => current.map((point, pointIndex) => pointIndex === index ? {
      x: Math.max(0, Math.min(mapWidth, x)),
      y: Math.max(0, Math.min(mapHeight, y)),
    } : point))
  }

  function reset() {
    setPoints(initialPoints)
    setSelectedPoint(null)
  }

  function toggleLayer(layer: keyof typeof visibleLayers) {
    setVisibleLayers((current) => ({ ...current, [layer]: !current[layer] }))
  }

  function changeZoom(amount: number) {
    setZoom((current) => Math.min(2.4, Math.max(0.7, Number((current + amount).toFixed(1)))))
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><span /><span /><span /></div>
          <div><p className="eyebrow">FARMLAND / FIELD 01</p><h1>Geometry desk</h1></div>
        </div>
        <div className="top-actions">
          <button className="icon-button" title="Open map layers"><Map size={17} /></button>
          <button className="outline-button"><Save size={16} /> Save draft</button>
          <div className="avatar">RK</div>
        </div>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="section-heading"><div><p className="eyebrow">CURRENT TASK</p><h2>Trace farm boundary</h2></div><span className="status-dot" /></div>
          <p className="intro">Set the outer geometry first. Every future row, zone, and irrigation run will anchor to this shape.</p>

          <div className="step-list">
            <div className="step active"><span>01</span><div><strong>Farm geometry</strong><small>Boundary polygon</small></div><ChevronDown size={15} /></div>
            <div className="step"><span>02</span><div><strong>Planting rows</strong><small>Coming next</small></div><span className="locked">LOCKED</span></div>
            <div className="step"><span>03</span><div><strong>Field zones</strong><small>Coming later</small></div><span className="locked">LOCKED</span></div>
          </div>

          <div className="metric-panel">
            <div className="panel-title"><span>GEOMETRY READOUT</span><SlidersHorizontal size={14} /></div>
            <div className="metrics"><div><strong>{area.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong><span>sq image units</span></div><div><strong>{perimeter.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong><span>perimeter units</span></div></div>
            <div className="land-area"><strong>2.87</strong><span>acres total land area</span></div>
            <div className="scale-note"><Crosshair size={15} /><span>Boundary dimensions set<br /><b>Metric anchors active</b></span></div>
          </div>

          <div className="layer-panel">
            <div className="panel-title"><span>MAP LAYERS</span><SlidersHorizontal size={14} /></div>
            {([['dimensions', 'Measurements'], ['road', 'North road'], ['neighbours', 'Plot owners']] as const).map(([layer, label]) => (
              <button className="layer-toggle" key={layer} onClick={() => toggleLayer(layer)} aria-pressed={visibleLayers[layer]}>
                <span className={`layer-swatch ${layer}`} />
                <span>{label}</span>
                {visibleLayers[layer] ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            ))}
          </div>

          <div className="sidebar-bottom"><button className="upload-button"><Upload size={16} /> Replace image</button><p>PNG, JPG or GeoTIFF · max 25 MB</p></div>
        </aside>

        <section className="canvas-area">
          <div className="canvas-toolbar"><div className="breadcrumb"><span>FIELD 01</span><b>/</b><strong>BOUNDARY EDITOR</strong></div><div className="toolbar-actions"><button className="tool-button" onClick={reset}><RotateCcw size={15} /> Reset points</button><div className="zoom-controls" aria-label="Map zoom controls"><button className="zoom-button" onClick={() => changeZoom(-0.1)} disabled={zoom <= 0.7} title="Zoom out"><Minus size={14} /></button><span>{Math.round(zoom * 100)}%</span><button className="zoom-button" onClick={() => changeZoom(0.1)} disabled={zoom >= 2.4} title="Zoom in"><Plus size={14} /></button><button className="zoom-reset" onClick={() => setZoom(1)} disabled={zoom === 1} title="Reset zoom">Reset</button></div></div></div>
          <div className="map-stage">
            <div className="map-frame">
              <svg ref={svgRef} className="geometry-svg" viewBox={viewBox} onWheel={(event) => { event.preventDefault(); changeZoom(event.deltaY > 0 ? -0.1 : 0.1) }} onPointerMove={(event) => selectedPoint !== null && updatePoint(selectedPoint, event)} onPointerUp={() => setSelectedPoint(null)}>
                {visibleLayers.road && <NorthRoad points={points} />}
                {visibleLayers.neighbours && <NeighbourLabels points={points} />}
                {visibleLayers.dimensions && <DimensionLines points={points} />}
                <polygon points={points.map((point) => `${point.x},${point.y}`).join(' ')} className="farm-polygon" />
                {points.map((point, index) => <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r={index === selectedPoint ? 10 : 7} className={`vertex ${index === selectedPoint ? 'selected' : ''}`} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setSelectedPoint(index) }} />)}
              </svg>
                      <svg className="map-annotations" viewBox={viewBox} aria-hidden="true"><Compass /></svg>
                      <div className="map-label label-field">FIELD 01 <small>boundary draft</small></div>
              <div className="map-coordinates">18° 31' 42.8&quot; N<br />73° 51' 14.1&quot; E</div>
            </div>
            <div className="map-legend"><span className="legend-line" /> Editable boundary <span className="legend-point" /> Control point</div>
          </div>
          <footer className="canvas-footer"><span><b>{points.length}</b> control points</span><span>Drag points to reshape boundary</span><span>Draft autosaved just now</span></footer>
        </section>
      </section>
    </main>
  )
}

export default App