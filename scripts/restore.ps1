param(
    [Parameter(Mandatory = $true)]
    [string]$DatabaseFile,
    [Parameter(Mandatory = $true)]
    [string]$ObjectFile,
    [switch]$ConfirmRestore
)

$ErrorActionPreference = "Stop"
$dbPath = (Resolve-Path $DatabaseFile).Path
$objectPath = (Resolve-Path $ObjectFile).Path

if (-not $ConfirmRestore) {
    throw "Restore is destructive. Re-run with -ConfirmRestore after verifying both files."
}

Write-Host "Restoring MySQL from $dbPath"
Get-Content -Raw -Path $dbPath |
    docker compose exec -T mysql sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'

Write-Host "Restoring object storage from $objectPath"
Get-Content -Path $objectPath -AsByteStream |
    docker compose exec -T minio tar xzf - -C /data

Write-Host "Restore finished. Run the content health check and smoke-test login/playback."
