param()
$ErrorActionPreference = 'Continue'
$base = 'http://localhost:3000'
$results = @()

function Test-Endpoint {
    param([string]$Name, [string]$Url, [string]$Method = 'GET', [string]$Body = $null)
    try {
        $params = @{ Uri = $Url; Method = $Method; TimeoutSec = 120; UseBasicParsing = $true }
        if ($Body) { $params['Body'] = $Body; $params['ContentType'] = 'application/json' }
        $r = Invoke-WebRequest @params
        return [pscustomobject]@{ Test = $Name; Status = $r.StatusCode; Bytes = $r.RawContentLength; OK = ($r.StatusCode -eq 200); Note = '' }
    } catch {
        return [pscustomobject]@{ Test = $Name; Status = 'ERR'; Bytes = 0; OK = $false; Note = $_.Exception.Message }
    }
}

$pages = @('/', '/copilot', '/executive', '/autonomous', '/replay', '/analyzer', '/chaos', '/intelligence', '/incidents', '/recovery', '/security', '/reports', '/settings')
foreach ($p in $pages) {
    $results += Test-Endpoint -Name "GET $p" -Url "$base$p"
}

$results += Test-Endpoint -Name 'POST /api/analyze' -Url "$base/api/analyze" -Method 'POST' -Body (@{ type = 'api_failure'; title = 'Smoke'; service = 'payments-gateway'; severity = 'high' } | ConvertTo-Json)
$results += Test-Endpoint -Name 'POST /api/agent' -Url "$base/api/agent" -Method 'POST' -Body (@{ type = 'database_issue'; title = 'DB lag'; service = 'customer-db'; severity = 'high'; timestamp = (Get-Date).ToString('o'); metrics = @{ cpu = 70; memory = 65; network = 40; database = 88; api = 72 } } | ConvertTo-Json)
$results += Test-Endpoint -Name 'POST cyber:domain' -Url "$base/api/cyber/analyze" -Method 'POST' -Body (@{ raw = 'evil-bank-login.example.com'; disabled = @{} } | ConvertTo-Json)
$results += Test-Endpoint -Name 'POST cyber:log' -Url "$base/api/cyber/analyze" -Method 'POST' -Body (@{ raw = '2026-01-12 sshd: Failed password for root from 198.51.100.7'; disabled = @{} } | ConvertTo-Json)
$results += Test-Endpoint -Name 'POST cyber:alert' -Url "$base/api/cyber/analyze" -Method 'POST' -Body (@{ raw = '{"alert":"C2 beacon","endpoint":"laptop-42","destination":"185.234.219.10"}'; disabled = @{} } | ConvertTo-Json)
$results += Test-Endpoint -Name 'POST cyber:DEGRADED-ALL' -Url "$base/api/cyber/analyze" -Method 'POST' -Body (@{ raw = 'evil-bank-login.example.com'; disabled = @{ llm = $true; vector_db = $true; scanner = $true; threat_intel = $true } } | ConvertTo-Json)
$results += Test-Endpoint -Name 'POST cyber:ip' -Url "$base/api/cyber/analyze" -Method 'POST' -Body (@{ raw = '185.234.219.10'; disabled = @{} } | ConvertTo-Json)
$results += Test-Endpoint -Name 'POST cyber:empty' -Url "$base/api/cyber/analyze" -Method 'POST' -Body (@{ raw = ''; disabled = @{} } | ConvertTo-Json)

$results | Format-Table -AutoSize
$pass = ($results | Where-Object { $_.OK }).Count
"PASS: $pass / $($results.Count)"
