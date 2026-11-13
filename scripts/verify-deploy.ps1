$ErrorActionPreference = "Stop"

docker compose config --quiet
Push-Location backend
try {
    mvn -q test
}
finally {
    Pop-Location
}
Push-Location frontend
try {
    pnpm test
    pnpm build
}
finally {
    Pop-Location
}
docker compose build
docker compose up -d
docker compose ps
