[CmdletBinding()]
param(
    [switch]$NoPub
)

$ErrorActionPreference = 'Stop'

# Flutter 3.44 requires an absolute `--output` path. In this SDK the compiler
# writes a complete fresh route artifact there. Prune that output in place:
# copying build\\web back over it can silently revive a stale AssetManifest
# and make newly bundled fonts unreachable at runtime.
#
# The build is WebAssembly-first with a CanvasKit fallback. Copying the whole
# generated `canvaskit` folder needlessly ships debug symbol maps and unused
# experimental/WIMP variants. Retain every file the generated loader can choose
# under this app's supported configuration, and nothing else.
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$outputPath = Join-Path $projectRoot 'build\field-review'

$flutterArgs = @(
    'build', 'web', '--wasm',
    '--base-href', '/field-review/',
    '--output', $outputPath
)
if ($NoPub) {
    $flutterArgs += '--no-pub'
}

& flutter @flutterArgs
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$engineOutputPath = Join-Path $outputPath 'canvaskit'
if (-not (Test-Path $engineOutputPath -PathType Container)) {
    throw "Flutter engine output directory is missing: $engineOutputPath"
}

# The direct output contains a complete engine directory. Keep only the
# runtime variants our bootstrap can choose; each removal is constrained to
# that generated engine directory, never the broader build folder.
$resolvedOutputPath = [IO.Path]::GetFullPath($outputPath)
$resolvedEngineOutputPath = [IO.Path]::GetFullPath($engineOutputPath)
$outputPrefix = "$resolvedOutputPath$([IO.Path]::DirectorySeparatorChar)"
$enginePrefix = "$resolvedEngineOutputPath$([IO.Path]::DirectorySeparatorChar)"
if (-not $resolvedEngineOutputPath.StartsWith(
        $outputPrefix,
        [System.StringComparison]::OrdinalIgnoreCase
    )) {
    throw "Refusing to clear an engine directory outside the field-review artifact: $resolvedEngineOutputPath"
}

$engineRuntimeFiles = @(
    # CanvasKit fallback: general browsers and Chromium's optimized variant.
    'canvaskit\canvaskit.js',
    'canvaskit\canvaskit.wasm',
    'canvaskit\chromium\canvaskit.js',
    'canvaskit\chromium\canvaskit.wasm',
    # Skwasm: standard Wasm-GC path plus the loader's capability fallback.
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
        )) {
        throw "Refusing an engine runtime path outside the generated engine directory: $outputFile"
    }
    if (-not (Test-Path $outputFile -PathType Leaf)) {
        throw "Flutter engine runtime file is missing: $outputFile"
    }
    $allowedEngineFiles += $outputFile
}

$generatedEngineFiles = Get-ChildItem -LiteralPath $resolvedEngineOutputPath -File -Recurse
foreach ($generatedFile in $generatedEngineFiles) {
    $resolvedGeneratedFile = [IO.Path]::GetFullPath($generatedFile.FullName)
    if (-not $resolvedGeneratedFile.StartsWith(
            $enginePrefix,
            [System.StringComparison]::OrdinalIgnoreCase
        )) {
        throw "Refusing to remove an engine file outside the field-review artifact: $resolvedGeneratedFile"
    }
    if ($allowedEngineFiles -notcontains $resolvedGeneratedFile) {
        Remove-Item -LiteralPath $resolvedGeneratedFile -Force
    }
}

Get-ChildItem -LiteralPath $resolvedEngineOutputPath -Directory -Recurse |
    Sort-Object { $_.FullName.Length } -Descending |
    ForEach-Object {
        if (-not (Get-ChildItem -LiteralPath $_.FullName -Force | Select-Object -First 1)) {
            Remove-Item -LiteralPath $_.FullName -Force
        }
    }

