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

$minioContainer = docker compose ps -q minio
if (-not $minioContainer) {
    throw "MinIO container is not running."
}
$minioVolume = docker inspect $minioContainer --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}'
if ([string]::IsNullOrWhiteSpace($minioVolume)) {
    throw "MinIO data volume was not found."
}

if (Test-Path -LiteralPath $objectFile) {
    Remove-Item -LiteralPath $objectFile -Force
}
$backupDirectory = (Resolve-Path $OutputDir).Path
$archiveName = Split-Path $objectFile -Leaf
docker run --rm --entrypoint sh `
    -v "${minioVolume}:/data:ro" `
    -v "${backupDirectory}:/backup" `
    nginx:1.27-alpine `
    -c "tar czf /backup/$archiveName -C /data ."
if ($LASTEXITCODE -ne 0) {
    throw "Failed to archive MinIO data."
}

$manifest = @{
    createdAt = (Get-Date).ToString("o")
    database = (Resolve-Path $dbFile).Path
    objects = (Resolve-Path $objectFile).Path
    databaseBytes = (Get-Item $dbFile).Length
    objectBytes = (Get-Item $objectFile).Length
}
$manifest | ConvertTo-Json | Set-Content (Join-Path $OutputDir "manifest-$stamp.json") -Encoding utf8
Write-Host "Backup complete: $OutputDir"
