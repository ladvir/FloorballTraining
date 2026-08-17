import { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n/index'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Search, Download, Upload, Plus, AlertTriangle, Check } from 'lucide-react'

interface TranslationRow {
  key: string
  [lang: string]: string
}

interface AddLanguageDialogProps {
  onAdd: (code: string, label: string) => void
  onClose: () => void
  existingLangs: string[]
}

function AddLanguageDialog({ onAdd, onClose, existingLangs }: AddLanguageDialogProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const trimCode = code.trim().toLowerCase()
    if (!trimCode) {
      setError(t('admin.translationsLangCodeRequired'))
      return
    }
    if (existingLangs.includes(trimCode)) {
      setError(t('admin.translationsLangExists'))
      return
    }
    onAdd(trimCode, label.trim() || trimCode)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {t('admin.translationsAddLang')}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t('admin.translationsLangCode')}
            </label>
            <input
              className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="de, fr, pl..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t('admin.translationsLangLabel')}
            </label>
            <input
              className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder={t('admin.translationsLangNamePlaceholder')}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            {t('admin.translationsAddLangBtn')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TranslationsPage() {
  const { t } = useTranslation()

  // Detect languages that are loaded in i18next
  const defaultLangs = ['cs', 'en']
  const [languages, setLanguages] = useState<{ code: string; label: string }[]>(() => {
    const langs = i18n.languages
      .filter((l) => defaultLangs.includes(l))
      .map((code) => ({
        code,
        label: code === 'cs' ? i18n.t('auth.languageCs') : i18n.t('auth.languageEn'),
      }))
    return langs.length > 0
      ? langs
      : [
          { code: 'cs', label: i18n.t('auth.languageCs') },
          { code: 'en', label: i18n.t('auth.languageEn') },
        ]
  })

  const [search, setSearch] = useState('')
  const [dirty, setDirty] = useState<Record<string, Record<string, string>>>({}) // lang -> { key: value }
  const [addLangOpen, setAddLangOpen] = useState(false)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<Record<string, HTMLInputElement | null>>({})

  // Build translation table from all loaded bundles
  const allRows = useMemo<TranslationRow[]>(() => {
    // Collect all unique keys from all languages
    const allKeys = new Set<string>()
    for (const lang of languages) {
      const bundle = i18n.getResourceBundle(lang.code, 'translation')
      if (bundle) {
        flattenKeys(bundle, '', allKeys)
      }
    }

    return Array.from(allKeys)
      .sort()
      .map((key) => {
        const row: TranslationRow = { key }
        for (const lang of languages) {
          const bundle = i18n.getResourceBundle(lang.code, 'translation')
          row[lang.code] = getNestedValue(bundle, key) ?? ''
          // Apply dirty overrides
          if (dirty[lang.code]?.[key] !== undefined) {
            row[lang.code] = dirty[lang.code][key]
          }
        }
        return row
      })
  }, [languages, dirty])

  const filteredRows = useMemo(() => {
    if (!search.trim()) return allRows
    const q = search.toLowerCase()
    return allRows.filter(
      (r) =>
        r.key.toLowerCase().includes(q) ||
        languages.some((lang) => (r[lang.code] ?? '').toLowerCase().includes(q))
    )
  }, [allRows, search, languages])

  const hasDirty = useMemo(() => {
    return Object.values(dirty).some((lang) => Object.keys(lang).length > 0)
  }, [dirty])

  const handleEdit = (key: string, langCode: string, value: string) => {
    setDirty((prev) => ({
      ...prev,
      [langCode]: {
        ...(prev[langCode] ?? {}),
        [key]: value,
      },
    }))
    // Remove from savedKeys if being edited
    setSavedKeys((prev) => {
      const next = new Set(prev)
      next.delete(`${langCode}:${key}`)
      return next
    })
  }

  const handleSave = () => {
    const newSaved = new Set<string>()
    for (const [langCode, keys] of Object.entries(dirty)) {
      if (Object.keys(keys).length > 0) {
        i18n.addResources(langCode, 'translation', keys)
        for (const key of Object.keys(keys)) {
          newSaved.add(`${langCode}:${key}`)
        }
      }
    }
    setSavedKeys(newSaved)
    setDirty({})
  }

  const handleExport = (langCode: string) => {
    const bundle = i18n.getResourceBundle(langCode, 'translation') ?? {}
    // Apply dirty changes
    const merged = deepMerge(bundle, expandKeys(dirty[langCode] ?? {}))
    const json = JSON.stringify(merged, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${langCode}.json`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleImport = (langCode: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)
        const flat: Record<string, string> = {}
        flattenObject(json, '', flat)
        i18n.addResources(langCode, 'translation', flat)
        // Force re-render by clearing and re-setting
        setDirty((prev) => ({ ...prev }))
      } catch {
        alert(t('admin.translationsImportError'))
      }
    }
    reader.readAsText(file)
  }

  const handleDownloadAll = () => {
    const result: Record<string, Record<string, unknown>> = {}
    for (const lang of languages) {
      const bundle = i18n.getResourceBundle(lang.code, 'translation') ?? {}
      result[lang.code] = deepMerge(bundle, expandKeys(dirty[lang.code] ?? {}))
    }
    const json = JSON.stringify(result, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'translations.json'
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleAddLanguage = (code: string, label: string) => {
    setLanguages((prev) => [...prev, { code, label }])
    // Initialize with empty bundle
    i18n.addResourceBundle(code, 'translation', {}, true, true)
  }

  return (
    <div>
      <PageHeader
        title={t('admin.translations')}
        description={t('admin.translationsDesc')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddLangOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('admin.translationsAddLang')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadAll}>
              <Download className="h-4 w-4" />
              {t('admin.translationsDownloadAll')}
            </Button>
            {hasDirty && (
              <Button size="sm" onClick={handleSave}>
                <Check className="h-4 w-4" />
                {t('admin.translationsSave')}
              </Button>
            )}
          </div>
        }
      />

      {/* Unsaved changes warning */}
      {hasDirty && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{t('admin.translationsUnsaved')}</span>
        </div>
      )}

      {/* Search + per-language controls */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex flex-1 items-center gap-2 min-w-[200px] max-w-sm">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <Input
            placeholder={t('admin.translationsSearch')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex flex-wrap gap-2 ml-auto">
          {languages.map((lang) => (
            <div key={lang.code} className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-500 uppercase">{lang.code}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(lang.code)}
                title={t('admin.translationsExport', { lang: lang.label })}
              >
                <Download className="h-3.5 w-3.5" />
                {t('admin.translationsExportBtn')}
              </Button>
              <label
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                title={t('admin.translationsImport', { lang: lang.label })}
              >
                <Upload className="h-3.5 w-3.5" />
                {t('admin.translationsImportBtn')}
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  ref={(el) => {
                    fileInputRef.current[lang.code] = el
                  }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImport(lang.code, file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Translation table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                {t('admin.translationsKey')}
              </th>
              {languages.map((lang) => (
                <th
                  key={lang.code}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]"
                >
                  {lang.label} ({lang.code})
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={languages.length + 1} className="px-4 py-8 text-center text-gray-400">
                  {t('admin.translationsNoResults')}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.key} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2">
                    <code className="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-700">
                      {row.key}
                    </code>
                  </td>
                  {languages.map((lang) => {
                    const isDirty = dirty[lang.code]?.[row.key] !== undefined
                    const isSaved = savedKeys.has(`${lang.code}:${row.key}`)
                    return (
                      <td key={lang.code} className="px-4 py-2">
                        <div className="relative">
                          <input
                            className={`w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                              isDirty
                                ? 'border-amber-300 bg-amber-50 focus:border-amber-400'
                                : isSaved
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-gray-200 bg-white focus:border-sky-400'
                            }`}
                            value={row[lang.code] ?? ''}
                            onChange={(e) => handleEdit(row.key, lang.code, e.target.value)}
                          />
                          {isSaved && !isDirty && (
                            <Check className="absolute right-2 top-1.5 h-3.5 w-3.5 text-green-500" />
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        {t('admin.translationsCount', { count: filteredRows.length, total: allRows.length })}
      </p>

      {addLangOpen && (
        <AddLanguageDialog
          onAdd={handleAddLanguage}
          onClose={() => setAddLangOpen(false)}
          existingLangs={languages.map((l) => l.code)}
        />
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Flatten a nested object to dotted keys, adding to the Set */
function flattenKeys(obj: Record<string, unknown>, prefix: string, out: Set<string>) {
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flattenKeys(v as Record<string, unknown>, fullKey, out)
    } else {
      out.add(fullKey)
    }
  }
}

/** Get a value from a nested object by dotted key */
function getNestedValue(obj: Record<string, unknown>, key: string): string | undefined {
  if (!obj) return undefined
  const parts = key.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  if (typeof current === 'string') return current
  if (Array.isArray(current)) return current.join(', ')
  return undefined
}

/** Flatten a nested object to flat dotted key-value pairs */
function flattenObject(obj: unknown, prefix: string, out: Record<string, string>) {
  if (typeof obj === 'string') {
    out[prefix] = obj
    return
  }
  if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      flattenObject(v, prefix ? `${prefix}.${k}` : k, out)
    }
  }
}

/** Expand flat dotted-key object back to nested object */
function expandKeys(flat: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    let current = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {}
      }
      current = current[parts[i]] as Record<string, unknown>
    }
    current[parts[parts.length - 1]] = value
  }
  return result
}

/** Deep merge two objects (b overrides a) */
function deepMerge(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...a }
  for (const [k, v] of Object.entries(b)) {
    if (
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      typeof result[k] === 'object' &&
      result[k] !== null &&
      !Array.isArray(result[k])
    ) {
      result[k] = deepMerge(result[k] as Record<string, unknown>, v as Record<string, unknown>)
    } else {
      result[k] = v
    }
  }
  return result
}