$requiredOutputs = @(
    'index.html',
    'main.dart.wasm',
    'assets\FontManifest.json',
    'assets\AssetManifest.bin',
    'assets\AssetManifest.bin.json',
    'assets\assets\yotin-icon.png',
    # The no-JavaScript public shell is route-relative and must not regress
    # into a root-only fallback when the Flutter artifact is deployed alone.
    'assets\assets\wellfi-logo.webp',
    'assets\assets\wellfi-island-r3f-poster.webp',
    'assets\assets\wellfi-internal-ghost.webp',
    # The local Google Fonts variants are a release invariant. Their names
    # match google_fonts' asset lookup contract and are exercised in-browser.
    'assets\assets\fonts\Archivo-Bold.ttf',
    'assets\assets\fonts\SpaceGrotesk-Bold.ttf',
    'assets\assets\fonts\IBMPlexSans-Regular.ttf',
    'assets\assets\fonts\IBMPlexMono-Medium.ttf',
    'assets\assets\fonts\Roboto-Regular.woff2',
    # Flutter's engine appends this path to fontFallbackBaseUrl.
    'assets\assets\fonts\roboto\v32\KFOmCnqEu92Fr1Me4GZLCzYlKw.woff2',
    'canvaskit\canvaskit.wasm',
    'canvaskit\chromium\canvaskit.wasm',
    'canvaskit\skwasm.wasm',
    'canvaskit\skwasm_heavy.wasm',
    'field_review_service_worker.js',
    'icons\Icon-192.png',
    'favicon.png',
    'manifest.json'
)
$missing = $requiredOutputs | Where-Object {
    -not (Test-Path (Join-Path $outputPath $_) -PathType Leaf)
}
if ($missing) {
    throw "Field Review build is incomplete. Missing: $($missing -join ', ')"
}

# A copied file without its AssetManifest entry is invisible to google_fonts.
# Decode Flutter's JSON-wrapped binary manifest and fail the package if any
# local typeface has been omitted from the runtime lookup table.
$assetManifestJsonPath = Join-Path $outputPath 'assets\AssetManifest.bin.json'
$encodedAssetManifest = Get-Content -Raw -LiteralPath $assetManifestJsonPath | ConvertFrom-Json
$decodedAssetManifest = [Text.Encoding]::UTF8.GetString(
    [Convert]::FromBase64String($encodedAssetManifest)
)
$expectedFontManifestEntries = @(
    'assets/fonts/Archivo-Bold.ttf',
    'assets/fonts/SpaceGrotesk-Bold.ttf',
    'assets/fonts/IBMPlexSans-Regular.ttf',
    'assets/fonts/IBMPlexMono-Medium.ttf',
    'assets/fonts/Roboto-Regular.woff2'
)
$missingFontManifestEntries = $expectedFontManifestEntries | Where-Object {
    -not $decodedAssetManifest.Contains($_)
}
if ($missingFontManifestEntries) {
    throw "Field Review AssetManifest omits a local font: $($missingFontManifestEntries -join ', ')"
}

# The Flutter route intentionally packages only assets that are referenced by
# the app or its no-JavaScript fallback. A wildcard `assets/` declaration
# would add static-site OG artwork and unused hero media to the service-worker
# cache without improving the Flutter experience.
$expectedImageAssetEntries = @(
    'assets/yotin-icon.png',
    'assets/wellfi-logo.webp',
    'assets/wellfi-island-r3f-poster.webp',
    'assets/wellfi-internal-ghost.webp',
    'assets/drill-formation.webp',
    'assets/drill-casing.webp'
)
$missingImageAssetEntries = $expectedImageAssetEntries | Where-Object {
    -not $decodedAssetManifest.Contains($_)
}
if ($missingImageAssetEntries) {
    throw "Field Review AssetManifest omits a required image: $($missingImageAssetEntries -join ', ')"
}
$forbiddenUnusedAssetEntries = @(
    'assets/hero-multilateral.webp',
    'assets/hero-sagd-island.webp',
    'assets/og-card-2.jpg',
    'assets/slotted-liner.png',
    'assets/wellfi-island-hero-12s.mp4',
    'assets/wellfi-island-live.webp',
    'assets/yotin-wellfi-og-2026.png'
)
$unexpectedUnusedAssetEntries = $forbiddenUnusedAssetEntries | Where-Object {
    $decodedAssetManifest.Contains($_)
}
if ($unexpectedUnusedAssetEntries) {
    throw "Field Review AssetManifest contains unused static-site media: $($unexpectedUnusedAssetEntries -join ', ')"
}

