import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

// All colors resolve via CSS vars so the theme toggle drives the editor too.
export const foundryTheme = EditorView.theme(
  {
    '&': {
      color: 'var(--ink)',
      backgroundColor: 'transparent',
      fontFamily: 'var(--font-mono)',
      fontFeatureSettings: '"zero", "ss01"',
      height: '100%',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-scroller': {
      fontFamily: 'var(--font-mono)',
      lineHeight: '1.6',
      fontVariantNumeric: 'tabular-nums',
      overflow: 'auto',
    },
    '.cm-content': {
      caretColor: 'var(--ember)',
      padding: '14px 0',
    },
    '.cm-line': {
      padding: '0 22px',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: 'var(--ink-faint)',
      border: 'none',
      borderRight: '1px dashed var(--rule)',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.74rem',
    },
    '.cm-gutterElement': {
      padding: '0 10px 0 14px',
      fontVariantNumeric: 'tabular-nums',
    },
    '.cm-activeLineGutter': {
      color: 'var(--ember)',
      backgroundColor: 'transparent',
    },
    '.cm-activeLine': {
      backgroundColor: 'color-mix(in oklab, var(--ember) 4%, transparent)',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--ember)',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'var(--ember-soft)',
    },
    '.cm-selectionMatch': {
      backgroundColor: 'color-mix(in oklab, var(--ember) 16%, transparent)',
    },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'color-mix(in oklab, var(--ember) 22%, transparent)',
      color: 'inherit',
      outline: '1px solid var(--ember)',
      borderRadius: '2px',
    },
    '.cm-nonmatchingBracket': {
      color: 'var(--stderr)',
    },
    '.cm-tooltip': {
      backgroundColor: 'var(--surface-strong)',
      border: '1px solid var(--rule)',
      color: 'var(--ink)',
      borderRadius: '4px',
      fontFamily: 'var(--font-sans)',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      backgroundColor: 'var(--ember-soft)',
      color: 'var(--ink)',
    },
    '.cm-placeholder': {
      color: 'var(--ink-faint)',
      fontStyle: 'italic',
    },
    '.cm-searchMatch': {
      backgroundColor: 'var(--ember-soft)',
      outline: '1px solid var(--ember)',
    },
  },
  { dark: false },
)

export const foundryHighlight = HighlightStyle.define([
  // structural / declarations
  { tag: [t.keyword, t.modifier], color: 'var(--ember)', fontWeight: '600' },
  { tag: [t.controlKeyword, t.operatorKeyword], color: 'var(--ember)' },
  { tag: t.definitionKeyword, color: 'var(--ember)', fontWeight: '700' },
  // identifiers
  { tag: [t.variableName, t.propertyName], color: 'var(--ink)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--ink)' },
  { tag: t.definition(t.variableName), color: 'var(--ink)' },
  { tag: t.definition(t.function(t.variableName)), color: 'var(--ink)', fontWeight: '600' },
  // types / namespaces
  { tag: [t.typeName, t.className, t.namespace], color: 'oklch(0.55 0.10 200)' },
  { tag: t.standard(t.typeName), color: 'oklch(0.55 0.10 200)', fontStyle: 'italic' },
  // literals
  { tag: t.string, color: 'var(--ok)' },
  { tag: t.special(t.string), color: 'var(--ok)' },
  { tag: t.regexp, color: 'var(--ok)' },
  { tag: t.escape, color: 'var(--ember)' },
  { tag: t.number, color: 'var(--ember)' },
  { tag: [t.bool, t.null, t.atom], color: 'var(--ember)', fontWeight: '600' },
  { tag: t.character, color: 'var(--ok)' },
  // punctuation, operators
  { tag: t.operator, color: 'var(--ink-soft)' },
  { tag: t.punctuation, color: 'var(--ink-soft)' },
  { tag: t.bracket, color: 'var(--ink-soft)' },
  // comments
  { tag: t.lineComment, color: 'var(--ink-faint)', fontStyle: 'italic' },
  { tag: t.blockComment, color: 'var(--ink-faint)', fontStyle: 'italic' },
  { tag: t.docComment, color: 'var(--ink-faint)', fontStyle: 'italic' },
  // attributes / macros / labels
  { tag: t.macroName, color: 'oklch(0.62 0.13 320)', fontWeight: '600' },
  { tag: t.meta, color: 'var(--ink-faint)' },
  { tag: t.labelName, color: 'oklch(0.62 0.13 320)' },
  { tag: t.heading, color: 'var(--ink)', fontWeight: '700' },
  { tag: t.invalid, color: 'var(--stderr)', textDecoration: 'underline wavy' },
])

export function foundryThemeBundle() {
  return [foundryTheme, syntaxHighlighting(foundryHighlight)]
}
