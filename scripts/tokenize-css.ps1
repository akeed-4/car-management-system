# UI modernization: mechanical tokenization of hardcoded palette colors in
# component CSS files. Presentation-only; does not touch layout or logic.
# Each hex maps to exactly one semantic token (standard palette colors are
# unambiguous), except #fff/#000 which are handled property-aware.

$map = @{
  '#e5e7eb' = 'var(--border-default)'
  '#e0e0e0' = 'var(--border-default)'
  '#e9ecef' = 'var(--border-default)'
  '#dee2e6' = 'var(--border-default)'
  '#d1d5db' = 'var(--border-default)'
  '#ccc'    = 'var(--border-default)'
  '#f0f0f0' = 'var(--surface-sunken)'
  '#f8f9fa' = 'var(--surface-sunken)'
  '#f5f5f5' = 'var(--surface-sunken)'
  '#f9fafb' = 'var(--surface-sunken)'
  '#f3f4f6' = 'var(--surface-sunken)'
  '#333'    = 'var(--text-primary)'
  '#111827' = 'var(--text-primary)'
  '#1f2937' = 'var(--text-primary)'
  '#374151' = 'var(--text-primary)'
  '#1a1a1a' = 'var(--text-primary)'
  '#222'    = 'var(--text-primary)'
  '#666'    = 'var(--text-secondary)'
  '#999'    = 'var(--text-secondary)'
  '#888'    = 'var(--text-secondary)'
  '#777'    = 'var(--text-secondary)'
  '#6b7280' = 'var(--text-secondary)'
  '#4b5563' = 'var(--text-secondary)'
  '#9ca3af' = 'var(--text-secondary)'
  '#1976d2' = 'var(--color-primary-600)'
  '#1d4ed8' = 'var(--color-primary-600)'
  '#4338ca' = 'var(--color-primary-600)'
  '#2196f3' = 'var(--color-primary-600)'
  '#2563eb' = 'var(--color-primary-600)'
  '#1e40af' = 'var(--color-primary-700)'
  '#e3f2fd' = 'var(--color-primary-100)'
  '#eff6ff' = 'var(--color-primary-100)'
  '#dbeafe' = 'var(--color-primary-100)'
  '#2e7d32' = 'var(--color-success-600)'
  '#4caf50' = 'var(--color-success-500)'
  '#155724' = 'var(--color-success-700)'
  '#1b5e20' = 'var(--color-success-700)'
  '#28a745' = 'var(--color-success-500)'
  '#16a34a' = 'var(--color-success-600)'
  '#d4edda' = 'var(--status-success-bg)'
  '#e8f5e9' = 'var(--status-success-bg)'
  '#c62828' = 'var(--color-danger-600)'
  '#d32f2f' = 'var(--color-danger-600)'
  '#f44336' = 'var(--color-danger-500)'
  '#dc3545' = 'var(--color-danger-500)'
  '#b71c1c' = 'var(--color-danger-700)'
  '#ffebee' = 'var(--status-danger-bg)'
  '#f8d7da' = 'var(--status-danger-bg)'
  '#856404' = 'var(--status-warning-fg)'
  '#fff3cd' = 'var(--status-warning-bg)'
  '#ffc107' = 'var(--color-warning-500)'
  '#f57c00' = 'var(--color-warning-600)'
  '#ed6c02' = 'var(--color-warning-600)'
  '#f59e0b' = 'var(--color-warning-500)'
  '#d97706' = 'var(--color-warning-600)'
  '#b45309' = 'var(--color-warning-700)'
  '#92400e' = 'var(--status-warning-fg)'
  '#78350f' = 'var(--status-warning-fg)'
  '#7a4a00' = 'var(--status-warning-fg)'
  '#fef3c7' = 'var(--status-warning-bg)'
  '#fff8e1' = 'var(--status-warning-bg)'
  '#fff9f0' = 'var(--status-warning-bg)'
  '#f0fff4' = 'var(--status-success-bg)'
}

$files = Get-ChildItem -Path 'src\components' -Recurse -Filter '*.css'
$changedFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw
  $original = $content

  # Property-aware #fff: backgrounds -> surface-card (color:#fff kept as-is)
  $content = [regex]::Replace($content, '(?i)(background(?:-color)?\s*:\s*)#fff(?![0-9a-fA-F])', '$1var(--surface-card)')
  $content = [regex]::Replace($content, '(?i)(background(?:-color)?\s*:\s*)white(?![0-9a-zA-Z-])', '$1var(--surface-card)')
  # color:#000 / black -> text-primary
  $content = [regex]::Replace($content, '(?i)(color\s*:\s*)#000(?![0-9a-fA-F])', '$1var(--text-primary)')
  $content = [regex]::Replace($content, '(?i)(color\s*:\s*)black(?![0-9a-zA-Z-])', '$1var(--text-primary)')

  # Direct hex mappings (word-bounded so #fff3cd is not hit by #fff etc.)
  foreach ($hex in $map.Keys) {
    $pattern = [regex]::Escape($hex) + '(?![0-9a-fA-F])'
    $content = [regex]::Replace($content, $pattern, $map[$hex], 'IgnoreCase')
  }

  if ($content -ne $original) {
    $count = ([regex]::Matches($original, '#[0-9a-fA-F]{3,8}\b')).Count - ([regex]::Matches($content, '#[0-9a-fA-F]{3,8}\b')).Count
    $totalReplacements += $count
    $changedFiles++
    Set-Content -Path $file.FullName -Value $content -NoNewline
  }
}

Write-Output "Files changed: $changedFiles"
Write-Output "Approx replacements: $totalReplacements"