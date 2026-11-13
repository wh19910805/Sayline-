# 运营与恢复手册

## 监控

管理端「运营监控」页面会检查：

- 已发布课时的封面、音频、字幕是否完整
- 课时是否缺少可用字幕
- 是否存在重复音频
- 对象存储中是否有未被课程引用的孤立媒体
- 近期失败或部分成功的批量导入
- 最近的管理操作审计记录

页面只做检查和告警，不会自动删除任何媒体。删除孤立对象前应先人工核对。

## 备份

在项目根目录运行：

```powershell
.\scripts\backup.ps1
```

默认把 MySQL 导出和 MinIO 对象归档写入 `backups/`，并生成包含时间、路径和文件大小的清单。

## 恢复演练

先确认恢复文件来自同一时间点，再运行：

```powershell
.\scripts\restore.ps1 `
  -DatabaseFile .\backups\mysql-YYYYMMDD-HHMMSS.sql `
  -ObjectFile .\backups\minio-YYYYMMDD-HHMMSS.tar.gz `
  -ConfirmRestore
```

恢复会覆盖数据库和对象文件。完成后必须检查 `/health`、管理员登录、学习端登录、课时播放和字幕加载。

## 可重复部署检查

```powershell
.\scripts\verify-deploy.ps1
```

脚本会校验 Compose 配置、后端测试、前端测试与构建，最后重新构建并启动容器。若 Maven 镜像证书失败，`backend/Dockerfile` 会回退到官方 Maven Central。

## 密码找回

系统不依赖短信供应商。管理员在「用户管理」生成 30 分钟有效的一次性重置码，学习者通过登录页「忘记密码」使用。重置码只保存哈希，使用后立即失效。
