# CloudGramStore

**本项目是使用AI修改和维护的项目，如需帮助，请查看Fork上游联系原维护者**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)
[![Telegram Bot API](https://img.shields.io/badge/Telegram-Bot%20API-blue.svg)](https://core.telegram.org/bots/api)


CloudGramStore 是一个基于 Cloudflare Workers 和 Telegram Bot API 的云文件管理系统，通过创新的方式将 Telegram 作为文件存储后端，实现了无需传统云存储服务的个人云盘解决方案。系统支持 文件上传、下载、重命名、删除、目录管理等功能，适合个人使用。

![login-image](./images/login-image.png)

![manage-image](./images/image.png)

## ✨ 功能特性

- **用户认证**：基于 JWT 的安全认证系统
- **文件管理**：
  - 文件上传（支持拖拽上传和多文件选择）
  - **文件夹上传**（支持桌面和移动端，保持目录结构）
  - 文件下载、预览
  - 文件重命名和删除
  - 大文件分片处理（突破 Telegram 单文件限制）
- **文件夹管理**：
  - 多级文件夹创建和导航
  - 面包屑路径导航
  - 文件夹重命名和删除
- **批量操作**（新增）：
  - **剪切/复制/粘贴**：支持跨目录移动和复制文件/文件夹
  - **批量选择**：多选模式下支持批量操作
  - **批量移动/复制/删除**：一次操作多个项目
  - **文件夹上传**：拖拽整个文件夹，保持目录结构
- **用户体验**：
  - 拖拽上传、进度反馈
  - 全局加载状态显示
  - 操作结果通知（成功/失败/详情）
  - 响应式美观 UI，适配移动设备
  - 键盘快捷键支持（Ctrl+X/C/V, B, Delete等）

## 🚀 快速开始

### 前置条件

- [Node.js](https://nodejs.org/) (v16 或更高版本)
- [npm](https://www.npmjs.com/) 或 [yarn](https://yarnpkg.com/)
- [Cloudflare 账户](https://dash.cloudflare.com/sign-up)
- [Telegram Bot](https://core.telegram.org/bots#how-do-i-create-a-bot) 和
- 一个用于存储文件的 Telegram 群组/频道,把机器人加入到频道并将其作为管理员

### 安装

1. **克隆仓库**

   ```sh
   git clone https://github.com/yourusername/cloud-gram-store.git
   cd cloud-gram-store
   ```

2. **安装依赖**

   ```sh
   npm install
   ```

3. **配置环境**

   3.1. 复制示例配置文件并进行编辑：

   ```sh
   cp wrangler.jsonc.example wrangler.jsonc
   ```

   3.2. 编辑 `wrangler.jsonc` 文件，填入以下信息：
   - Telegram Bot Token
   - Telegram Chat ID
   - 管理员用户名和密码
		- 本项目只支持单用户，没有用户注册功能
   - JWT 密钥

4. **初始化数据库**

   ```sh
   npx wrangler d1 create cloud-gram-store-db
   ```

   将生成的数据库 ID 添加到 `wrangler.jsonc` 文件中。

   ```sh
	# 本地执行建表语句
   npx wrangler d1 execute cloud-gram-store-db --file=schema.sql

	# 远端执行建表语句
   npx wrangler d1 execute cloud-gram-store-db --file=schema.sql --remote
   ```

### 本地开发

1. **启动开发服务器**

   ```sh
   npm run dev
   # 或
   npx wrangler dev
   ```

2. **访问前端**

   打开浏览器访问 http://localhost:8787

### 部署到 Cloudflare Workers

```sh
npm run deploy
# 或
npx wrangler deploy
```

## 📂 项目结构

```
├── public/           # 前端静态资源
│   ├── css/          # 样式文件
│   ├── js/           # JavaScript 文件
│   │   └── modules/  # JS 模块
│   └── index.html    # 主页面
├── src/              # 后端服务
│   ├── services/     # 核心服务
│   │   ├── auth.js   # 认证服务
│   │   ├── database.js # 数据库服务
│   │   ├── file.js   # 文件服务
│   │   └── telegram.js # Telegram 服务
│   ├── utils/        # 工具函数
│   │   ├── response.js # 响应处理
│   │   └── router.js # 路由处理
│   └── index.js      # 主入口
├── schema.sql        # 数据库结构
├── wrangler.jsonc    # Cloudflare 配置
└── package.json      # 项目依赖
```
### 基本操作回顾
- **登录**：使用管理员账号密码登录
- **浏览**：点击文件夹进入，双击或点击面包屑导航
- **上传**：点击"上传文件"按钮或拖拽文件到页面
- **下载**：点击文件旁边的"下载"按钮
- **重命名**：点击项目旁边的"重命名"按钮
- **删除**：点击项目旁边的"删除"按钮

## ✨ 新增功能使用指南

### 1. 批量操作模式

#### 进入批量模式
- **方法1**：点击工具栏的"批量操作"按钮
- **方法2**：按键盘上的 `B` 键
- **方法3**：在批量工具栏点击"退出"可返回正常模式

#### 选择项目
- **单个选择**：点击项目前的复选框
- **多个选择**：依次点击多个项目的复选框
- **全选**：按 `Ctrl+A` 或点击"全选"按钮
- **清空选择**：按 `ESC` 或点击"清空"按钮

#### 批量操作
- **剪切**：选择项目后，按 `Ctrl+X` 或点击"剪切"按钮
- **复制**：选择项目后，按 `Ctrl+C` 或点击"复制"按钮
- **移动**：选择项目后，点击"移动"按钮（移动到当前目录）
- **删除**：选择项目后，按 `Delete` 键或点击"删除"按钮

### 2. 剪切/复制/粘贴

#### 剪切操作
1. 进入批量模式
2. 选择要移动的项目
3. 按 `Ctrl+X` 或点击"剪切"按钮
4. 导航到目标文件夹
5. 按 `Ctrl+V` 或点击"粘贴"按钮

#### 复制操作
1. 进入批量模式
2. 选择要复制的项目
3. 按 `Ctrl+C` 或点击"复制"按钮
4. 导航到目标文件夹
5. 按 `Ctrl+V` 或点击"粘贴"按钮

#### 剪切板管理
- 剪切板内容会显示在"粘贴"按钮上
- 按 `ESC` 键可清空剪切板
- 剪切板内容在页面刷新后仍然有效

### 3. 文件夹上传

#### 拖拽上传
1. 在本地文件管理器中选择文件夹
2. 将文件夹拖拽到网页的文件列表区域
3. 系统自动识别文件夹结构并上传
4. 查看上传进度和结果

#### 注意事项
- 支持嵌套文件夹（多级目录）
- 自动保持原始目录结构
- 大文件会自动分片处理
- 上传过程中请勿关闭页面

## 🔧 快捷键速查表

### 基础操作
| 快捷键 | 功能 |
|--------|------|
| `Ctrl+U` | 上传文件 |
| `Ctrl+N` | 新建文件夹 |
| `F5` | 刷新当前目录 |

### 批量操作
| 快捷键 | 功能 |
|--------|------|
| `B` | 切换批量模式 |
| `Ctrl+A` | 全选当前目录 |
| `Delete` | 删除选中项目 |
| `Ctrl+X` | 剪切选中项目 |
| `Ctrl+C` | 复制选中项目 |
| `Ctrl+V` | 粘贴剪切板内容 |
| `ESC` | 退出批量模式/清空剪切板 |

## 📋 操作示例

### 示例1：整理文件
**场景**：将多个PDF文件移动到"文档"文件夹

**步骤**：
1. 在根目录按 `B` 进入批量模式
2. 点击所有PDF文件前的复选框
3. 按 `Ctrl+X` 剪切
4. 双击进入"文档"文件夹
5. 按 `Ctrl+V` 粘贴

### 示例2：备份文件夹
**场景**：复制"照片"文件夹到"备份"文件夹

**步骤**：
1. 进入"照片"所在目录
2. 按 `B` 进入批量模式
3. 选择"照片"文件夹
4. 按 `Ctrl+C` 复制
5. 进入"备份"文件夹
6. 按 `Ctrl+V` 粘贴

### 示例3：批量删除
**场景**：删除多个临时文件

**步骤**：
1. 按 `B` 进入批量模式
2. 选择要删除的文件
3. 按 `Delete` 键或点击"删除"按钮
4. 在确认对话框中点击"删除"

### 示例4：上传整个项目文件夹
**场景**：上传包含多个子目录的项目文件夹

**步骤**：
1. 准备好本地项目文件夹
2. 直接拖拽文件夹到网页
3. 等待上传完成
4. 检查上传结果

## ⚠️ 重要提示

### 安全相关
- 删除操作不可撤销，请谨慎操作
- 批量删除会显示确认对话框
- 某些文件类型（.exe, .bat等）被禁止上传

### 性能相关
- 大文件上传会自动分片处理
- 文件夹上传会保持目录结构
- 批量操作建议一次不要选择过多项目

### 兼容性
- 文件夹上传需要现代浏览器支持
- 推荐使用 Chrome、Edge、Firefox 等主流浏览器
- Safari 可能对文件夹拖拽支持有限

## 🆘 常见问题

**Q: 为什么批量操作按钮是灰色的？**
A: 请先按 B 键或点击"批量操作"按钮进入批量模式

**Q: 粘贴按钮为什么不可用？**
A: 请先使用剪切或复制功能将项目放入剪切板

**Q: 文件夹上传失败怎么办？**
A: 检查浏览器是否支持文件夹拖拽，或尝试逐个上传文件

**Q: 如何取消批量选择？**
A: 按 ESC 键或点击"清空"按钮

**Q: 剪切板内容会丢失吗？**
A: 刷新页面会清空剪切板，但导航到其他目录不会


## 💡 技术实现

### 核心技术栈

- **前端**：原生 JavaScript、HTML5、CSS3
- **后端**：Cloudflare Workers (JavaScript)
- **数据库**：Cloudflare D1 (SQLite)
- **存储**：Telegram Bot API
- **认证**：JWT (JSON Web Tokens)

### 创新点

- **Telegram 作为存储后端**：利用 Telegram 的无限存储空间，避免了对传统云存储的依赖
- **文件分片处理**：突破 Telegram 单文件大小限制，支持大文件上传和下载
- **边缘计算**：基于 Cloudflare Workers 的全球分布式部署，提供低延迟访问

## 👥 贡献

欢迎贡献代码、报告问题或提出改进建议！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 📜 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件

## 📞 联系方式

如需详细开发文档或遇到问题，请联系项目维护者或提交 Issue。

---

<p align="center">使用 ❤️ 和 ☕ 构建</p>
