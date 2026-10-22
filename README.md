# Sayline English

Sayline 是一个面向成人自学者的英语听、读、写、说学习应用。仓库包含响应式 Vue 学习端、`/admin` 管理端和 Spring Boot REST API。

## 本地开发

1. 复制 `.env.example` 为 `.env` 并替换密钥。
2. 运行 `docker compose up -d mysql minio minio-init`。
3. 启动后端：`cd backend && mvn spring-boot:run`。
4. 启动前端：`cd frontend && pnpm install && pnpm dev`。

- 学习端：`http://localhost:5173`
- 管理端：`http://localhost:5173/admin`
- API：`http://localhost:8080/api/v1`
- 健康检查：`http://localhost:8080/health`
- MinIO 控制台：`http://localhost:9001`

## 验证

```powershell
cd backend
mvn test

cd ..\frontend
pnpm test
pnpm build
```
