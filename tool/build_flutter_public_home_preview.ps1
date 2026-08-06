[CmdletBinding()]
param(
    [switch]$NoPub
)

$ErrorActionPreference = 'Stop'

# This is a local staging command only. It builds the isolated Flutter
# public-home candidate and the protected Field Review companion, then places
# only their compiled artifacts into Vercel's generated static output. It does
# not deploy, alter the static-root source, or touch external origin policies.
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$flutterRoot = Join-Path $repoRoot 'yotin_flutter'
$fieldReviewBuildScript = Join-Path $flutterRoot 'tool\build_field_review.ps1'
$publicHomeBuildScript = Join-Path $flutterRoot 'tool\build_public_home_candidate.ps1'
$fieldReviewArtifact = Join-Path $flutterRoot 'build\field-review'
$publicHomeArtifact = Join-Path $flutterRoot 'build\public-home'
$vercelOutput = Join-Path $repoRoot '.vercel\output'
$staticOutput = Join-Path $vercelOutput 'static'
$fieldReviewOutput = Join-Path $staticOutput 'field-review'

function Assert-ContainedPath {
    param(
        [Parameter(Mandatory)][string]$ChildPath,
        [Parameter(Mandatory)][string]$ParentPath,
        [Parameter(Mandatory)][string]$Description
    )

    $resolvedChild = [IO.Path]::GetFullPath($ChildPath)
    $resolvedParent = [IO.Path]::GetFullPath($ParentPath)
    $parentPrefix = "$resolvedParent$([IO.Path]::DirectorySeparatorChar)"
    if (-not $resolvedChild.StartsWith($parentPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to use $Description outside the generated Vercel static output: $resolvedChild"
    }
}

function Invoke-FlutterBuild {
    param(
        [Parameter(Mandatory)][string]$ScriptPath,
        [Parameter(Mandatory)][string]$Description
    )

    if (-not (Test-Path -LiteralPath $ScriptPath -PathType Leaf)) {
        throw "$Description build wrapper is missing: $ScriptPath"
    }

    Push-Location $flutterRoot
    try {
        if ($NoPub) {
            & $ScriptPath -NoPub
        } else {
            & $ScriptPath
        }
        if ($LASTEXITCODE -ne 0) {
            throw "$Description build wrapper failed with exit code $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }
}

Invoke-FlutterBuild -ScriptPath $fieldReviewBuildScript -Description 'Field Review'
Invoke-FlutterBuild -ScriptPath $publicHomeBuildScript -Description 'Public-home candidate'

foreach ($artifact in @($fieldReviewArtifact, $publicHomeArtifact)) {
    if (-not (Test-Path -LiteralPath $artifact -PathType Container)) {
        throw "Verified Flutter artifact is missing: $artifact"
    }
}

# Let Vercel create its normal prebuilt configuration locally. Its static
# source output is then replaced below by an explicitly verified Flutter-only
# release artifact; no Flutter source is copied into the prebuilt directory.
Push-Location $repoRoot
try {
    & vercel build --yes
    if ($LASTEXITCODE -ne 0) {
        throw "Vercel static-site build failed with exit code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $staticOutput -PathType Container)) {
    throw "Vercel static output is missing: $staticOutput"
}
Assert-ContainedPath -ChildPath $fieldReviewOutput -ParentPath $staticOutput -Description 'the Field Review route output'

# `vercel build` owns `.vercel/output/static`; clearing its direct generated
# children is necessary so the candidate is a genuine root replacement inside
# this local prebuilt artifact, rather than a mixture of old static files and
# Flutter files. The containment check keeps this scoped to generated output.
Get-ChildItem -LiteralPath $staticOutput -Force | ForEach-Object {
    $generatedPath = [IO.Path]::GetFullPath($_.FullName)
    Assert-ContainedPath -ChildPath $generatedPath -ParentPath $vercelOutput -Description 'a generated Vercel static file'
    Remove-Item -LiteralPath $generatedPath -Recurse -Force
}

Get-ChildItem -LiteralPath $publicHomeArtifact -Force | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $staticOutput -Recurse -Force
}

New-Item -ItemType Directory -Path $fieldReviewOutput -Force | Out-Null
Get-ChildItem -LiteralPath $fieldReviewArtifact -Force | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $fieldReviewOutput -Recurse -Force
}

$requiredRootFiles = @(
    'index.html',
    'flutter_bootstrap.js',
    'main.dart.wasm',
    'robots.txt',
    'sitemap.xml',
    'assets\yotin-icon.png',
    'assets\yotin-wellfi-og-2026.png',
    'canvaskit\skwasm.wasm'
)
$missingRootFiles = $requiredRootFiles | Where-Object {
    -not (Test-Path -LiteralPath (Join-Path $staticOutput $_) -PathType Leaf)
}
if ($missingRootFiles) {
    throw "Vercel public-home output is incomplete. Missing: $($missingRootFiles -join ', ')"
}

$requiredFieldReviewFiles = @(
    'index.html',
    'flutter_bootstrap.js',
    'field_review_service_worker.js',
    'field-review-cache-manifest.json',
    'main.dart.wasm',
    'assets\FontManifest.json',
    'assets\assets\yotin-icon.png',
    'assets\assets\wellfi-logo.webp',
    'assets\assets\wellfi-island-r3f-poster.webp',
    'assets\assets\wellfi-internal-ghost.webp',
    'assets\assets\fonts\roboto\v32\KFOmCnqEu92Fr1Me4GZLCzYlKw.woff2',
    'canvaskit\skwasm.wasm',
    'canvaskit\canvaskit.wasm'
)
$missingFieldReviewFiles = $requiredFieldReviewFiles | Where-Object {
    -not (Test-Path -LiteralPath (Join-Path $fieldReviewOutput $_) -PathType Leaf)
}
if ($missingFieldReviewFiles) {
    throw "Vercel Field Review output is incomplete. Missing: $($missingFieldReviewFiles -join ', ')"
}

& node (Join-Path $flutterRoot 'tool\verify_public_home_candidate.mjs') $staticOutput
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

# `vercel build` made the static-site routing configuration before staging the
# Flutter root. Preserve its existing headers, but explicitly map the
# companion's file to its clean URL so `/field-review` remains a separate,
# noindex application route in the eventual protected preview.
$configPath = Join-Path $vercelOutput 'config.json'
if (-not (Test-Path -LiteralPath $configPath -PathType Leaf)) {
    throw "Vercel build output configuration is missing: $configPath"
}
$config = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json
if ($null -eq $config.overrides) {
    $config | Add-Member -NotePropertyName 'overrides' -NotePropertyValue ([pscustomobject]@{})
}
$config.overrides | Add-Member -Force -NotePropertyName 'field-review/index.html' -NotePropertyValue ([pscustomobject]@{ path = 'field-review' })
[IO.File]::WriteAllText(
    $configPath,
    ($config | ConvertTo-Json -Depth 100),
    [Text.UTF8Encoding]::new($false)
)

$verifiedConfig = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json
if ($verifiedConfig.overrides.'field-review/index.html'.path -ne 'field-review') {
    throw 'Vercel output does not map field-review/index.html to the clean Field Review route.'
}

Write-Output "Flutter public-home preview output verified: $vercelOutput"