# The Flutter engine's Roboto fallback is separate from google_fonts' asset
# lookup. Without a declared FontManifest family, Skwasm and CanvasKit fetch
# Roboto from fonts.gstatic.com even when an identically-named asset exists.
$fontManifestPath = Join-Path $outputPath 'assets\FontManifest.json'
$fontManifest = Get-Content -Raw -LiteralPath $fontManifestPath | ConvertFrom-Json
$robotoFamily = $fontManifest | Where-Object { $_.family -eq 'Roboto' } | Select-Object -First 1
if ($null -eq $robotoFamily) {
    throw 'Field Review FontManifest does not register the local Roboto engine fallback.'
}
$robotoAsset = $robotoFamily.fonts | Where-Object {
    $_.asset -eq 'assets/fonts/Roboto-Regular.woff2' -and $_.weight -eq 400
} | Select-Object -First 1
if ($null -eq $robotoAsset) {
    throw 'Field Review FontManifest does not point Roboto regular at the packaged fallback font.'
}

$bootstrapPath = Join-Path $outputPath 'flutter_bootstrap.js'
$bootstrap = Get-Content -Raw $bootstrapPath
if ($bootstrap -notmatch "canvasKitBaseUrl:\s*'canvaskit/'") {
    throw 'Field Review bootstrap does not force the packaged local renderer runtime.'
}
if ($bootstrap -notmatch 'fontFallbackBaseUrl:\s*yotinFontFallbackBaseUrl') {
    throw 'Field Review bootstrap does not force the packaged local engine font fallback.'
}
if ($bootstrap -notmatch 'forceSingleThreadedSkwasm:\s*true') {
    throw 'Field Review bootstrap does not keep Skwasm single-threaded pending COOP/COEP preview validation.'
}

$indexPath = Join-Path $outputPath 'index.html'
$indexDocument = Get-Content -Raw -LiteralPath $indexPath
if ($indexDocument -notmatch '<base href="/field-review/">') {
    throw 'Field Review index does not retain the route-relative base href.'
}
$requiredFallbackFragments = @(
    'id="public-shell"',
    'id="fallback-main"',
    'id="fallback-wellfi"',
    'id="fallback-benefits"',
    'id="fallback-insight"',
    'id="fallback-company"',
    'id="fallback-contact"',
    'assets/assets/yotin-icon.png',
    'assets/assets/wellfi-logo.webp',
    'assets/assets/wellfi-island-r3f-poster.webp',
    'assets/assets/wellfi-internal-ghost.webp'
)
$missingFallbackFragments = $requiredFallbackFragments | Where-Object {
    -not $indexDocument.Contains($_)
}
if ($missingFallbackFragments) {
    throw "Field Review no-JavaScript shell is incomplete: $($missingFallbackFragments -join ', ')"
}
if ($indexDocument -match 'src="/assets/' -or $indexDocument -match "src='/assets/") {
    throw 'Field Review no-JavaScript shell incorrectly relies on root-only asset paths.'
}

