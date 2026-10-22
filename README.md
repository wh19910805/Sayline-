# Sayline 逐句英语

面向成人自学者的英语听、读、写、说学习应用。仓库包含响应式学习端、`/admin` 管理端和 Spring Boot REST API。

## 已实现

学习端：

- 手机号注册/登录，Access JWT + 可撤销 Refresh Token。
- 首次选择兴趣，首页固定末尾“我喜欢”，支持调序和修改默认 Tab。
- 小红书式瀑布流：手机 2 列、平板 3 列、桌面 4 列；首个卡片为分类方图。
- 听、读、写、说四种学习模式，逐句字幕、跳转、复听、前后 15 秒和 0.75–1.5 倍速。
- 听/读模式 6 秒无操作后隐藏全部播放控件；点击屏幕恢复。
- 写模式使用逐词下划线输入，字母实时绿/红反馈，离开输入区自动提交。
- 说模式使用浏览器录音，只在内存中保留；录音至少 1 秒才推进进度。
- 四模式均达到 100% 并手动确认后完成课程，3 秒倒计时自动进入当前列表下一课。
- 上滑/下滑切换当前 Tab 或收藏列表中的课程。
- 当前模式、句子、播放位置、四模式进度和服务端恢复。
- 周/月学习统计、学习天数/次数/时长、听写正确率、跟读次数。
- 个人资料、头像上传、字幕字号/颜色、四种模式中文翻译开关、兴趣分类设置。

管理端：

- 数据看板。
- 分类新增、编辑、排序、显示/隐藏和删除保护。
- 课程新建、编辑、草稿、发布、下架。
- 封面、音频、SRT/VTT 字幕预签名直传 MinIO/S3。
- 服务端校验双语字幕、时间轴、重叠与文件类型/大小。
- 用户搜索、禁用与恢复；禁用后现有 Token 和刷新会话失效。

## 技术架构

- 前端：Vue 3、TypeScript、Vite、Pinia、Vue Router。
- 后端：Java 21、Spring Boot 3.5、Spring Security、JPA、Flyway。
- 数据库：MySQL 8。
- 媒体：MinIO/S3，浏览器直传，私有桶 + 短时签名读取 URL。
- API：REST `/api/v1`，学习端、Web 管理端和未来小程序/App 共用。
- 部署：Docker Compose + Nginx。

关键目录：

```text
backend/       Spring Boot API
frontend/      Vue 学习端与管理端
deploy/nginx/  统一入口和 API 代理
designs/       已批准的品牌、设计系统与交互原型
docs/          产品规格与实施计划
```

## Docker 启动

1. 复制配置：

   ```powershell
   Copy-Item .env.example .env
   ```

2. 修改 `.env` 中的密码和 `JWT_SECRET`。首次管理员由 `ADMIN_PHONE` 和 `ADMIN_PASSWORD` 自动创建。
3. 构建并启动：

   ```powershell
   docker compose up --build
   ```

- 学习端：`http://localhost:8088`
- 管理端：`http://localhost:8088/admin`
- API：`http://localhost:8088/api/v1`
- MinIO 控制台：`http://localhost:9001`
- MySQL 宿主机端口：`3307`

开发环境可设置 `APP_SEED_DEMO=true`，首次启动会生成 3 个分类和 5 门示例课程。正式环境保持 `false`。

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

本地 API 地址为 `http://localhost:8080`，Vite 开发服务器为 `http://localhost:5173`。

如果暂时没有 Docker，可使用 H2 预览数据库：

```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=preview"

cd ..\frontend
pnpm dev
```

预览模式下前端需将代理目标改为 `8081`，或显式设置：

```powershell
$env:VITE_API_BASE_URL='http://localhost:8081'
pnpm dev
```

## 验证

```powershell
cd backend
mvn test

cd ..\frontend
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

## API 认证

- Access Token 有效期 15 分钟，仅保存在前端内存。
- Refresh Token 有效期 30 天，Web 端使用 HttpOnly Cookie。
- 原生客户端设置 `X-Client-Type: native`，注册/登录/刷新响应会返回 Refresh Token JSON。
- 小程序、App 或第三方客户端只依赖 `/api/v1` DTO，不需要复用 Vue 实现。

## 首版边界

- 不收费，不包含订单、支付和财务模块。
- 不含短信验证码、密码找回、评论、分享和 AI 发音评分。
- 录音不上传服务器。
- 不提供完整音频离线下载。
- 微信小程序与原生 App 作为同一 API 的后续客户端实现。
