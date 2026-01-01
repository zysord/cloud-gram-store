// UI 管理模块
// 负责用户界面交互管理

export class UIManager {
    constructor() {
        this.modals = new Map();
        this.batchMode = false;
        this.selectedItems = new Set(); // 存储选中的项目ID
        this.initializeModals();
    }

    /**
     * 初始化模态框
     */
    initializeModals() {
        const modalIds = [
            'uploadModal',
            'createFolderModal',
            'renameModal',
            'deleteModal',
            'batchActionModal',
            'pasteModal'
        ];

        modalIds.forEach(id => {
            const modal = document.getElementById(id);
            if (modal) {
                this.modals.set(id, modal);
                this.bindModalEvents(modal);
            }
        });
    }

    /**
     * 绑定模态框事件
     */
    bindModalEvents(modal) {
        // 点击背景关闭模态框
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal.id);
            }
        });

        // ESC 键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                this.closeModal(modal.id);
            }
        });
    }

    /**
     * 显示模态框
     */
    showModal(modalId) {
        const modal = this.modals.get(modalId) || document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';

            // 聚焦到第一个输入框
            const firstInput = modal.querySelector('input[type="text"], input[type="password"], textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    /**
     * 关闭模态框
     */
    closeModal(modalId) {
        const modal = this.modals.get(modalId) || document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';

            // 清空表单
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }

            // 清空输入框
            const inputs = modal.querySelectorAll('input[type="text"], input[type="password"], textarea');
            inputs.forEach(input => {
                input.value = '';
            });
        }
    }

    /**
     * 显示创建文件夹模态框
     */
    showCreateFolderModal() {
        this.showModal('createFolderModal');
    }

    /**
     * 显示上传进度模态框
     */
    showUploadModal() {
        this.showModal('uploadModal');
    }

    /**
     * 隐藏上传进度模态框
     */
    hideUploadModal() {
        this.closeModal('uploadModal');
    }

    /**
     * 更新上传进度
     */
    updateUploadProgress(fileName, progress) {
        const fileNameElement = document.getElementById('uploadFileName');
        const percentElement = document.getElementById('uploadPercent');
        const progressFill = document.getElementById('progressBarFill');

        if (fileNameElement) {
            fileNameElement.textContent = fileName;
        }

        if (percentElement) {
            percentElement.textContent = `${Math.round(progress)}%`;
        }

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        // 显示上传模态框
        this.showUploadModal();

        // 如果上传完成，延迟关闭模态框
        if (progress >= 100) {
            setTimeout(() => {
                this.hideUploadModal();
            }, 1500);
        }
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        const loading = document.getElementById('loading');
        const emptyState = document.getElementById('emptyState');

        if (loading) {
            loading.style.display = 'block';
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // 隐藏文件项
        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            item.style.display = 'none';
        });
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    /**
     * 显示空状态
     */
    showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = 'block';
        }
    }

    /**
     * 隐藏空状态
     */
    hideEmptyState() {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }

    /**
     * 切换按钮加载状态
     */
    toggleButtonLoading(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = '<span class="loading-spinner"></span> 处理中...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
        }
    }

    /**
     * 显示确认对话框
     */
    showConfirm(title, message, onConfirm, onCancel = null) {
        // 创建确认对话框
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary confirm-cancel">取消</button>
                    <button class="btn btn-primary confirm-ok">确认</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // 绑定事件
        const cancelBtn = modal.querySelector('.confirm-cancel');
        const okBtn = modal.querySelector('.confirm-ok');

        const cleanup = () => {
            document.body.removeChild(modal);
        };

        cancelBtn.addEventListener('click', () => {
            cleanup();
            if (onCancel) onCancel();
        });

        okBtn.addEventListener('click', () => {
            cleanup();
            onConfirm();
        });

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cleanup();
                if (onCancel) onCancel();
            }
        });

        // ESC 键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                cleanup();
                document.removeEventListener('keydown', escHandler);
                if (onCancel) onCancel();
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    /**
     * 显示提示信息
     */
    showTooltip(element, message, duration = 3000) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-popup';
        tooltip.textContent = message;
        tooltip.style.cssText = `
            position: absolute;
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
        `;

        document.body.appendChild(tooltip);

        // 定位
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';

        // 显示
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 10);

        // 隐藏并移除
        setTimeout(() => {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                if (tooltip.parentNode) {
                    document.body.removeChild(tooltip);
                }
            }, 300);
        }, duration);
    }

    /**
     * 设置页面标题
     */
    setPageTitle(title) {
        document.title = title ? `${title} - CloudGramStore` : 'CloudGramStore';
    }

    /**
     * 滚动到顶部
     */
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * 复制文本到剪贴板
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('复制到剪贴板失败:', error);

            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();

            try {
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return success;
            } catch (fallbackError) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    /**
     * 获取设备类型
     */
    getDeviceType() {
        const width = window.innerWidth;
        if (width < 480) return 'mobile';
        if (width < 768) return 'tablet';
        return 'desktop';
    }

    /**
     * 检查是否为移动设备
     */
    isMobile() {
        return this.getDeviceType() === 'mobile';
    }

    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 显示全局加载中遮罩
     */
    showLoading(message = '加载中...') {
        let loadingMask = document.getElementById('globalLoadingMask');
        if (!loadingMask) {
            loadingMask = document.createElement('div');
            loadingMask.id = 'globalLoadingMask';
            loadingMask.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.3);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            spinner.style.cssText = `
                border: 6px solid #f3f3f3;
                border-top: 6px solid #3498db;
                border-radius: 50%;
                width: 48px;
                height: 48px;
                animation: spin 1s linear infinite;
            `;
            const text = document.createElement('div');
            text.innerText = message;
            text.style.cssText = 'color: #fff; margin-top: 16px; font-size: 18px;';
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display: flex; flex-direction: column; align-items: center;';
            wrap.appendChild(spinner);
            wrap.appendChild(text);
            loadingMask.appendChild(wrap);
            document.body.appendChild(loadingMask);
        } else {
            loadingMask.style.display = 'flex';
        }
    }

    /**
     * 隐藏全局加载中遮罩
     */
    hideLoading() {
        const loadingMask = document.getElementById('globalLoadingMask');
        if (loadingMask) {
            loadingMask.style.display = 'none';
        }
    }

    // ========== 批量操作相关方法 ==========

    /**
     * 切换批量选择模式
     */
    toggleBatchMode() {
        this.batchMode = !this.batchMode;
        this.selectedItems.clear();
        
        const batchToolbar = document.getElementById('batchToolbar');
        const normalToolbar = document.getElementById('normalToolbar');
        
        if (this.batchMode) {
            if (batchToolbar) batchToolbar.style.display = 'flex';
            if (normalToolbar) normalToolbar.style.display = 'none';
        } else {
            if (batchToolbar) batchToolbar.style.display = 'none';
            if (normalToolbar) normalToolbar.style.display = 'flex';
        }
        
        this.updateBatchButtons();
        return this.batchMode;
    }

    /**
     * 检查是否在批量模式
     */
    isBatchMode() {
        return this.batchMode;
    }

    /**
     * 选择/取消选择项目
     */
    toggleItemSelection(itemId, itemType) {
        const key = `${itemType}_${itemId}`;
        
        if (this.selectedItems.has(key)) {
            this.selectedItems.delete(key);
        } else {
            this.selectedItems.add(key);
        }
        
        this.updateBatchButtons();
        this.updateSelectionUI();
    }

    /**
     * 选择所有项目
     */
    selectAllItems(items) {
        items.forEach(item => {
            const type = item.mime_type ? 'file' : 'folder';
            const key = `${type}_${item.id}`;
            this.selectedItems.add(key);
        });
        this.updateBatchButtons();
        this.updateSelectionUI();
    }

    /**
     * 取消选择所有项目
     */
    clearSelection() {
        this.selectedItems.clear();
        this.updateBatchButtons();
        this.updateSelectionUI();
    }

    /**
     * 获取选中的项目
     */
    getSelectedItems() {
        const fileIds = [];
        const folderIds = [];
        
        this.selectedItems.forEach(key => {
            const [type, id] = key.split('_');
            if (type === 'file') {
                fileIds.push(parseInt(id));
            } else if (type === 'folder') {
                folderIds.push(parseInt(id));
            }
        });
        
        return { fileIds, folderIds };
    }

    /**
     * 获取选中的项目数量
     */
    getSelectedCount() {
        return this.selectedItems.size;
    }

    /**
     * 更新批量操作按钮状态
     */
    updateBatchButtons() {
        const count = this.getSelectedCount();
        const hasSelection = count > 0;
        
        const buttons = ['batchMoveBtn', 'batchCopyBtn', 'batchDeleteBtn', 'batchCutBtn'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = !hasSelection;
                btn.style.opacity = hasSelection ? '1' : '0.5';
            }
        });
        
        // 更新选中计数显示
        const countDisplay = document.getElementById('selectedCount');
        if (countDisplay) {
            countDisplay.textContent = count > 0 ? `已选择 ${count} 项` : '';
        }
    }

    /**
     * 更新选中状态的UI显示
     */
    updateSelectionUI() {
        // 这个方法会在文件列表渲染时被调用，用于更新每个项目的选中状态
        const checkboxes = document.querySelectorAll('.item-checkbox');
        checkboxes.forEach(checkbox => {
            const itemId = checkbox.dataset.id;
            const itemType = checkbox.dataset.type;
            const key = `${itemType}_${itemId}`;
            
            checkbox.checked = this.selectedItems.has(key);
            
            // 更新父级div的选中样式
            const parentDiv = checkbox.closest('.file-item, .folder-item');
            if (parentDiv) {
                if (this.selectedItems.has(key)) {
                    parentDiv.classList.add('selected');
                } else {
                    parentDiv.classList.remove('selected');
                }
            }
        });
    }

    /**
     * 显示批量操作模态框
     */
    showBatchActionModal(action, count) {
        const modal = this.modals.get('batchActionModal');
        if (!modal) return;

        const titleEl = modal.querySelector('.modal-title');
        const messageEl = modal.querySelector('.modal-message');
        
        const actionNames = {
            'move': '移动',
            'copy': '复制',
            'delete': '删除'
        };
        
        if (titleEl) titleEl.textContent = `确认${actionNames[action]}`;
        if (messageEl) {
            messageEl.textContent = `确定要${actionNames[action]}选中的 ${count} 个项目吗？`;
        }
        
        // 设置action到modal的data属性中
        modal.dataset.action = action;
        
        this.showModal('batchActionModal');
    }

    /**
     * 显示粘贴操作模态框
     */
    showPasteModal(clipboard, targetFolderId) {
        const modal = this.modals.get('pasteModal');
        if (!modal) return;

        const titleEl = modal.querySelector('.modal-title');
        const messageEl = modal.querySelector('.modal-message');
        
        const description = clipboard.getDescription();
        
        if (titleEl) titleEl.textContent = '粘贴项目';
        if (messageEl) {
            messageEl.textContent = `${description} 到当前文件夹？`;
        }
        
        this.showModal('pasteModal');
    }

    /**
     * 显示批量操作结果通知
     */
    showBatchResult(action, successCount, totalCount, errors = [], notificationManager) {
        const actionNames = {
            'move': '移动',
            'copy': '复制',
            'delete': '删除'
        };
        
        if (successCount === totalCount) {
            if (notificationManager) {
                notificationManager.success(`${actionNames[action]}成功`, `成功${actionNames[action]} ${successCount} 个项目`);
            }
        } else {
            let message = `${actionNames[action]}完成：${successCount}/${totalCount} 成功`;
            if (errors.length > 0) {
                // 只显示前3个错误，避免通知过长
                const displayErrors = errors.slice(0, 3);
                const remainingCount = errors.length - 3;
                message += `<br>失败项目：${displayErrors.join(', ')}`;
                if (remainingCount > 0) {
                    message += ` 等${remainingCount}个错误`;
                }
            }
            if (notificationManager) {
                notificationManager.warning('部分操作失败', message);
            }
        }
    }

    /**
     * 显示文件夹上传进度
     */
    showFolderUploadProgress(totalFiles, processedFiles, currentFile) {
        const modal = this.modals.get('uploadModal');
        if (!modal) return;

        const titleEl = modal.querySelector('.modal-title');
        const progressEl = modal.querySelector('.upload-progress');
        const statusEl = modal.querySelector('.upload-status');
        
        if (titleEl) titleEl.textContent = '上传文件夹';
        if (progressEl) {
            const percentage = (processedFiles / totalFiles) * 100;
            progressEl.style.width = `${percentage}%`;
        }
        if (statusEl) {
            statusEl.textContent = `正在上传 ${processedFiles}/${totalFiles}: ${currentFile}`;
        }
        
        this.showModal('uploadModal');
    }

    /**
     * 关闭批量操作相关模态框
     */
    closeBatchModals() {
        this.closeModal('batchActionModal');
        this.closeModal('pasteModal');
    }
}

/* 在全局样式中添加：
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
*/
