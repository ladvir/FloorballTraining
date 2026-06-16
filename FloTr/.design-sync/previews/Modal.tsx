import { Modal } from 'flotr'

export function Open() {
  return (
    <Modal isOpen={true} onClose={() => {}} title="Smazat tým">
      <p style={{ margin: '0 0 16px', fontSize: 14, color: '#374151' }}>
        Opravdu chcete smazat tým <strong>SK Florbal Praha</strong>? Tato akce je nevratná.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Zrušit
        </button>
        <button
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Smazat
        </button>
      </div>
    </Modal>
  )
}
