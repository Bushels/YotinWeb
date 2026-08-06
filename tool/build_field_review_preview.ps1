[CmdletBinding()]
param(
    [switch]$NoPub
)

$ErrorActionPreference = 'Stop'

# Vercel's static-project builder does not include a Flutter SDK. Build the
# verified Flutter route locally, let `vercel build` create the canonical
# static-site output/configuration, then inject only the compiled route into
# that prebuilt output. `vercel deploy --prebuilt` can upload the result
# without doing a remote Flutter build or exposing yotin_flutter source files.
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$flutterRoot = Join-Path $repoRoot 'yotin_flutter'
$flutterBuildScript = Join-Path $flutterRoot 'tool\build_field_review.ps1'
$flutterArtifact = Join-Path $flutterRoot 'build\field-review'
$vercelOutput = Join-Path $repoRoot '.vercel\output'
$staticOutput = Join-Path $vercelOutput 'static'
$routeOutput = Join-Path $staticOutput 'field-review'

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

if (-not (Test-Path -LiteralPath $flutterBuildScript -PathType Leaf)) {
    throw "Flutter release wrapper is missing: $flutterBuildScript"
}

Push-Location $flutterRoot
try {
    if ($NoPub) {
        & $flutterBuildScript -NoPub
    } else {
        & $flutterBuildScript
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Flutter release wrapper failed with exit code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $flutterArtifact -PathType Container)) {
    throw "Flutter release artifact is missing: $flutterArtifact"
}

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
Assert-ContainedPath -ChildPath $routeOutput -ParentPath $staticOutput -Description 'the Field Review route output'

if (Test-Path -LiteralPath $routeOutput) {
    Remove-Item -LiteralPath $routeOutput -Recurse -Force
}
New-Item -ItemType Directory -Path $routeOutput -Force | Out-Null
Get-ChildItem -LiteralPath $flutterArtifact -Force | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $routeOutput -Recurse -Force
}

$requiredRouteFiles = @(
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
$missingRouteFiles = $requiredRouteFiles | Where-Object {
    -not (Test-Path -LiteralPath (Join-Path $routeOutput $_) -PathType Leaf)
}
if ($missingRouteFiles) {
    throw "Vercel Field Review output is incomplete. Missing: $($missingRouteFiles -join ', ')"
}

# `vercel build` generated the static-site configuration before the route was
# copied. Add the equivalent clean URL mapping without changing any existing
# root route/headers. The global trailing-slash redirect makes `/field-review`
# canonical while Flutter's base tag remains `/field-review/` for its assets.
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

Write-Output "Vercel Field Review preview output verified: $vercelOutput"
