param(
    [int]$Port = 5210,
    [int]$MaxAttempts = 60
)

Write-Host "Cekam na API (port $Port)..."

for ($i = 0; $i -lt $MaxAttempts; $i++) {
    try {
        $client = [System.Net.Sockets.TcpClient]::new()
        $client.Connect('localhost', $Port)
        $client.Close()
        Write-Host "API je pripravene."
        exit 0
    } catch {
        Start-Sleep -Seconds 1
    }
}

Write-Host "Timeout - API nespusteno"
exit 1
