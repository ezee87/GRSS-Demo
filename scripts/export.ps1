param(
    [string]$SourceUrl = 'http://grss-guati-rojo-abogados-sc.local',
    [string]$WordPressRoot = 'C:\Users\micel\Local Sites\grss-guati-rojo-abogados-sc\app\public',
    [string]$Destination = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$routes = @(
    '/',
    '/la-firma/',
    '/areas-de-practica/',
    '/cursos/',
    '/oportunidades/',
    '/contacto/',
    '/aviso-de-privacidad/',
    '/areas-practica/',
    '/areas-practica/constitucional-y-amparo/',
    '/areas-practica/civil-y-mercantil/',
    '/areas-practica/corporativo/',
    '/areas-practica/regulatorio/',
    '/areas-practica/recuperacion-de-cartera/',
    '/areas-practica/familiar/'
)

function Convert-GrssHtml([string]$html) {
    # Preserve the profile JSON consumed by the existing modal controller, but remove
    # WordPress runtime scripts (Interactivity API, emoji loader and speculation rules).
    $html = [regex]::Replace(
        $html,
        '<script(?![^>]*data-team-profile-data)[^>]*>[\s\S]*?</script>',
        '',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
    $html = [regex]::Replace($html, '<link[^>]+(?:wp-json|xmlrpc\.php|/feed/|comments/feed|oembed|api\.w\.org|modulepreload)[^>]*>\s*', '', 'IgnoreCase')
    $html = [regex]::Replace($html, '<meta name=["'']generator["''][^>]*>\s*', '', 'IgnoreCase')
    $html = $html.Replace($SourceUrl, '')
    $escapedOrigin = $SourceUrl.Replace('/', '\/')
    $html = $html.Replace($escapedOrigin, '')
    $scripts = @'
<script src="/assets/js/static-navigation.js" defer></script>
<script type="module" src="/wp-content/themes/grss-theme/dist/assets/main-DYBDM6_z.js"></script>
'@
    $html = $html.Replace('</body>', "$scripts`n</body>")
    return $html
}

foreach ($route in $routes) {
    $response = Invoke-WebRequest -Uri ($SourceUrl + $route) -UseBasicParsing -TimeoutSec 30
    if ([int]$response.StatusCode -ne 200) {
        throw "No se pudo exportar ${route}: HTTP $($response.StatusCode)"
    }
    $relative = $route.Trim('/')
    $targetDirectory = if ($relative) { Join-Path $Destination ($relative.Replace('/', '\')) } else { $Destination }
    New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null
    [System.IO.File]::WriteAllText(
        (Join-Path $targetDirectory 'index.html'),
        (Convert-GrssHtml $response.Content),
        [System.Text.UTF8Encoding]::new($false)
    )
}

try {
    Invoke-WebRequest -Uri ($SourceUrl + '/ruta-inexistente-grss-demo/') -UseBasicParsing -TimeoutSec 30 | Out-Null
    throw 'La ruta de prueba 404 respondió como página válida.'
} catch [System.Net.WebException] {
    $response = $_.Exception.Response
    $reader = [System.IO.StreamReader]::new($response.GetResponseStream())
    $notFoundHtml = $reader.ReadToEnd()
    $reader.Dispose()
    [System.IO.File]::WriteAllText(
        (Join-Path $Destination '404.html'),
        (Convert-GrssHtml $notFoundHtml),
        [System.Text.UTF8Encoding]::new($false)
    )
}

$copyMap = @(
    @{ Source = Join-Path $WordPressRoot 'wp-content\themes\grss-theme\dist'; Target = Join-Path $Destination 'wp-content\themes\grss-theme\dist' },
    @{ Source = Join-Path $WordPressRoot 'wp-content\themes\grss-theme\assets\images'; Target = Join-Path $Destination 'wp-content\themes\grss-theme\assets\images' },
    @{ Source = Join-Path $WordPressRoot 'wp-content\uploads\2026\10'; Target = Join-Path $Destination 'wp-content\uploads\2026\10' }
)
foreach ($item in $copyMap) {
    New-Item -ItemType Directory -Force -Path $item.Target | Out-Null
    Copy-Item -Path (Join-Path $item.Source '*') -Destination $item.Target -Recurse -Force
}

# Keep the deployment compact: remove copied media that is not referenced by any
# exported HTML/CSS/JS file. The source WordPress files are never touched.
$publicContent = ''
Get-ChildItem -LiteralPath $Destination -Recurse -File | Where-Object {
    $_.Extension -in @('.html', '.css', '.js')
} | ForEach-Object {
    $publicContent += [System.IO.File]::ReadAllText($_.FullName)
}
$assetRoot = Join-Path $Destination 'wp-content'
Get-ChildItem -LiteralPath $assetRoot -Recurse -File | ForEach-Object {
    if ($_.Name -eq 'manifest.json') { return }
    $relativeUrl = '/' + $_.FullName.Substring($Destination.Length + 1).Replace('\', '/')
    $referencedByRelativeCss = $_.Name -eq 'hero-1-mobile-Crtg8t-7.png' -and $publicContent.Contains($_.Name)
    if (-not $publicContent.Contains($relativeUrl) -and -not $referencedByRelativeCss) {
        [System.IO.File]::Delete($_.FullName)
    }
}

Write-Output "Exportación completada: $Destination"
