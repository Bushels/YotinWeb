[CmdletBinding()]
param(
    [switch]$NoPub
)

$ErrorActionPreference = 'Stop'

# This creates a separate root-target artifact only. It never writes the
# static-site root, Vercel configuration, or the noindex Field Review artifact.
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$outputPath = Join-Path $projectRoot 'build\public-home'

$flutterArgs = @(
    'build', 'web', '--wasm',
    '--base-href', '/',
    '--output', $outputPath
)
if ($NoPub) {
    $flutterArgs += '--no-pub'
}

& flutter @flutterArgs
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

# Match the Field Review runtime policy: retain only the renderer files that
# the generated bootstrap can select. The checks keep every deletion confined
# to this generated candidate artifact.
$resolvedOutputPath = [IO.Path]::GetFullPath($outputPath)
$outputPrefix = "$resolvedOutputPath$([IO.Path]::DirectorySeparatorChar)"
$engineOutputPath = Join-Path $outputPath 'canvaskit'
$resolvedEngineOutputPath = [IO.Path]::GetFullPath($engineOutputPath)
$enginePrefix = "$resolvedEngineOutputPath$([IO.Path]::DirectorySeparatorChar)"
if (-not (Test-Path -LiteralPath $engineOutputPath -PathType Container) -or
    -not $resolvedEngineOutputPath.StartsWith(
        $outputPrefix,
        [System.StringComparison]::OrdinalIgnoreCase
    )) {
    throw "Public-home candidate engine output is missing or outside its artifact: $resolvedEngineOutputPath"
}

$engineRuntimeFiles = @(
    'canvaskit\canvaskit.js',
    'canvaskit\canvaskit.wasm',
    'canvaskit\chromium\canvaskit.js',
    'canvaskit\chromium\canvaskit.wasm',
    'canvaskit\skwasm.js',
    'canvaskit\skwasm.wasm',
    'canvaskit\skwasm_heavy.js',
    'canvaskit\skwasm_heavy.wasm'
)
$allowedEngineFiles = @()
foreach ($relativePath in $engineRuntimeFiles) {
    $outputFile = [IO.Path]::GetFullPath((Join-Path $outputPath $relativePath))
    if (-not $outputFile.StartsWith(
            $enginePrefix,
            [System.StringComparison]::OrdinalIgnoreCase
        ) -or -not (Test-Path -LiteralPath $outputFile -PathType Leaf)) {
        throw "Public-home candidate renderer file is missing or unsafe: $relativePath"
    }
    $allowedEngineFiles += $outputFile
}

Get-ChildItem -LiteralPath $resolvedEngineOutputPath -File -Recurse |
    ForEach-Object {
        $generatedFile = [IO.Path]::GetFullPath($_.FullName)
        if (-not $generatedFile.StartsWith(
                $enginePrefix,
                [System.StringComparison]::OrdinalIgnoreCase
            )) {
            throw "Refusing to remove a renderer file outside the public-home artifact: $generatedFile"
        }
        if ($allowedEngineFiles -notcontains $generatedFile) {
            Remove-Item -LiteralPath $generatedFile -Force
        }
    }

Get-ChildItem -LiteralPath $resolvedEngineOutputPath -Directory -Recurse |
    Sort-Object { $_.FullName.Length } -Descending |
    ForEach-Object {
        if (-not (Get-ChildItem -LiteralPath $_.FullName -Force | Select-Object -First 1)) {
            Remove-Item -LiteralPath $_.FullName -Force
        }
    }