# Flutter's generated `flutter_service_worker.js` intentionally unregisters
# itself in 3.44. The Field Review uses a separate custom worker, and only
# downloads its full same-origin package after an explicit operator action.
# Build a content-versioned list from the actual compiled output so a renderer,
# deferred runtime, font, or image cannot silently be missed by offline mode.
$offlineWorkerPath = Join-Path $outputPath 'field_review_service_worker.js'
if (-not (Test-Path -LiteralPath $offlineWorkerPath -PathType Leaf)) {
    throw 'Field Review offline service worker was not copied into the compiled artifact.'
}
$offlineManifestPath = Join-Path $outputPath 'field-review-cache-manifest.json'
$offlineCacheExcludedFiles = @(
    '.last_build_id',
    'flutter_service_worker.js',
    'field_review_service_worker.js',
    'field-review-cache-manifest.json'
)
$offlineCacheFiles = Get-ChildItem -LiteralPath $outputPath -File -Recurse |
    ForEach-Object {
        $relativePath = $_.FullName.Substring($resolvedOutputPath.Length + 1).Replace('\', '/')
        [pscustomobject]@{
            RelativePath = $relativePath
            FullName = $_.FullName
        }
    } |
    Where-Object { $offlineCacheExcludedFiles -notcontains $_.RelativePath } |
    Sort-Object RelativePath

if ($offlineCacheFiles.Count -eq 0) {
    throw 'Field Review offline cache manifest would contain no compiled assets.'
}
$offlineCacheVersionInput = ($offlineCacheFiles | ForEach-Object {
    "$($_.RelativePath):$((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash)"
}) -join "`n"
$offlineCacheVersionBytes = [Text.Encoding]::UTF8.GetBytes($offlineCacheVersionInput)
$offlineCacheHasher = [Security.Cryptography.SHA256]::Create()
try {
    $offlineCacheVersionHash = $offlineCacheHasher.ComputeHash($offlineCacheVersionBytes)
} finally {
    $offlineCacheHasher.Dispose()
}
$offlineCacheVersion = ((($offlineCacheVersionHash | ForEach-Object {
    $_.ToString('x2')
}) -join '')).Substring(0, 20)
$offlineManifest = [ordered]@{
    schema = 1
    version = $offlineCacheVersion
    urls = @($offlineCacheFiles | ForEach-Object { "./$($_.RelativePath)" })
}
[IO.File]::WriteAllText(
    $offlineManifestPath,
    ($offlineManifest | ConvertTo-Json -Depth 4),
    [Text.UTF8Encoding]::new($false)
)

$generatedOfflineManifest = Get-Content -Raw -LiteralPath $offlineManifestPath | ConvertFrom-Json
if ($generatedOfflineManifest.schema -ne 1 -or
    $generatedOfflineManifest.version -ne $offlineCacheVersion -or
    $generatedOfflineManifest.urls.Count -ne $offlineCacheFiles.Count) {
    throw 'Field Review offline cache manifest did not preserve its generated version or complete asset list.'
}
$forbiddenOfflineCacheUrls = @(
    './.last_build_id',
    './flutter_service_worker.js',
    './field_review_service_worker.js',
    './field-review-cache-manifest.json'
)
$includedForbiddenOfflineUrls = $forbiddenOfflineCacheUrls | Where-Object {
    $generatedOfflineManifest.urls -contains $_
}
if ($includedForbiddenOfflineUrls) {
    throw "Field Review offline cache manifest includes a self-updating artifact: $($includedForbiddenOfflineUrls -join ', ')"
}

$forbiddenEngineFiles = Get-ChildItem $outputPath -File -Recurse | Where-Object {
    $_.Name -like '*.symbols' -or
    $_.FullName -match '[\\/]experimental_webparagraph[\\/]' -or
    $_.FullName -match '[\\/]wimp\.(js|wasm)$'
}
if ($forbiddenEngineFiles) {
    throw "Field Review package contains an unused engine artifact: $($forbiddenEngineFiles.FullName -join ', ')"
}

$payloadVerifier = Join-Path $PSScriptRoot 'verify_first_visit_payload.mjs'
if (-not (Test-Path $payloadVerifier -PathType Leaf)) {
    throw "Field Review first-visit payload verifier is missing: $payloadVerifier"
}
& node $payloadVerifier $outputPath
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Output "Field Review build verified: $outputPath"
