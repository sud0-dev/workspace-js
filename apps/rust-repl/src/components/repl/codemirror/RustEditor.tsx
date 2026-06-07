import { useEffect, useRef } from 'react'
import { EditorState, Compartment } from '@codemirror/state'
import {
  EditorView,
  keymap,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  rectangularSelection,
  crosshairCursor,
  lineNumbers,
  highlightSpecialChars,
  placeholder,
} from '@codemirror/view'
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands'
import {
  bracketMatching,
  indentOnInput,
  foldGutter,
  foldKeymap,
} from '@codemirror/language'
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { rust } from '@codemirror/lang-rust'
import { foundryThemeBundle } from './foundryTheme'

type Props = {
  value: string
  onChange: (next: string) => void
  onRun: () => void
  onRunAndAdd: () => void
  disabled?: boolean
}

const PLACEHOLDER = '// type Rust · ⇧↵ run · ⌘↵ run & new cell'

export function RustEditor({ value, onChange, onRun, onRunAndAdd, disabled }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const readOnlyComp = useRef(new Compartment()).current

  // Ref the handlers so transient prop changes don't tear down the editor.
  const onChangeRef = useRef(onChange)
  const onRunRef = useRef(onRun)
  const onRunAndAddRef = useRef(onRunAndAdd)
  onChangeRef.current = onChange
  onRunRef.current = onRun
  onRunAndAddRef.current = onRunAndAdd

  // Mount once.
  useEffect(() => {
    if (!hostRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        foldGutter({ openText: '▾', closedText: '▸' }),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        highlightSelectionMatches(),
        bracketMatching(),
        closeBrackets(),
        indentOnInput(),
        autocompletion(),
        placeholder(PLACEHOLDER),
        keymap.of([
          {
            key: 'Shift-Enter',
            preventDefault: true,
            run: () => {
              onRunRef.current()
              return true
            },
          },
          {
            key: 'Mod-Enter',
            preventDefault: true,
            run: () => {
              onRunAndAddRef.current()
              return true
            },
          },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),
        rust(),
        ...foundryThemeBundle(),
        readOnlyComp.of(EditorState.readOnly.of(Boolean(disabled))),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString())
        }),
      ],
    })

    const view = new EditorView({ state, parent: hostRef.current })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync external value into the doc when it actually differs (e.g. reset / persist hydration).
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
    }
  }, [value])

  // Reconfigure read-only without rebuilding the view.
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: readOnlyComp.reconfigure(EditorState.readOnly.of(Boolean(disabled))),
    })
  }, [disabled, readOnlyComp])

  return <div ref={hostRef} className="cm-host" />
}
