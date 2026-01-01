// CloudGramStore 主 JavaScript 文件
// 模块化前端应用入口

import { AuthManager } from './modules/auth.js';
import { FileManager } from './modules/fileManager.js';
import { UIManager } from './modules/uiManager.js';
import { ApiClient } from './modules/apiClient.js';
import { NotificationManager } from './modules/notification.js';
import { ClipboardManager } from './modules/clipboard.js';

/**
 * 应用主类
 */
class CloudGramApp {
    constructor() {
        this.apiClient = new ApiClient();
        this.authManager = new AuthManager(this.apiClient);
        this.fileManager = new FileManager(this.apiClient);
        this.uiManager = new UIManager();
        this.notification = new NotificationManager();
        this.clipboard = new ClipboardManager();

        this.currentFolderId = null;
        this.breadcrumbPath = [];
        this.currentDirectoryItems = { folders: [], files: [] }; // 当前目录的所有项目

        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            // 绑定事件监听器
            this.bindEvents();

            // 检查登录状态
            if (this.authManager.isLoggedIn()) {
                await this.showMainPage();
            } else {
                this.showLoginPage();
            }

            // 隐藏页面加载指示器
            this.hidePageLoader();
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.notification.error('应用初始化失败', error.message);
            // 即使出错也要隐藏加载指示器
            this.hidePageLoader();
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 登录表单
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', this.handleLogin.bind(this));

        // 登出按钮
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', this.handleLogout.bind(this));

        // 工具栏按钮
        document.getElementById('uploadBtn').addEventListener('click', this.handleUploadClick.bind(this));
        
        const uploadFolderBtn = document.getElementById('uploadFolderBtn');
        if (uploadFolderBtn) {
            uploadFolderBtn.addEventListener('click', this.handleUploadFolderClick.bind(this));
        }
        
        document.getElementById('createFolderBtn').addEventListener('click', this.handleCreateFolderClick.bind(this));
        document.getElementById('refreshBtn').addEventListener('click', this.refreshCurrentDirectory.bind(this));

        // 批量操作工具栏按钮
        const batchModeBtn = document.getElementById('batchModeBtn');
        if (batchModeBtn) {
            batchModeBtn.addEventListener('click', this.handleBatchModeToggle.bind(this));
        }

        const batchCutBtn = document.getElementById('batchCutBtn');
        if (batchCutBtn) {
            batchCutBtn.addEventListener('click', this.handleBatchCut.bind(this));
        }

        const batchCopyBtn = document.getElementById('batchCopyBtn');
        if (batchCopyBtn) {
            batchCopyBtn.addEventListener('click', this.handleBatchCopy.bind(this));
        }

        const batchMoveBtn = document.getElementById('batchMoveBtn');
        if (batchMoveBtn) {
            batchMoveBtn.addEventListener('click', this.handleBatchMove.bind(this));
        }

        const batchDeleteBtn = document.getElementById('batchDeleteBtn');
        if (batchDeleteBtn) {
            batchDeleteBtn.addEventListener('click', this.handleBatchDelete.bind(this));
        }

        const batchSelectAllBtn = document.getElementById('batchSelectAllBtn');
        if (batchSelectAllBtn) {
            batchSelectAllBtn.addEventListener('click', this.handleBatchSelectAll.bind(this));
        }

        const batchClearSelectionBtn = document.getElementById('batchClearSelectionBtn');
        if (batchClearSelectionBtn) {
            batchClearSelectionBtn.addEventListener('click', this.handleBatchClearSelection.bind(this));
        }

        // 粘贴按钮
        const pasteBtn = document.getElementById('pasteBtn');
        if (pasteBtn) {
            pasteBtn.addEventListener('click', this.handlePaste.bind(this));
        }

        // 文件输入
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // 文件夹输入
        const folderInput = document.getElementById('folderInput');
        if (folderInput) {
            folderInput.addEventListener('change', this.handleFolderSelect.bind(this));
        }

        // 模态框确认按钮
        document.getElementById('confirmCreateFolder').addEventListener('click', this.handleCreateFolder.bind(this));
        document.getElementById('confirmRename').addEventListener('click', this.handleRename.bind(this));
        document.getElementById('confirmDelete').addEventListener('click', this.handleDelete.bind(this));

        // 批量操作模态框确认按钮
        const confirmBatchAction = document.getElementById('confirmBatchAction');
        if (confirmBatchAction) {
            confirmBatchAction.addEventListener('click', this.handleBatchActionConfirm.bind(this));
        }

        const confirmPaste = document.getElementById('confirmPaste');
        if (confirmPaste) {
            confirmPaste.addEventListener('click', this.handlePasteConfirm.bind(this));
        }

        // 拖拽上传
        this.bindDragAndDrop();

        // 键盘快捷键
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    /**
     * 绑定拖拽上传事件
     */
    bindDragAndDrop() {
        const contentArea = document.querySelector('.content-area');

        contentArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            contentArea.classList.add('drag-over');
        });

        contentArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (!contentArea.contains(e.relatedTarget)) {
                contentArea.classList.remove('drag-over');
            }
        });

        contentArea.addEventListener('drop', (e) => {
            e.preventDefault();
            contentArea.classList.remove('drag-over');

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                this.uploadFiles(files);
            }
        });
    }

    /**
     * 处理键盘快捷键
     */
    handleKeydown(e) {
        // Ctrl/Cmd + U: 上传文件
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            this.handleUploadClick();
        }

        // Ctrl/Cmd + Shift + U: 上传文件夹
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'U') {
            e.preventDefault();
            this.handleUploadFolderClick();
        }

        // Ctrl/Cmd + N: 新建文件夹
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.handleCreateFolderClick();
        }

        // F5: 刷新
        if (e.key === 'F5') {
            e.preventDefault();
            this.refreshCurrentDirectory();
        }

        // Ctrl/Cmd + X: 剪切
        if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
            e.preventDefault();
            if (this.uiManager.isBatchMode() && this.uiManager.getSelectedCount() > 0) {
                this.handleBatchCut();
            }
        }

        // Ctrl/Cmd + C: 复制
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            if (this.uiManager.isBatchMode() && this.uiManager.getSelectedCount() > 0) {
                this.handleBatchCopy();
            }
        }

        // Ctrl/Cmd + V: 粘贴
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            if (!this.clipboard.isEmpty()) {
                this.handlePaste();
            }
        }

        // Ctrl/Cmd + A: 全选
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            if (this.uiManager.isBatchMode()) {
                this.handleBatchSelectAll();
            }
        }

        // Delete: 删除选中项
        if (e.key === 'Delete') {
            if (this.uiManager.isBatchMode() && this.uiManager.getSelectedCount() > 0) {
                e.preventDefault();
                this.handleBatchDelete();
            }
        }

        // Escape: 退出批量模式或清空选择
        if (e.key === 'Escape') {
            if (this.uiManager.isBatchMode()) {
                e.preventDefault();
                if (this.uiManager.getSelectedCount() > 0) {
                    this.handleBatchClearSelection();
                } else {
                    this.handleBatchModeToggle();
                }
            } else if (!this.clipboard.isEmpty()) {
                e.preventDefault();
                this.clipboard.clear();
                this.updatePasteButton();
                this.notification.info('剪切板已清空');
            }
        }

        // B: 切换批量模式
        if (e.key === 'b' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.handleBatchModeToggle();
        }
    }

    /**
     * 显示登录页面
     */
    showLoginPage() {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainPage').style.display = 'none';
        document.getElementById('username').focus();
    }

    /**
     * 显示主页面
     */
    async showMainPage() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainPage').style.display = 'flex';

        // 显示用户信息
        const userInfo = await this.authManager.getUserInfo();
        document.getElementById('currentUser').textContent = userInfo.username;

        // 加载根目录内容
        await this.loadDirectory(null);
    }

    /**
     * 处理登录
     */
    async handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('loginError');

        try {
            await this.authManager.login(username, password);
            errorElement.classList.remove('show');
            await this.showMainPage();
            this.notification.success('登录成功', `欢迎回来，${username}！`);
        } catch (error) {
            errorElement.textContent = error.message;
            errorElement.classList.add('show');
        }
    }

    /**
     * 处理登出
     */
    async handleLogout() {
        try {
            await this.authManager.logout();
            this.showLoginPage();
            this.notification.info('已登出', '您已成功登出系统');
        } catch (error) {
            this.notification.error('登出失败', error.message);
        }
    }

    /**
     * 处理上传按钮点击
     */
    handleUploadClick() {
        document.getElementById('fileInput').click();
    }

    /**
     * 处理文件选择
     */
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            this.uploadFiles(files);
        }
        // 清空文件输入
        e.target.value = '';
    }

    /**
     * 处理文件夹选择（移动端和桌面端）
     */
    handleFolderSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // 从文件路径中提取文件夹结构
            this.processFolderFiles(files);
        }
        // 清空文件夹输入
        e.target.value = '';
    }

    /**
     * 处理文件夹选择的文件列表
     * @param {File[]} files - 文件夹中的所有文件
     */
    async processFolderFiles(files) {
        if (files.length === 0) return;

        // 从文件路径中提取文件夹结构
        const folderStructure = this.buildFolderStructure(files);
        
        // 获取文件夹名称（从第一个文件的路径中提取）
        const firstFile = files[0];
        const pathParts = firstFile.webkitRelativePath.split('/');
        const folderName = pathParts[0] || '上传的文件夹';

        // 上传文件夹
        await this.handleFolderUpload(folderStructure, folderName);
    }

    /**
     * 从文件列表构建文件夹结构
     */
    buildFolderStructure(files) {
        const structure = [];

        files.forEach(file => {
            const path = file.webkitRelativePath;
            const parts = path.split('/');
            
            // 第一部分是根文件夹名，忽略
            const relativeParts = parts.slice(1);
            
            // 递归构建结构
            let currentLevel = structure;
            
            for (let i = 0; i < relativeParts.length - 1; i++) {
                const folderName = relativeParts[i];
                let folder = currentLevel.find(item => item.isDirectory && item.name === folderName);
                
                if (!folder) {
                    folder = { name: folderName, isDirectory: true, children: [] };
                    currentLevel.push(folder);
                }
                
                currentLevel = folder.children;
            }
            
            // 添加文件
            const fileName = relativeParts[relativeParts.length - 1];
            currentLevel.push({
                name: fileName,
                isFile: true,
                file: file
            });
        });

        return structure;
    }

    /**
     * 处理上传文件夹按钮点击
     */
    handleUploadFolderClick() {
        const folderInput = document.getElementById('folderInput');
        if (folderInput) {
            folderInput.click();
        }
    }

    /**
     * 上传文件
     * @param {File[]} files - 要上传的文件列表
     */
    async uploadFiles(files) {
        this.uiManager.showLoading('正在上传...');
        for (const file of files) {
            try {
                await this.fileManager.uploadFile(file, this.currentFolderId, (progress) => {
                    this.uiManager.updateUploadProgress && this.uiManager.updateUploadProgress(file.name, progress);
                });

                this.notification.success('上传成功', `文件 ${file.name} 上传完成`);
            } catch (error) {
                console.error('文件上传错误:', error);

                // 构建详细错误信息对象
                const errorDetails = {
                    fileName: file.name,
                    fileSize: this.formatFileSize(file.size),
                    folderId: this.currentFolderId,
                    timestamp: new Date().toLocaleString()
                };

                // 合并错误对象中的详细信息
                if (error.details) {
                    Object.assign(errorDetails, error.details);
                }

                // 添加错误状态和URL信息
                if (error.status) errorDetails.status = error.status;
                if (error.url) errorDetails.url = error.url;
                if (error.method) errorDetails.method = error.method;

                this.notification.error(
                    '上传失败',
                    `文件 ${file.name} 上传失败：${error.message}`,
                    8000,  // 显示时间更长
                    errorDetails
                );
            }
        }
        this.uiManager.hideLoading();
        // 刷新目录
        await this.refreshCurrentDirectory();
    }

    /**
     * 处理创建文件夹按钮点击
     */
    handleCreateFolderClick() {
        this.uiManager.showCreateFolderModal();
    }

    /**
     * 处理创建文件夹
     */
    async handleCreateFolder() {
        const folderName = document.getElementById('folderName').value.trim();

        if (!folderName) {
            this.notification.warning('请输入文件夹名称');
            return;
        }
        this.uiManager.showLoading('正在创建文件夹...');
        try {
            await this.fileManager.createFolder(folderName, this.currentFolderId);
            this.uiManager.closeModal('createFolderModal');
            document.getElementById('folderName').value = '';
            await this.refreshCurrentDirectory();
            this.notification.success('创建成功', `文件夹 ${folderName} 创建完成`);
        } catch (error) {
            console.error('创建文件夹错误:', error);

            // 构建详细错误信息对象
            const errorDetails = {
                folderName: folderName,
                parentFolderId: this.currentFolderId,
                timestamp: new Date().toLocaleString()
            };

            // 合并错误对象中的详细信息
            if (error.details) {
                Object.assign(errorDetails, error.details);
            }

            this.notification.error('创建失败', error.message, 8000, errorDetails);
        } finally {
            this.uiManager.hideLoading();
        }
    }

    /**
     * 重命名项目
     */
    async renameItem(type, id, currentName) {
        this.currentRenameItem = { type, id, currentName };
        document.getElementById('newName').value = currentName;
        document.getElementById('renameTitle').textContent = `重命名${type === 'folder' ? '文件夹' : '文件'}`;
        this.uiManager.showModal('renameModal');
    }

    /**
     * 处理重命名
     */
    async handleRename() {
        const newName = document.getElementById('newName').value.trim();

        if (!newName) {
            this.notification.warning('请输入新名称');
            return;
        }

        if (!this.currentRenameItem) {
            return;
        }
        this.uiManager.showLoading('正在重命名...');
        try {
            const { type, id, currentName } = this.currentRenameItem;

            if (type === 'folder') {
                await this.fileManager.updateFolderName(id, newName);
            } else {
                await this.fileManager.updateFileName(id, newName);
            }

            this.uiManager.closeModal('renameModal');
            await this.refreshCurrentDirectory();
            this.notification.success('重命名成功', `${type === 'folder' ? '文件夹' : '文件'}已重命名为 ${newName}`);
        } catch (error) {
            console.error('重命名错误:', error);

            // 构建详细错误信息对象
            const { type, id, currentName } = this.currentRenameItem;
            const errorDetails = {
                itemType: type,
                itemId: id,
                oldName: currentName,
                newName: newName,
                timestamp: new Date().toLocaleString()
            };

            // 合并错误对象中的详细信息
            if (error.details) {
                Object.assign(errorDetails, error.details);
            }

            this.notification.error('重命名失败', error.message, 8000, errorDetails);
        } finally {
            this.uiManager.hideLoading();
        }
    }

    /**
     * 删除项目
     */
    async deleteItem(type, id, name) {
        this.currentDeleteItem = { type, id, name };
        document.getElementById('deleteMessage').textContent =
            `确定要删除${type === 'folder' ? '文件夹' : '文件'} "${name}" 吗？此操作不可撤销。`;
        this.uiManager.showModal('deleteModal');
    }

    /**
     * 处理删除
     */
    async handleDelete() {
        if (!this.currentDeleteItem) {
            return;
        }
        this.uiManager.showLoading('正在删除...');
        try {
            const { type, id, name } = this.currentDeleteItem;

            if (type === 'folder') {
                await this.fileManager.deleteFolder(id);
            } else {
                await this.fileManager.deleteFile(id);
            }

            this.uiManager.closeModal('deleteModal');
            await this.refreshCurrentDirectory();
            this.notification.success('删除成功', `${type === 'folder' ? '文件夹' : '文件'} ${name} 已删除`);
        } catch (error) {
            console.error('删除错误:', error);

            // 构建详细错误信息对象
            const { type, id, name } = this.currentDeleteItem;
            const errorDetails = {
                itemType: type,
                itemId: id,
                itemName: name,
                timestamp: new Date().toLocaleString()
            };

            // 合并错误对象中的详细信息
            if (error.details) {
                Object.assign(errorDetails, error.details);
            }

            this.notification.error('删除失败', error.message, 8000, errorDetails);
        } finally {
            this.uiManager.hideLoading();
        }
    }

    /**
     * 下载文件
     * @param {string} fileId - 文件ID
     * @param {string} fileName - 文件名
     */
    async downloadFile(fileId, fileName) {
        this.uiManager.showLoading('正在下载...');
        try {
            this.notification.info('开始下载', `正在准备下载 ${fileName}...`);
            await this.fileManager.downloadFile(fileId, fileName, (progress) => {
                // 如果UI管理器支持下载进度更新，则调用它
                this.uiManager.updateDownloadProgress &&
                this.uiManager.updateDownloadProgress(fileName, progress);
            });
            this.notification.success('下载完成', `文件 ${fileName} 下载完成`);
        } catch (error) {
            console.error('文件下载错误:', error);

            // 构建详细错误信息对象
            const errorDetails = {
                fileName: fileName,
                fileId: fileId,
                timestamp: new Date().toLocaleString()
            };

            // 合并错误对象中的详细信息
            if (error.details) {
                Object.assign(errorDetails, error.details);
            }

            // 添加错误状态和URL信息
            if (error.status) errorDetails.status = error.status;
            if (error.url) errorDetails.url = error.url;
            if (error.method) errorDetails.method = error.method;

            this.notification.error(
                '下载失败',
                `文件 ${fileName} 下载失败：${error.message}`,
                8000,  // 显示时间更长
                errorDetails
            );
        } finally {
            this.uiManager.hideLoading();
        }
    }

    /**
     * 加载目录内容
     * @param {string|null} folderId - 文件夹ID，null表示根目录
     */
    async loadDirectory(folderId) {
        console.log('loadDirectory called with folderId:', folderId); // 调试用
        try {
            this.uiManager.showLoading();

            const data = await this.fileManager.getDirectoryContents(folderId);
            this.currentFolderId = folderId;

            // 更新面包屑导航
            await this.updateBreadcrumb(folderId);

            // 渲染文件列表
            this.renderFileList(data.folders, data.files);

        } catch (error) {
            console.error('加载目录错误:', error);

            // 构建详细错误信息对象
            const errorDetails = {
                folderId: folderId,
                timestamp: new Date().toLocaleString()
            };

            // 合并错误对象中的详细信息
            if (error.details) {
                Object.assign(errorDetails, error.details);
            }

            this.notification.error('加载失败', error.message, 8000, errorDetails);
        } finally {
            this.uiManager.hideLoading();
        }
    }

    /**
     * 更新面包屑导航
     */
    async updateBreadcrumb(folderId) {
			console.log('更新面包屑导航 floderId=' + folderId);
        if (folderId === null) {
            this.breadcrumbPath = [{ id: null, name: '根目录' }];
        } else {
            try {
                this.breadcrumbPath = await this.fileManager.getFolderPath(folderId);
                this.breadcrumbPath.unshift({ id: null, name: '根目录' });
            } catch (error) {
                console.error('获取文件夹路径失败:', error);
                this.breadcrumbPath = [{ id: null, name: '根目录' }];
            }
        }

        this.renderBreadcrumb();
    }

    /**
     * 渲染面包屑导航
     */
    renderBreadcrumb() {
        console.log('breadcrumbPath:', this.breadcrumbPath); // 调试用，打印路径
        const breadcrumb = document.getElementById('breadcrumb');
        breadcrumb.innerHTML = '';

        this.breadcrumbPath.forEach((item, index) => {
            const breadcrumbItem = document.createElement('div');
            breadcrumbItem.className = 'breadcrumb-item';

            if (index === this.breadcrumbPath.length - 1) {
                // 当前目录
                breadcrumbItem.textContent = item.name;
            } else {
                // 可点击的路径
                const link = document.createElement('a');
                link.className = 'breadcrumb-link';
                link.textContent = item.name;
                link.addEventListener('click', () => this.loadDirectory(item.id));
                breadcrumbItem.appendChild(link);
            }

            breadcrumb.appendChild(breadcrumbItem);
        });
    }

    /**
     * 渲染文件列表
     */
    renderFileList(folders, files) {
        const fileList = document.getElementById('fileList');
        const loading = document.getElementById('loading');
        const emptyState = document.getElementById('emptyState');

        // 隐藏加载状态
        loading.style.display = 'none';

        // 清空现有内容
        const existingItems = fileList.querySelectorAll('.file-item');
        existingItems.forEach(item => item.remove());

        // 检查是否为空
        if (folders.length === 0 && files.length === 0) {
            emptyState.style.display = 'block';
            return;
        } else {
            emptyState.style.display = 'none';
        }

        // 渲染文件夹
        folders.forEach(folder => {
            const folderElement = this.createFolderElement(folder);
            fileList.appendChild(folderElement);
        });

        // 渲染文件
        files.forEach(file => {
            const fileElement = this.createFileElement(file);
            fileList.appendChild(fileElement);
        });
    }

    /**
     * 创建文件夹元素（直接显示重命名和删除按钮）
     */
    createFolderElement(folder) {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = `
            <div class="file-icon">📁</div>
            <div class="file-info">
                <div class="file-name">${this.escapeHtml(folder.name)}</div>
                <div class="file-meta">
                    <span>创建时间: ${this.formatDate(folder.created_at)}</span>
                </div>
            </div>
            <div class="file-actions">
                <button class="action-btn action-btn-secondary" onclick="app.renameItem('folder', ${folder.id}, '${this.escapeHtml(folder.name)}')">重命名</button>
                <button class="action-btn action-btn-danger" onclick="app.deleteItem('folder', ${folder.id}, '${this.escapeHtml(folder.name)}')">删除</button>
            </div>
        `;
        // 添加双击进入文件夹
        div.addEventListener('dblclick', () => {
            this.loadDirectory(folder.id);
        });
        return div;
    }

    /**
     * 创建文件元素
     */
    createFileElement(file) {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = `
            <div class="file-icon">${this.getFileIcon(file.mime_type)}</div>
            <div class="file-info">
                <div class="file-name">${this.escapeHtml(file.name)}</div>
                <div class="file-meta">
                    <span>大小: ${this.formatFileSize(file.size)}</span>
                    <span>上传时间: ${this.formatDate(file.created_at)}</span>
                </div>
            </div>
            <div class="file-actions">
                <button class="action-btn action-btn-primary" onclick="app.downloadFile(${file.id}, '${this.escapeHtml(file.name)}')">下载</button>
                <button class="action-btn action-btn-secondary" onclick="app.renameItem('file', ${file.id}, '${this.escapeHtml(file.name)}')">重命名</button>
                <button class="action-btn action-btn-danger" onclick="app.deleteItem('file', ${file.id}, '${this.escapeHtml(file.name)}')">删除</button>
            </div>
        `;

        return div;
    }

    /**
     * 下载文件
     */
    async downloadFile(fileId, fileName) {
        this.uiManager.showLoading('正在下载...');
        try {
            this.notification.info('开始下载', `正在准备下载 ${fileName}...`);
            await this.fileManager.downloadFile(fileId, fileName);
            this.notification.success('下载完成', `文件 ${fileName} 下载完成`);
        } catch (error) {
            this.notification.error('下载失败', `文件 ${fileName} 下载失败：${error.message}`);
        } finally {
            this.uiManager.hideLoading();
        }
    }

    /**
     * 刷新当前目录
     */
    async refreshCurrentDirectory() {
        await this.loadDirectory(this.currentFolderId);
    }

    /**
     * 转义 HTML 特殊字符
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 文件大小（字节）
     * @returns {string} - 格式化后的文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 获取文件图标
     */
    getFileIcon(mimeType) {
        if (!mimeType) return '📄';

        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📕';
        if (mimeType.includes('word')) return '📘';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📗';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📙';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '🗜️';
        if (mimeType.startsWith('text/')) return '📝';

        return '📄';
    }

    /**
     * 隐藏页面加载指示器
     */
    hidePageLoader() {
        const pageLoader = document.getElementById('pageLoader');
        if (pageLoader) {
            pageLoader.style.display = 'none';
        }
    }

    // ========== 批量操作相关方法 ==========

    /**
     * 处理批量模式切换
     */
    handleBatchModeToggle() {
        const enabled = this.uiManager.toggleBatchMode();
        
        if (enabled) {
            this.notification.info('批量模式已开启', '点击项目进行选择，或使用 Ctrl+A 全选');
        } else {
            this.notification.info('批量模式已关闭');
        }

        // 重新渲染当前目录以更新UI
        this.renderFileList(this.currentDirectoryItems.folders, this.currentDirectoryItems.files);
    }

    /**
     * 处理批量剪切
     */
    handleBatchCut() {
        const { fileIds, folderIds } = this.uiManager.getSelectedItems();
        
        if (fileIds.length === 0 && folderIds.length === 0) {
            this.notification.warning('请先选择要剪切的项目');
            return;
        }

        // 构建剪切板数据
        const items = [];
        
        // 添加文件
        this.currentDirectoryItems.files.forEach(file => {
            if (fileIds.includes(file.id)) {
                items.push({
                    id: file.id,
                    name: file.name,
                    type: 'file',
                    size: file.size
                });
            }
        });

        // 添加文件夹
        this.currentDirectoryItems.folders.forEach(folder => {
            if (folderIds.includes(folder.id)) {
                items.push({
                    id: folder.id,
                    name: folder.name,
                    type: 'folder'
                });
            }
        });

        this.clipboard.cut(items, this.currentFolderId);
        this.updatePasteButton();
        
        const count = items.length;
        this.notification.success('剪切成功', `已剪切 ${count} 个项目，使用 Ctrl+V 粘贴`);

        // 退出批量模式
        if (this.uiManager.isBatchMode()) {
            this.handleBatchModeToggle();
        }
    }

    /**
     * 处理批量复制
     */
    handleBatchCopy() {
        const { fileIds, folderIds } = this.uiManager.getSelectedItems();
        
        if (fileIds.length === 0 && folderIds.length === 0) {
            this.notification.warning('请先选择要复制的项目');
            return;
        }

        // 构建剪切板数据
        const items = [];
        
        // 添加文件
        this.currentDirectoryItems.files.forEach(file => {
            if (fileIds.includes(file.id)) {
                items.push({
                    id: file.id,
                    name: file.name,
                    type: 'file',
                    size: file.size
                });
            }
        });

        // 添加文件夹
        this.currentDirectoryItems.folders.forEach(folder => {
            if (folderIds.includes(folder.id)) {
                items.push({
                    id: folder.id,
                    name: folder.name,
                    type: 'folder'
                });
            }
        });

        this.clipboard.copy(items, this.currentFolderId);
        this.updatePasteButton();
        
        const count = items.length;
        this.notification.success('复制成功', `已复制 ${count} 个项目，使用 Ctrl+V 粘贴`);

        // 退出批量模式
        if (this.uiManager.isBatchMode()) {
            this.handleBatchModeToggle();
        }
    }

    /**
     * 处理批量移动
     */
    handleBatchMove() {
        const { fileIds, folderIds } = this.uiManager.getSelectedItems();
        
        if (fileIds.length === 0 && folderIds.length === 0) {
            this.notification.warning('请先选择要移动的项目');
            return;
        }

        const count = fileIds.length + folderIds.length;
        const modal = document.getElementById('batchActionModal');
        if (modal) {
            modal.dataset.action = 'move';
        }
        this.uiManager.showBatchActionModal('move', count);
    }

    /**
     * 处理批量删除
     */
    handleBatchDelete() {
        const { fileIds, folderIds } = this.uiManager.getSelectedItems();
        
        if (fileIds.length === 0 && folderIds.length === 0) {
            this.notification.warning('请先选择要删除的项目');
            return;
        }

        const count = fileIds.length + folderIds.length;
        const modal = document.getElementById('batchActionModal');
        if (modal) {
            modal.dataset.action = 'delete';
        }
        this.uiManager.showBatchActionModal('delete', count);
    }

    /**
     * 处理批量全选
     */
    handleBatchSelectAll() {
        if (!this.uiManager.isBatchMode()) {
            this.notification.info('请先开启批量模式');
            return;
        }

        this.uiManager.selectAllItems([
            ...this.currentDirectoryItems.folders,
            ...this.currentDirectoryItems.files
        ]);

        const count = this.uiManager.getSelectedCount();
        this.notification.info('已全选', `选择了 ${count} 个项目`);
    }

    /**
     * 处理清空选择
     */
    handleBatchClearSelection() {
        this.uiManager.clearSelection();
        this.notification.info('已清空选择');
    }

    /**
     * 处理批量操作确认
     */
    async handleBatchActionConfirm() {
        const modal = document.getElementById('batchActionModal');
        const action = modal ? modal.dataset.action : '';
        const { fileIds, folderIds } = this.uiManager.getSelectedItems();
        
        this.uiManager.closeBatchModals();
        this.uiManager.showLoading('正在处理...');

        try {
            let result;

            if (action === 'move') {
                // 移动操作需要选择目标文件夹，这里简化处理：移动到当前目录
                // 实际应用中应该弹出文件夹选择器
                result = await this.fileManager.batchMove(fileIds, folderIds, this.currentFolderId);
            } else if (action === 'delete') {
                result = await this.fileManager.batchDelete(fileIds, folderIds);
            }

            if (result && result.success) {
                const successCount = (result.movedFiles || result.deletedFiles || 0) + 
                                   (result.movedFolders || result.deletedFolders || 0);
                const totalCount = fileIds.length + folderIds.length;
                
                this.uiManager.showBatchResult(action, successCount, totalCount, result.errors || [], this.notification);
                await this.refreshCurrentDirectory();

                // 清空选择
                this.uiManager.clearSelection();
                if (this.uiManager.isBatchMode()) {
                    this.handleBatchModeToggle();
                }
            } else {
                // 部分失败或完全失败
                const successCount = (result.movedFiles || result.deletedFiles || 0) + 
                                   (result.movedFolders || result.deletedFolders || 0);
                const totalCount = fileIds.length + folderIds.length;
                
                this.uiManager.showBatchResult(action, successCount, totalCount, result.errors || [], this.notification);
                await this.refreshCurrentDirectory();
            }

        } catch (error) {
            console.error('批量操作失败:', error);
            this.notification.error('批量操作失败', error.message);
        } finally {
            this.uiManager.hideLoading();
        }
    }

    /**
     * 处理粘贴
     */
    handlePaste() {
        if (this.clipboard.isEmpty()) {
            this.notification.warning('剪切板为空');
            return;
        }

        if (!this.clipboard.canPasteTo(this.currentFolderId)) {
            this.notification.warning('无法粘贴', '不能移动到同一个文件夹');
            return;
        }

        this.uiManager.showPasteModal(this.clipboard, this.currentFolderId);
    }

    /**
     * 处理粘贴确认
     */
    async handlePasteConfirm() {
        const clipboard = this.clipboard.getClipboard();
        
        // 从剪切板项目中提取文件ID和文件夹ID
        const fileIds = clipboard.items
            .filter(item => item.type === 'file')
            .map(item => item.id);
        const folderIds = clipboard.items
            .filter(item => item.type === 'folder')
            .map(item => item.id);

        this.uiManager.closeBatchModals();
        this.uiManager.showLoading('正在粘贴...');

        try {
            let result;

            if (clipboard.type === 'cut') {
                // 移动操作
                result = await this.fileManager.batchMove(fileIds, folderIds, this.currentFolderId);
                
                // 清空剪切板
                this.clipboard.clear();
                this.updatePasteButton();
            } else if (clipboard.type === 'copy') {
                // 复制操作
                result = await this.fileManager.batchCopy(fileIds, folderIds, this.currentFolderId);
            }

            if (result && result.success) {
                const successCount = (result.movedFiles || result.copiedFiles || 0) + 
                                   (result.movedFolders || result.copiedFolders || 0);
                
                this.notification.success('粘贴成功', `成功粘贴 ${successCount} 个项目`);
                await this.refreshCurrentDirectory();
            } else {
                // 部分失败
                const successCount = (result.movedFiles || result.copiedFiles || 0) + 
                                   (result.movedFolders || result.copiedFolders || 0);
                const totalCount = fileIds.length + folderIds.length;
                
                let message = `粘贴完成：${successCount}/${totalCount} 成功`;
                if (result.errors && result.errors.length > 0) {
                    message += `<br>失败项目：${result.errors.slice(0, 3).join(', ')}${result.errors.length > 3 ? '...' : ''}`;
                }
                
                this.notification.warning('部分粘贴失败', message);
                await this.refreshCurrentDirectory();
            }

        } catch (error) {
            console.error('粘贴失败:', error);
            this.notification.error('粘贴失败', error.message);
        } finally {
            this.uiManager.hideLoading();
        }
    }

    /**
     * 更新粘贴按钮状态
     */
    updatePasteButton() {
        const pasteBtn = document.getElementById('pasteBtn');
        if (pasteBtn) {
            const hasContent = !this.clipboard.isEmpty();
            pasteBtn.disabled = !hasContent;
            pasteBtn.style.opacity = hasContent ? '1' : '0.5';
            
            if (hasContent) {
                const description = this.clipboard.getDescription();
                pasteBtn.innerHTML = `<span class="btn-icon">📋</span> 粘贴 ${description}`;
            } else {
                pasteBtn.innerHTML = `<span class="btn-icon">📋</span> 粘贴`;
            }
        }
    }

    /**
     * 处理文件夹上传
     */
    async handleFolderUpload(entries, folderName) {
        this.uiManager.showLoading('正在上传文件夹...');
        
        try {
            // 直接调用API客户端的uploadFolder方法
            const result = await this.apiClient.uploadFolder(folderName, entries, this.currentFolderId);
            
            if (result.success) {
                let message = `成功创建 ${result.createdFolders} 个文件夹`;
                if (result.totalFiles > 0) {
                    message += `, 上传 ${result.uploadedFiles}/${result.totalFiles} 个文件`;
                }
                
                if (result.errors && result.errors.length > 0) {
                    message += `, 但有 ${result.errors.length} 个错误`;
                    this.notification.warning('文件夹上传完成', message);
                } else {
                    this.notification.success('文件夹上传成功', message);
                }
            } else {
                this.notification.error('文件夹上传失败', result.errors.join(', '));
            }
            
            await this.refreshCurrentDirectory();
        } catch (error) {
            console.error('文件夹上传失败:', error);
            this.notification.error('文件夹上传失败', error.message);
        } finally {
            this.uiManager.hideLoading();
        }
    }

    /**
     * 处理文件夹拖拽上传
     */
    async handleFolderDrop(e) {
        e.preventDefault();
        
        const items = e.dataTransfer.items;
        const entries = [];
        
        console.log(`开始处理拖拽上传，项目数量: ${items.length}`);
        
        // 使用 WebKitGetAsEntry API 来处理文件夹
        for (let i = 0; i < items.length; i++) {
            const item = items[i].webkitGetAsEntry();
            if (item) {
                console.log(`处理项目 ${i}: ${item.name}, 类型: ${item.isDirectory ? '文件夹' : '文件'}`);
                const entry = await this.scanEntry(item);
                if (entry) {
                    entries.push(entry);
                }
            }
        }

        console.log(`扫描完成，共找到 ${entries.length} 个顶级条目`, entries);

        if (entries.length === 0) {
            this.notification.warning('未找到有效的文件或文件夹');
            return;
        }

        // 如果只有一个文件夹，使用文件夹名称，并直接使用其子条目
        let folderName = '上传的文件夹';
        let uploadEntries = entries;
        
        if (entries.length === 1 && entries[0].isDirectory) {
            folderName = entries[0].name;
            // 如果是单个文件夹，直接使用其子条目，避免创建双重嵌套
            if (entries[0].children && entries[0].children.length > 0) {
                uploadEntries = entries[0].children;
                console.log(`单个文件夹 "${folderName}"，使用其 ${uploadEntries.length} 个子条目`);
            } else {
                // 空文件夹，仍然需要创建
                uploadEntries = [];
                console.log(`单个空文件夹 "${folderName}"`);
            }
        } else {
            console.log(`多个项目，将创建根文件夹 "${folderName}"`);
        }

        await this.handleFolderUpload(uploadEntries, folderName);
    }

    /**
     * 扫描文件或文件夹条目
     */
    async scanEntry(entry) {
        if (entry.isFile) {
            return new Promise((resolve) => {
                entry.file((file) => {
                    console.log(`扫描到文件: ${entry.name}, 大小: ${file.size} 字节`);
                    resolve({
                        name: entry.name,
                        isFile: true,
                        file: file
                    });
                });
            });
        } else if (entry.isDirectory) {
            console.log(`扫描文件夹: ${entry.name}`);
            const reader = entry.createReader();
            const entries = [];
            
            const readEntries = async () => {
                const subEntries = await new Promise((resolve) => {
                    reader.readEntries((results) => resolve(results));
                });
                
                if (subEntries.length > 0) {
                    entries.push(...subEntries);
                    await readEntries();
                }
            };

            await readEntries();

            console.log(`文件夹 ${entry.name} 包含 ${entries.length} 个条目`);

            const children = [];
            for (const subEntry of entries) {
                const child = await this.scanEntry(subEntry);
                if (child) {
                    children.push(child);
                }
            }

            return {
                name: entry.name,
                isDirectory: true,
                children: children
            };
        }
        return null;
    }

    /**
     * 更新文件列表渲染（支持批量选择）
     */
    renderFileList(folders, files) {
        // 保存当前目录项目
        this.currentDirectoryItems = { folders, files };

        const fileList = document.getElementById('fileList');
        const loading = document.getElementById('loading');
        const emptyState = document.getElementById('emptyState');

        // 隐藏加载状态
        loading.style.display = 'none';

        // 清空现有内容
        const existingItems = fileList.querySelectorAll('.file-item, .folder-item');
        existingItems.forEach(item => item.remove());

        // 检查是否为空
        if (folders.length === 0 && files.length === 0) {
            emptyState.style.display = 'block';
            return;
        } else {
            emptyState.style.display = 'none';
        }

        // 渲染文件夹
        folders.forEach(folder => {
            const folderElement = this.createFolderElement(folder);
            fileList.appendChild(folderElement);
        });

        // 渲染文件
        files.forEach(file => {
            const fileElement = this.createFileElement(file);
            fileList.appendChild(fileElement);
        });

        // 更新粘贴按钮状态
        this.updatePasteButton();
    }

    /**
     * 创建文件夹元素（支持批量选择）
     */
    createFolderElement(folder) {
        const div = document.createElement('div');
        div.className = 'folder-item file-item';
        
        const isSelected = this.uiManager.isBatchMode() && 
            this.uiManager.selectedItems.has(`folder_${folder.id}`);

        div.innerHTML = `
            <div class="item-selection">
                ${this.uiManager.isBatchMode() ? 
                    `<input type="checkbox" class="item-checkbox" data-id="${folder.id}" data-type="folder" ${isSelected ? 'checked' : ''}>` : 
                    ''}
            </div>
            <div class="file-icon">📁</div>
            <div class="file-info">
                <div class="file-name">${this.escapeHtml(folder.name)}</div>
                <div class="file-meta">
                    <span>创建时间: ${this.formatDate(folder.created_at)}</span>
                </div>
            </div>
            <div class="file-actions">
                ${!this.uiManager.isBatchMode() ? `
                    <button class="action-btn action-btn-secondary" onclick="app.renameItem('folder', ${folder.id}, '${this.escapeHtml(folder.name)}')">重命名</button>
                    <button class="action-btn action-btn-danger" onclick="app.deleteItem('folder', ${folder.id}, '${this.escapeHtml(folder.name)}')">删除</button>
                ` : ''}
            </div>
        `;

        // 批量模式下的选择处理
        if (this.uiManager.isBatchMode()) {
            const checkbox = div.querySelector('.item-checkbox');
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this.uiManager.toggleItemSelection(folder.id, 'folder');
            });

            // 点击整个项目切换选择
            div.addEventListener('click', (e) => {
                if (e.target === checkbox || e.target.closest('.item-selection')) return;
                this.uiManager.toggleItemSelection(folder.id, 'folder');
                checkbox.checked = !checkbox.checked;
            });
        } else {
            // 双击进入文件夹
            div.addEventListener('dblclick', () => {
                this.loadDirectory(folder.id);
            });
        }

        // 如果选中，添加选中样式
        if (isSelected) {
            div.classList.add('selected');
        }

        return div;
    }

    /**
     * 创建文件元素（支持批量选择）
     */
    createFileElement(file) {
        const div = document.createElement('div');
        div.className = 'file-item';
        
        const isSelected = this.uiManager.isBatchMode() && 
            this.uiManager.selectedItems.has(`file_${file.id}`);

        div.innerHTML = `
            <div class="item-selection">
                ${this.uiManager.isBatchMode() ? 
                    `<input type="checkbox" class="item-checkbox" data-id="${file.id}" data-type="file" ${isSelected ? 'checked' : ''}>` : 
                    ''}
            </div>
            <div class="file-icon">${this.getFileIcon(file.mime_type)}</div>
            <div class="file-info">
                <div class="file-name">${this.escapeHtml(file.name)}</div>
                <div class="file-meta">
                    <span>大小: ${this.formatFileSize(file.size)}</span>
                    <span>上传时间: ${this.formatDate(file.created_at)}</span>
                </div>
            </div>
            <div class="file-actions">
                ${!this.uiManager.isBatchMode() ? `
                    <button class="action-btn action-btn-primary" onclick="app.downloadFile(${file.id}, '${this.escapeHtml(file.name)}')">下载</button>
                    <button class="action-btn action-btn-secondary" onclick="app.renameItem('file', ${file.id}, '${this.escapeHtml(file.name)}')">重命名</button>
                    <button class="action-btn action-btn-danger" onclick="app.deleteItem('file', ${file.id}, '${this.escapeHtml(file.name)}')">删除</button>
                ` : ''}
            </div>
        `;

        // 批量模式下的选择处理
        if (this.uiManager.isBatchMode()) {
            const checkbox = div.querySelector('.item-checkbox');
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this.uiManager.toggleItemSelection(file.id, 'file');
            });

            // 点击整个项目切换选择
            div.addEventListener('click', (e) => {
                if (e.target === checkbox || e.target.closest('.item-selection')) return;
                this.uiManager.toggleItemSelection(file.id, 'file');
                checkbox.checked = !checkbox.checked;
            });
        }

        // 如果选中，添加选中样式
        if (isSelected) {
            div.classList.add('selected');
        }

        return div;
    }

    /**
     * 更新拖拽区域以支持文件夹上传
     */
    bindDragAndDrop() {
        const contentArea = document.querySelector('.content-area');

        contentArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            contentArea.classList.add('drag-over');
        });

        contentArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (!contentArea.contains(e.relatedTarget)) {
                contentArea.classList.remove('drag-over');
            }
        });

        contentArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            contentArea.classList.remove('drag-over');

            // 检查是否有文件夹
            const items = e.dataTransfer.items;
            let hasFolder = false;
            
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    const item = items[i].webkitGetAsEntry();
                    if (item && item.isDirectory) {
                        hasFolder = true;
                        break;
                    }
                }
            }

            if (hasFolder) {
                // 处理文件夹上传
                await this.handleFolderDrop(e);
            } else {
                // 处理普通文件上传
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                    this.uploadFiles(files);
                }
            }
        });
    }
}

// 全局函数，用于模态框关闭
window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
};

// 应用实例
let app;

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app = new CloudGramApp();
    window.app = app; // 暴露到全局，方便调试和内联事件处理
});
