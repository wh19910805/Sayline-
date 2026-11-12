# Sayline 逐句英语

面向成人自学者的英语听、读、写、说学习应用。仓库包含移动优先的学习端、`/admin` 管理端和 Spring Boot REST API。

## 当前功能

学习端：

- 手机号注册与登录，Access JWT + 可撤销 Refresh Token。
- 首次登录选择兴趣分类，支持排序和设置默认分类。
- 首页 3D 书架：按分类浏览书籍、搜索书籍、收藏书籍。
- 最近学习：继续播放最近课程，查看最近学习列表。
- 书籍详情与课时列表：展示书籍封面、学习进度、收藏状态和全部课时。
- 听、读、写、说四种学习模式，支持逐句字幕、跳转、复听、前后 15 秒和 0.75–1.5 倍速。
- 听/读模式 6 秒无操作后隐藏播放控件，点击屏幕恢复。
- 写模式逐词输入，字母实时正确/错误反馈，离开输入区自动提交。
- 说模式使用浏览器录音，录音只保留在内存中，不上传服务器。
- 当前模式、句子、播放位置、四模式进度可从服务端恢复。
- 周/月学习统计：学习天数、次数、时长、听写正确率和跟读次数。
- 个人资料、头像、字幕字号/颜色、模式翻译开关和兴趣分类设置。
- 背景色随当前书籍封面主色变化，页面、安全区和状态栏使用同一主题色。
- 可安装 PWA；生产环境注册 Service Worker，为同源 GET 请求提供网络优先的缓存回退。

管理端：

- 数据看板。
- 分类新增、编辑、排序、显示/隐藏和删除保护。
- 书籍新增、编辑、排序、显示/隐藏和删除保护。
- 课时课程新建、编辑、草稿、发布和下架。
- 书籍封面、课程封面、音频、SRT/VTT 字幕预签名直传 MinIO/S3。
- 服务端校验双语字幕、时间轴、重叠与文件类型/大小。
- 生成封面缩略图并提取封面主色、辅助色和书脊颜色。
- 用户搜索、禁用与恢复；禁用后现有 Token 和刷新会话失效。

## 技术架构

- 前端：Vue 3、TypeScript、Vite、Pinia、Vue Router、Remix Icon。
- 后端：Java 21、Spring Boot 3.5、Spring Security、JPA、Flyway。
- 数据库：MySQL 8。
- 媒体：MinIO/S3，私有桶 + 短时签名读取 URL。
- API：REST `/api/v1`，学习端、管理端和后续原生客户端共用。
- PWA：独立 manifest、应用图标和 Service Worker。
- 部署：Docker Compose + Nginx。

关键目录：

```text
backend/       Spring Boot API、数据库迁移和测试
frontend/      Vue 学习端、管理端、PWA 与浏览器测试
deploy/nginx/  统一入口和 API 代理
designs/       品牌、设计系统和交互原型
docs/          产品规格与实施计划
```

## 主要页面

```text
/                    3D 书架首页
/learn/:bookId       书籍课时列表
/learn/:bookId/:id   学习播放器
/recent              最近学习
/me                  学习统计与个人中心
/me/profile          个人资料设置
/me/learning         学习偏好设置
/admin               管理端
```

## Docker 启动

1. 复制配置：

   ```powershell
   Copy-Item .env.example .env
   ```

2. 修改 `.env` 中的密码、`JWT_SECRET`、管理员账号和存储配置。
3. 构建并启动：

   ```powershell
   docker compose up --build
   ```

默认访问地址：

- 学习端：`http://localhost:8088`
- 管理端：`http://localhost:8088/admin`
- API：`http://localhost:8088/api/v1`
- MinIO 控制台：`http://localhost:9001`
- MySQL 宿主机端口：`3307`

首次启动时，`ADMIN_PHONE` 和 `ADMIN_PASSWORD` 对应的管理员账号会自动创建。开发环境可将 `APP_SEED_DEMO` 设为 `true` 生成示例数据；正式环境应保持 `false`。

## 本地开发

基础设施：

```powershell
docker compose up -d mysql minio minio-init
```

后端：

```powershell
cd backend
mvn spring-boot:run
```

前端：

```powershell
cd frontend
pnpm install
pnpm dev
```

本地地址：

- 前端 Vite：`http://127.0.0.1:16666`
- 后端 API：`http://localhost:8080`
- 健康检查：`http://localhost:8080/health`

无 Docker 时可使用 H2 预览配置：

```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=preview"

cd ..\frontend
$env:VITE_API_BASE_URL='http://localhost:8081'
pnpm dev
```

## 环境变量

主要变量见 `.env.example`：

- 数据库：`MYSQL_*`、`DB_URL`、`DB_USERNAME`、`DB_PASSWORD`、`DB_POOL_SIZE`
- 认证：`JWT_SECRET`、`FRONTEND_ORIGIN`、`ADMIN_PHONE`、`ADMIN_PASSWORD`
- 存储：`MINIO_*`、`STORAGE_*`
- 示例数据：`APP_SEED_DEMO`

不要将真实密码、JWT 密钥或生产存储凭据提交到仓库。

## API 概况

认证：

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET  /api/v1/auth/me`

学习端：

- `GET  /api/v1/categories`
- `GET  /api/v1/books`
- `GET  /api/v1/books/{bookId}`
- `GET  /api/v1/favorite-books`
- `GET  /api/v1/recent-lessons`
- `GET  /api/v1/courses`
- `GET  /api/v1/courses/{courseId}`
- `GET  /api/v1/learning/courses/{courseId}`
- `POST /api/v1/learning/courses/{courseId}/actions`
- `POST /api/v1/learning/courses/{courseId}/position`
- `POST /api/v1/learning/courses/{courseId}/confirm`
- `GET  /api/v1/learning/stats`

管理端接口统一位于 `/api/v1/admin`，覆盖看板、分类、书籍、课程和用户管理。

## 认证说明

- Access Token 有效期 15 分钟，仅保存在前端内存中。
- Refresh Token 有效期 30 天，Web 端使用 HttpOnly Cookie。
- 原生客户端设置 `X-Client-Type: native` 后，注册、登录和刷新响应会返回 Refresh Token JSON。
- 第三方客户端只依赖 `/api/v1` DTO，不需要复用 Vue 实现。

## 数据库迁移

Flyway 迁移位于 `backend/src/main/resources/db/migration/`：

- `V1` 初始用户、分类、课程、字幕和学习记录。
- `V2` 默认开启中文翻译。
- `V3` 增加播放速度设置。
- `V4` 增加书籍、书籍收藏和课程与书籍的关联。
- `V5` 增加封面缩略图和书脊颜色。

## 验证

后端：

```powershell
cd backend
mvn test
```

前端：

```powershell
cd frontend
pnpm test
pnpm build
pnpm test:e2e
```

视觉与响应式检查：

```powershell
cd frontend
pnpm dev
node scripts/visual-check.mjs
```

生成文件位于 `frontend/artifacts/visual/`。

前后端均已运行时，可执行完整浏览器流程：

```powershell
cd frontend
node scripts/real-flow-check.mjs
```

## 首版边界

- 不收费，不包含订单、支付和财务模块。
- 不含短信验证码、密码找回、评论、分享和 AI 发音评分。
- 录音不上传服务器。
- PWA 缓存不是完整离线课程包，音频和媒体仍依赖网络。
- 微信小程序与原生 App 作为同一 API 的后续客户端实现。