# The isolated candidate uses an explicit marker read by Dart at startup. That
# disables the Field Review-only offline control and worker registration while
# retaining the public content and same-page fragment behavior.
$indexPath = Join-Path $outputPath 'index.html'
if (-not (Test-Path -LiteralPath $indexPath -PathType Leaf)) {
    throw 'Public-home candidate index is missing.'
}
$indexDocument = Get-Content -Raw -LiteralPath $indexPath
$replacements = [ordered]@{
    '<html lang="en-CA">' = '<html lang="en-CA" data-yotin-surface="public-home">'
    '<!-- The Flutter route remains private until an explicit public-release gate. -->' = '<!-- Isolated indexed public-home candidate. This build does not deploy it. -->'
    '<meta name="robots" content="noindex,nofollow,noarchive">' = '<meta name="robots" content="index,follow">'
    '<meta name="description" content="A guided WellFi candidate-well field review from Yotin Energy.">' = '<meta name="description" content="WellFi brings live downhole pressure, temperature and vibration to surface with no cable &mdash; on new completions, planned changeouts, or any producer worth watching. 160 deployed internationally. Indigenous-owned, Pierceland SK.">'
    '<link rel="canonical" href="https://yotinenergy.com/field-review/">' = '<link rel="canonical" href="https://yotinenergy.com/">'
    '<meta property="og:title" content="WellFi Field Review | Yotin Energy">' = '<meta property="og:title" content="Yotin Energy &mdash; Know the Unknown">'
    '<meta property="og:description" content="A guided WellFi candidate-well field review from Yotin Energy.">' = '<meta property="og:description" content="An Indigenous Energy Services Company. WellFi real-time wireless downhole telemetry.">'
    '<meta property="og:url" content="https://yotinenergy.com/field-review/">' = '<meta property="og:url" content="https://yotinenergy.com/">'
    '<meta name="twitter:title" content="WellFi Field Review | Yotin Energy">' = '<meta name="twitter:title" content="Yotin Energy &mdash; Know the Unknown">'
    '<meta name="twitter:description" content="A guided WellFi candidate-well field review from Yotin Energy.">' = '<meta name="twitter:description" content="An Indigenous Energy Services Company. WellFi real-time wireless downhole telemetry.">'
    '<meta name="apple-mobile-web-app-title" content="Yotin Field Review">' = '<meta name="apple-mobile-web-app-title" content="Yotin Energy">'
    '<link rel="manifest" href="manifest.json">' = ''
    '<title>WellFi Field Review | Yotin Energy</title>' = '<title>Yotin Energy &mdash; Indigenous Energy Services &amp; WellFi Telemetry</title>'
    'skip-to-field-review' = 'skip-to-content'
}
foreach ($sourceFragment in $replacements.Keys) {
    if (-not $indexDocument.Contains($sourceFragment)) {
        throw "Public-home index source contract changed: $sourceFragment"
    }
    $indexDocument = $indexDocument.Replace($sourceFragment, $replacements[$sourceFragment])
}

$fieldReviewSchema = [regex]::new(
    '(?s)\s*<script type="application/ld\+json">\s*\{\s*"@context": "https://schema.org",\s*"@type": "WebPage".*?</script>'
)
if (-not $fieldReviewSchema.IsMatch($indexDocument)) {
    throw 'Public-home candidate could not locate the Field Review structured data to replace.'
}
$publicStructuredData = @'

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Yotin Energy",
    "url": "https://yotinenergy.com/",
    "logo": "https://yotinenergy.com/assets/yotin-icon.png",
    "description": "An Indigenous energy services company providing WellFi wireless downhole telemetry for Western Canadian wells.",
    "email": "info@yotinenergy.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Pierceland",
      "addressRegion": "SK",
      "addressCountry": "CA"
    },
    "areaServed": "Western Canada",
    "knowsAbout": [
      "Wireless downhole telemetry",
      "Electromagnetic telemetry",
      "Pressure monitoring",
      "Temperature monitoring",
      "Vibration monitoring",
      "Produced fluid monitoring",
      "Well data analytics",
      "MODBUS integration",
      "Progressing cavity pump changeouts",
      "Heavy oil wells",
      "Thermal wells"
    ]
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "WellFi",
    "category": "Downhole telemetry system",
    "url": "https://yotinenergy.com/#wellfi",
    "image": "https://yotinenergy.com/assets/yotin-wellfi-og-2026.png",
    "description": "WellFi is a wireless downhole telemetry tool that reports pressure, temperature, vibration and produced-fluid condition to surface over electromagnetic telemetry, with no downhole cable. It can be run on a new completion, during a planned pump changeout or workover, or as its own installation, and hands decoded readings to an existing RTU or SCADA system over MODBUS RS-485.",
    "brand": { "@type": "Brand", "name": "WellFi" },
    "manufacturer": { "@type": "Organization", "name": "Yotin Energy" },
    "additionalProperty": [
      { "@type": "PropertyValue", "name": "Pressure rating", "value": "10000 psia" },
      { "@type": "PropertyValue", "name": "Temperature rating", "value": "150 °C" },
      { "@type": "PropertyValue", "name": "Tool outer diameter", "value": "46 mm" },
      { "@type": "PropertyValue", "name": "Battery life", "value": "5+ years" },
      { "@type": "PropertyValue", "name": "Surface output", "value": "MODBUS RS-485" },
      { "@type": "PropertyValue", "name": "Deployments", "value": "160 installed internationally" }
    ]
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Does WellFi need a downhole cable?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. WellFi sends a low-power electromagnetic signal through the formation to a surface receiver. A fiberglass collar creates the antenna gap in the tubing string, so there is no cable to run, clamp or damage."
        }
      },
      {
        "@type": "Question",
        "name": "What does WellFi measure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pressure at the lift point, temperature at tool depth, pump and string vibration, produced-fluid composition changes, and interval flow behaviour interpreted from paired pressure and fluid-condition trends."
        }
      },
      {
        "@type": "Question",
        "name": "How is WellFi installed?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "WellFi attaches to the interior or exterior of the tubing. It is most often run on a new completion or during work that is already scheduled, such as a planned progressing cavity pump changeout or a workover, so no separate intervention is required — but it can also be installed on its own run where a well justifies it."
        }
      },
      {
        "@type": "Question",
        "name": "How does WellFi data reach our control system?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A surface receiver and ground reference decode the telemetry and output it over MODBUS RS-485 to the existing RTU or SCADA system. The WellFi Access Portal also analyzes the data and returns recommendations on drawdown, vibration and produced-fluid trends."
        }
      },
      {
        "@type": "Question",
        "name": "Where does Yotin Energy operate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yotin Energy is an Indigenous-owned energy services company based in Pierceland, Saskatchewan, serving the heavy-oil and oil sands corridor across Western Canada."
        }
      }
    ]
  }
  </script>
