param(
    [string]$OutputDir = (Join-Path (Get-Location) "backups")
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dbFile = Join-Path $OutputDir "mysql-$stamp.sql"
$objectFile = Join-Path $OutputDir "minio-$stamp.tar.gz"

docker compose ps --status running | Out-Null
docker compose exec -T mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines "$MYSQL_DATABASE"' |
    Set-Content -Path $dbFile -Encoding utf8
docker compose exec -T minio tar czf - -C /data . |
    Set-Content -Path $objectFile -AsByteStream

$manifest = @{
    createdAt = (Get-Date).ToString("o")
    database = (Resolve-Path $dbFile).Path
    objects = (Resolve-Path $objectFile).Path
    databaseBytes = (Get-Item $dbFile).Length
    objectBytes = (Get-Item $objectFile).Length
}
$manifest | ConvertTo-Json | Set-Content (Join-Path $OutputDir "manifest-$stamp.json") -Encoding utf8
Write-Host "Backup complete: $OutputDir"
