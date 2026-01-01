// 剪切板管理模块
// 负责管理剪切、复制、粘贴操作

export class ClipboardManager {
    constructor() {
        this.clipboard = {
            type: null, // 'cut' or 'copy'
            items: [], // {id, name, type: 'file'|'folder', size?}
            sourceFolderId: null // 源文件夹ID
        };
    }

    /**
     * 剪切项目
     * @param {Array} items - 项目列表 [{id, name, type, size?}]
     * @param {string|null} sourceFolderId - 源文件夹ID
     */
    cut(items, sourceFolderId = null) {
        this.clipboard = {
            type: 'cut',
            items: items,
            sourceFolderId: sourceFolderId
        };
        console.log('剪切:', this.clipboard);
    }

    /**
     * 复制项目
     * @param {Array} items - 项目列表 [{id, name, type, size?}]
     * @param {string|null} sourceFolderId - 源文件夹ID
     */
    copy(items, sourceFolderId = null) {
        this.clipboard = {
            type: 'copy',
            items: items,
            sourceFolderId: sourceFolderId
        };
        console.log('复制:', this.clipboard);
    }

    /**
     * 获取剪切板内容
     */
    getClipboard() {
        return this.clipboard;
    }

    /**
     * 检查剪切板是否有内容
     */
    hasContent() {
        return this.clipboard.items.length > 0;
    }

    /**
     * 检查剪切板是否为空
     */
    isEmpty() {
        return !this.hasContent();
    }

    /**
     * 获取剪切板内容的描述文本
     */
    getDescription() {
        if (this.isEmpty()) return '';

        const fileCount = this.clipboard.items.filter(item => item.type === 'file').length;
        const folderCount = this.clipboard.items.filter(item => item.type === 'folder').length;

        const parts = [];
        if (fileCount > 0) parts.push(`${fileCount}个文件`);
        if (folderCount > 0) parts.push(`${folderCount}个文件夹`);

        const action = this.clipboard.type === 'cut' ? '剪切' : '复制';
        return `${action} ${parts.join('和')}`;
    }

    /**
     * 清空剪切板
     */
    clear() {
        this.clipboard = {
            type: null,
            items: [],
            sourceFolderId: null
        };
        console.log('剪切板已清空');
    }

    /**
     * 获取剪切板中的文件ID列表
     */
    getFileIds() {
        return this.clipboard.items
            .filter(item => item.type === 'file')
            .map(item => item.id);
    }

    /**
     * 获取剪切板中的文件夹ID列表
     */
    getFolderIds() {
        return this.clipboard.items
            .filter(item => item.type === 'folder')
            .map(item => item.id);
    }

    /**
     * 检查是否可以粘贴到目标文件夹
     * @param {string|null} targetFolderId - 目标文件夹ID
     */
    canPasteTo(targetFolderId = null) {
        if (this.isEmpty()) return false;
        
        // 如果是剪切，不能粘贴到同一个文件夹
        if (this.clipboard.type === 'cut' && this.clipboard.sourceFolderId === targetFolderId) {
            return false;
        }

        return true;
    }
}