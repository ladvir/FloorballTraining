import React from 'react'
import type { EquipmentOnCanvas } from './DrawingTypes'

interface EquipmentLayerProps {
  equipment: EquipmentOnCanvas[]
  selectedItems: number[]
  handleSelect: (type: 'equipment', idx: number, e: React.MouseEvent) => void
}

const EquipmentLayer: React.FC<EquipmentLayerProps> = ({
  equipment,
  selectedItems,
  handleSelect,
}) => (
  <>
    {equipment.map((item, idx) => {
      const selected = selectedItems.includes(idx)
      return (
        <g key={`equipment-main${idx}`}>
          <g>
            <defs>
              <filter id="dilate" x="-50%" y="-50%" width="200%" height="200%">
                <feMorphology operator="dilate" radius="3" in="SourceAlpha" result="dilated" />
                <feGaussianBlur in="dilated" stdDeviation="0.5" result="blurred" />
                <feComposite in="blurred" in2="SourceAlpha" operator="xor" result="outline" />
                <feColorMatrix
                  in="outline"
                  type="matrix"
                  values="0 0 0 0 0
                       0 0 0 0 0.5
                       0 0 0 0 1
                       0 0 0 0.9 0"
                />
              </filter>
            </defs>

            <g
              id={'equipment' + idx}
              key={idx}
              transform={`translate(${item.x},${item.y})${item.rotation ? ` rotate(${item.rotation})` : ''}`}
              onMouseDown={(e) => handleSelect('equipment', idx, e)}
              onTouchStart={(e) => handleSelect('equipment', idx, e as unknown as React.MouseEvent)}
              style={{ cursor: 'move' }}
            >
              {renderEquipmentOnCanvas(item, idx)}
            </g>
          </g>

          {selected && (
            <g>
              <g filter="url(#dilate)">
                <use href={'#equipment' + idx} />
              </g>
              <use href={'#equipment' + idx} />
            </g>
          )}
        </g>
      )
    })}
  </>
)

