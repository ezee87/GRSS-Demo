param(
    [string]$Root = (Split-Path -Parent $PSScriptRoot),
    [string]$BaseUrl = 'http://127.0.0.1:4173'
)

$ErrorActionPreference = 'Stop'
$routes = @('/', '/la-firma/', '/areas-de-practica/', '/cursos/', '/oportunidades/', '/contacto/', '/aviso-de-privacidad/', '/areas-practica/', '/areas-practica/constitucional-y-amparo/', '/areas-practica/civil-y-mercantil/', '/areas-practica/corporativo/', '/areas-practica/regulatorio/', '/areas-practica/recuperacion-de-cartera/', '/areas-practica/familiar/')
$failures = [System.Collections.Generic.List[string]]::new()

$publicFiles = Get-ChildItem -LiteralPath $Root -Recurse -File | Where-Object { $_.Extension -in @('.html', '.css', '.js', '.json') -and $_.FullName -notlike "$PSScriptRoot*" }
$localReferences = $publicFiles | Select-String -SimpleMatch 'grss-guati-rojo-abogados-sc.local'
if ($localReferences) { $failures.Add("Se encontraron $($localReferences.Count) referencias al dominio .local") }

$backendReferences = $publicFiles | Where-Object { $_.Extension -in @('.html', '.js') } | Select-String -Pattern 'wp-json|xmlrpc\.php|admin-ajax\.php|wp-admin/'
if ($backendReferences) { $failures.Add("Se encontraron $($backendReferences.Count) referencias al backend") }

foreach ($route in $routes) {
    try {
        $response = Invoke-WebRequest -Uri ($BaseUrl + $route) -UseBasicParsing -TimeoutSec 10
        if ([int]$response.StatusCode -ne 200) { $failures.Add("$route devolvió HTTP $($response.StatusCode)") }
    } catch { $failures.Add("$route no respondió: $($_.Exception.Message)") }
}

try {
    Invoke-WebRequest -Uri ($BaseUrl + '/ruta-que-no-existe/') -UseBasicParsing -TimeoutSec 10 | Out-Null
    $failures.Add('Una ruta desconocida no devolvió 404')
} catch {
    $status = [int]$_.Exception.Response.StatusCode
    if ($status -ne 404) { $failures.Add("La ruta desconocida devolvió HTTP $status") }
}

if ($failures.Count) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}
Write-Output 'Validación estructural y HTTP superada.'