'@
$indexDocument = $fieldReviewSchema.Replace($indexDocument, $publicStructuredData, 1)
[IO.File]::WriteAllText($indexPath, $indexDocument, [Text.UTF8Encoding]::new($false))

# Public schema URLs use the established static-root asset paths. Stage only
# those two small source assets under that public contract; Flutter's normal
# runtime assets stay under assets/assets/.
$publicAssetMap = [ordered]@{
    'assets\yotin-icon.png' = 'assets\yotin-icon.png'
    'assets\yotin-wellfi-og-2026.png' = 'assets\yotin-wellfi-og-2026.png'
}
foreach ($sourceRelativePath in $publicAssetMap.Keys) {
    $sourcePath = Join-Path $projectRoot $sourceRelativePath
    $destinationPath = [IO.Path]::GetFullPath((Join-Path $outputPath $publicAssetMap[$sourceRelativePath]))
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf) -or
        -not $destinationPath.StartsWith(
            $outputPrefix,
            [System.StringComparison]::OrdinalIgnoreCase
        )) {
        throw "Public-home candidate asset is missing or unsafe: $sourceRelativePath"
    }
    Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Force
}

# This public marketing candidate deliberately does not claim Field Review's
# offline/PWA behavior. The field-only worker and manifest are removed from
# this separate output only; the /field-review/ artifact remains untouched.
foreach ($fieldOnlyArtifact in @('field_review_service_worker.js', 'manifest.json')) {
    $artifactPath = [IO.Path]::GetFullPath((Join-Path $outputPath $fieldOnlyArtifact))
    if (-not $artifactPath.StartsWith(
            $outputPrefix,
            [System.StringComparison]::OrdinalIgnoreCase
        )) {
        throw "Refusing to remove a public-home artifact outside its output: $artifactPath"
    }
    if (Test-Path -LiteralPath $artifactPath -PathType Leaf) {
        Remove-Item -LiteralPath $artifactPath -Force
    }
}

$utf8NoBom = [Text.UTF8Encoding]::new($false)
$robots = @'
User-agent: *
Allow: /
Disallow: /s/

Sitemap: https://yotinenergy.com/sitemap.xml
'@
$sitemap = @'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yotinenergy.com/</loc>
    <lastmod>2026-08-06</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
'@
[IO.File]::WriteAllText((Join-Path $outputPath 'robots.txt'), $robots, $utf8NoBom)
[IO.File]::WriteAllText((Join-Path $outputPath 'sitemap.xml'), $sitemap, $utf8NoBom)

$requiredOutputs = @(
    'index.html',
    'main.dart.wasm',
    'flutter_bootstrap.js',
    'canvaskit\skwasm.wasm',
    'assets\assets\yotin-icon.png',
    'assets\assets\wellfi-logo.webp',
    'assets\assets\wellfi-island-r3f-poster.webp',
    'assets\assets\wellfi-internal-ghost.webp',
    'assets\yotin-icon.png',
    'assets\yotin-wellfi-og-2026.png',
    'robots.txt',
    'sitemap.xml'
)
$missing = $requiredOutputs | Where-Object {
    -not (Test-Path -LiteralPath (Join-Path $outputPath $_) -PathType Leaf)
}
if ($missing) {
    throw "Public-home candidate build is incomplete. Missing: $($missing -join ', ')"
}

& node (Join-Path $PSScriptRoot 'verify_public_home_candidate.mjs') $outputPath
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

# The candidate must remain under the same conservative Flutter startup budget
# as Field Review. Passing this local estimate does not prove it beats the
# static root; protected-preview first/repeat measurements remain a separate
# release gate.
& node (Join-Path $PSScriptRoot 'verify_first_visit_payload.mjs') $outputPath
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Output "Public-home candidate build verified: $outputPath"
