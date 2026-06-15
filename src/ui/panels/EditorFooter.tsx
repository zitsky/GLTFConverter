import { useEditorStore } from '../../state/useEditorStore.ts'

/** Bottom status bar: status/messages on the left, credits on the right. */
export function EditorFooter() {
  const status = useEditorStore((s) => s.status)
  const busy = useEditorStore((s) => s.busy)

  return (
    <footer className="editor-footer">
      <span className="status">
        <span className="status-label">Статус:</span> {busy ? '⏳ ' : ''}
        {status}
      </span>
      <span className="credit">
        <a
          href="https://github.com/DagazProject/GLTFConverter"
          target="_blank"
          rel="noreferrer noopener"
        >
          GitHub
        </a>
        <span>
          Сделано с ❤️{' '}
          <a href="https://zitsky.com" target="_blank" rel="noreferrer noopener">
            zitsky.com
          </a>
        </span>
      </span>
    </footer>
  )
}