const renderEquipmentOnCanvas = (item: EquipmentOnCanvas, idx: number) => {
  const tool = item.tool
  if (tool.toolId === 'ball') {
    return (
      <g id={'equipment' + idx} key={idx} transform="translate(-6,-5.5)">
        <path d="M6.01 10.53c-.14-.02-.56-.09-.7-.12-1.66-.41-2.98-1.66-3.5-3.29-.16-.54-.22-.97-.2-1.61.02-.67.13-1.2.39-1.8.26-.58.56-1.03 1.04-1.5.72-.72 1.58-1.17 2.58-1.34.66-.12 1.45-.09 2.1.08 1.73.46 3.09 1.85 3.5 3.58.1.42.12.61.12 1.15 0 .45-.01.54-.04.75-.15.86-.44 1.52-.95 2.22-.24.32-.74.8-1.1 1.05-.24.16-.65.38-.91.5-.31.13-.7.23-1.08.3-.18.03-.31.04-.7.04-.26 0-.5 0-.55 0zM7.03 10.18c.35-.04.75-.14 1.07-.27.18-.07.57-.26.65-.3.02-.02.1-.06.18-.11.14-.08.14-.09.34-.23.23-.18.62-.56.78-.78.02-.03.07-.1.11-.15.38-.5.67-1.19.8-1.9.05-.26.07-.93.04-1.23-.06-.75-.21-1.24-.46-1.76-.65-1.3-1.86-2.2-3.31-2.46-.31-.06-.93-.07-1.02-.03-.09.04-.74.14-.78.11-.04-.02-.38.06-.68.19-.38.16-.7.34-.97.54-.05.04-.12.09-.14.11-.22.16-.68.63-.81.82-.02.02-.06.1-.11.16-.46.64-.74 1.46-.8 2.3-.07 1.14.29 2.28 1.02 3.16.69.84 1.64 1.4 2.73 1.61.38.07.96.09 1.36.03zM4.71 9.19c-.41-.1-.75-.47-.68-.74.08-.3.66-.22.99.13.18.18.24.42.13.53-.06.06-.19.11-.28.11-.03 0-.1-.02-.16-.03zm3.08-.19c-.08-.02-.18-.11-.21-.18-.04-.09-.03-.21.02-.34.05-.14.23-.32.4-.41.22-.11.49-.14.65-.06.22.1.24.4.03.66-.08.1-.26.23-.39.3-.08.03-.14.05-.27.06-.1 0-.19 0-.23-.01zM2.69 6.11c-.08-.04-.14-.14-.21-.28-.03-.09-.04-.14-.04-.34 0-.19.01-.25.04-.34.1-.28.26-.38.43-.26.24.17.3.79.1 1.08-.1.14-.22.19-.32.14zm3.32-.28c-.24-.06-.41-.16-.54-.36-.14-.2-.17-.49-.09-.72.23-.65 1.1-.76 1.47-.18.2.3.18.7-.06.98-.17.21-.53.34-.78.28zm3.75-.5c-.17-.08-.32-.31-.37-.59-.03-.15-.03-.19-.01-.32.08-.49.48-.53.74-.08.16.28.17.66.02.89-.09.13-.22.17-.38.1zM3.62 2.93c-.05-.05-.05-.18 0-.27.16-.26.49-.5.75-.54.1-.02.21.03.22.1.03.15-.13.4-.39.58-.22.15-.5.21-.58.13zm3.78-.56c-.36-.04-.66-.24-.66-.46 0-.07.01-.09.06-.14.13-.1.37-.14.62-.07.33.08.55.26.55.43 0 .06-.01.09-.06.14-.1.09-.26.12-.51.1z" />
      </g>
    )
  } else if (tool.toolId === 'gate') {
    return (
      <g>
        {/* Branková čára – offset (-8,-20) so top-left is at (0,0) */}
        <line x1="0" y1="0" x2="64" y2="0" stroke="#ccc" strokeWidth="1.25" />

        <g
          fill="none"
          stroke="#e11d48"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M0 0 L0 15.5 C0 20 4.5 24.5 9 24.5 L55 24.5 C59.5 24.5 64 20 64 15.5 L64 0" />

          <g stroke="#e11d48" strokeOpacity="0.4" strokeWidth="1.25">
            <path d="M0 8 H64" />
            <path d="M0 16.5 H64" />
            <g>
              <path d="M16 24.5 V0" />
              <path d="M32 24.5 V0" />
              <path d="M48 24.5 V0" />
            </g>
          </g>
        </g>
      </g>
    )
  } else if (tool.toolId === 'low-cone') {
    return (
      <g id={'equipment' + idx} key={idx} transform="translate(-16,-15.5)">
        <path
          fill={tool.fill}
          stroke={tool.stroke}
          strokeWidth={tool.strokeWidth}
          d="M25.0329,18.0406c0.0011-0.0208,0.0091-0.0401,0.0091-0.0611c0-0.017-0.008-0.0313-0.0096-0.0478   c-0.0031-0.033-0.0096-0.064-0.0194-0.0962c-0.0104-0.0338-0.0231-0.0646-0.04-0.095c-0.0076-0.0137-0.0089-0.0291-0.0178-0.0423   l-4.1357-6.0697C20.5443,10.414,17.7112,10.0801,16,10.0801c-1.7117,0-4.5448,0.3339-4.8199,1.5485l-4.1347,6.0697   c-0.009,0.0132-0.0104,0.0287-0.018,0.0425c-0.0167,0.03-0.0294,0.0605-0.0397,0.0939c-0.0101,0.0328-0.0167,0.0645-0.0198,0.0982   c-0.0016,0.0161-0.0094,0.0301-0.0094,0.0466c0,0.0206,0.0079,0.0395,0.0089,0.0598c0.0022,0.0182,0.0037,0.0356,0.0079,0.0535   c0.178,1.8553,4.6221,2.8271,9.0247,2.8271c4.4031,0,8.8483-0.972,9.0253-2.8278C25.0293,18.0749,25.0307,18.0582,25.0329,18.0406z    M19.8193,11.8223c-0.252,0.252-1.5254,0.7422-3.8193,0.7422c-2.4458,0-3.7319-0.5566-3.8564-0.6953   c0.125-0.2324,1.4116-0.7891,3.8564-0.7891C18.293,11.0801,19.5674,11.5703,19.8193,11.8223z"
        />
      </g>
    )
  } else if (tool.toolId === 'slalom-pole') {
    return (
      <g id={'equipment' + idx} key={idx} transform="translate(-16,-16)">
        <path
          fill="#D68847"
          d="M23.5 28.8H8.5c-.75 0-1.33-.58-1.33-1.33s.58-1.33 1.33-1.33h15c.75 0 1.33.58 1.33 1.33s-.58 1.33-1.33 1.33"
        />

        <g fill="#ECBA16">
          <polygon points="23.06 26.15 19.75 12.02 16 12.02 12.21 12.02 8.94 26.15" />
          <path d="M18.74 7.62l-.88-3.75c-.09-.4-.44-.66-.84-.66h-2.12c-.4 0-.75.26-.84.66l-.88 3.75H16h2.74z" />
        </g>

        <g fill="#F7F6DD">
          <polygon points="19.75 12.02 18.74 7.62 16 7.62 13.18 7.62 12.21 12.02 16 12.02" />
          <path d="M16 16.88h-4.94l-1.02 4.42H16h5.96l-1.02-4.42H16z" />
        </g>
      </g>
    )
  } else if (tool.toolId === 'ladder' && item.x2 != null && item.y2 != null) {
    return renderLadder(item, idx)
  }
  return null
}

function renderLadder(item: EquipmentOnCanvas, idx: number) {
  const x1 = 0,
    y1 = 0
  const x2 = (item.x2 ?? 0) - item.x,
    y2 = (item.y2 ?? 0) - item.y
  const dx = x2 - x1,
    dy = y2 - y1
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 5) return null
  const nx = -dy / dist,
    ny = dx / dist
  const halfW = 8
  const rungSpacing = 12
  const rungCount = Math.max(2, Math.floor(dist / rungSpacing) + 1)
  const elements: React.ReactNode[] = []
  // Side rails
  elements.push(
    <line
      key="rail1"
      x1={x1 + nx * halfW}
      y1={y1 + ny * halfW}
      x2={x2 + nx * halfW}
      y2={y2 + ny * halfW}
      stroke="#000"
      strokeWidth={2}
    />,
    <line
      key="rail2"
      x1={x1 - nx * halfW}
      y1={y1 - ny * halfW}
      x2={x2 - nx * halfW}
      y2={y2 - ny * halfW}
      stroke="#000"
      strokeWidth={2}
    />
  )
  // Rungs
  for (let i = 0; i < rungCount; i++) {
    const t = rungCount === 1 ? 0 : i / (rungCount - 1)
    const px = x1 + dx * t,
      py = y1 + dy * t
    elements.push(
      <line
        key={`rung-${i}`}
        x1={px + nx * halfW}
        y1={py + ny * halfW}
        x2={px - nx * halfW}
        y2={py - ny * halfW}
        stroke="#000"
        strokeWidth={1.5}
      />
    )
  }
  return <g id={'equipment' + idx}>{elements}</g>
}

export default EquipmentLayer
