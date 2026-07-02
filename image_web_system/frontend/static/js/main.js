/**
 * DigPic 前端主脚本 - 液态玻璃 UI 版本
 * 负责页面交互、前后端通信
 * 
 * 注意：此版本为第一阶段重构，移除固定分栏布局，
 * 暂时注释掉图像显示、直方图等功能，后续步骤将重新实现
 */

// ==================== 全局变量 ====================
let originalImage = null;  // 原始图像Base64
let processedImage = null;  // 处理后的图像Base64（预览）
let processedFullImage = null;  // 处理后的图像完整分辨率Base64
let imageId = null;  // 图像ID（用于缓存）
let imageWindowCount = 0;  // 图像窗口计数器（支持多图上传）
let activeImageWindowId = null;  // 当前激活的图像窗口ID（用于直方图识别）
let histogramWindowCount = 0;  // 直方图窗口计数器

// API基础URL - 使用相对路径，适配本地开发和生产部署
const API_BASE_URL = '/api';

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeButtonStates();
    createToastContainer();
    console.log('DigPic 数字图像处理系统已初始化（液态玻璃 UI 版本）');
});

/**
 * 初始化按钮状态（空图防护）
 */
function initializeButtonStates() {
    // 禁用保存和导出按钮
    const saveBtn = document.getElementById('saveBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    if (saveBtn) saveBtn.disabled = true;
    if (exportBtn) exportBtn.disabled = true;
}

/**
 * 创建Toast提示容器
 */
function createToastContainer() {
    if (!document.getElementById('toastContainer')) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }
}

/**
 * 初始化事件监听器
 */
function initializeEventListeners() {
    // 导航栏按钮
    const loadBtn = document.getElementById('loadBtn');
    const fileInput = document.getElementById('fileInput');
    const saveBtn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    if (loadBtn && fileInput) {
        loadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveImage);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAll);
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportHistogram);
    }
}

// ==================== 文件上传 ====================
/**
 * 处理文件上传
 */
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showError('不支持的文件格式！请上传 JPG、PNG、GIF、BMP 或 WEBP 格式的图片。');
        event.target.value = '';
        return;
    }

    // 验证文件大小（限制10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('文件过大！请上传小于 10MB 的图片。');
        event.target.value = '';
        return;
    }

    try {
        showLoading('正在上传图像...');

        const reader = new FileReader();
        reader.onload = async function(e) {
            const imageData = e.target.result;
            
            // 保存原始图像数据（后续步骤将添加显示逻辑）
            originalImage = imageData;
            
            // 上传到服务器
            await uploadImageToServer(imageData);
        };
        reader.onerror = function() {
            showError('文件读取失败！请重试。');
            hideLoading();
        };
        reader.readAsDataURL(file);

    } catch (error) {
        console.error('文件上传错误:', error);
        showError('文件上传失败: ' + error.message);
        hideLoading();
    }
}

/**
 * 上传图像到服务器
 */
async function uploadImageToServer(imageData) {
    try {
        const response = await fetch(`${API_BASE_URL}/upload_img`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image_data: imageData
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
            // 保存图像ID
            imageId = result.image_id;

            // 启用按钮（后续步骤将添加处理按钮）
            const saveBtn = document.getElementById('saveBtn');
            const exportBtn = document.getElementById('exportBtn');
            
            if (saveBtn) saveBtn.disabled = false;
            if (exportBtn) exportBtn.disabled = false;

            // 创建原始图像悬浮窗
            createImageWindow(imageData, imageId, {
                width: result.width,
                height: result.height
            });

            // 同步创建算法控制面板（原图右侧）
            createControlPanel(imageId);

            console.log('图像上传成功！ID:', imageId);
            console.log('图像尺寸:', result.width, 'x', result.height);
            
            showSuccess('图像上传成功！');
        } else {
            showError('上传失败: ' + result.error);
        }

    } catch (error) {
        console.error('上传图像到服务器错误:', error);
        showError('服务器连接失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ==================== 图像处理 ====================
// 注意：以下函数将在后续步骤重新实现，目前暂时注释

/*
* 应用噪声
*/
// async function applyNoise() { ... }

/*
* 应用滤波
*/
// async function applyFilter() { ... }

/*
* 应用边缘检测
*/
// async function applyEdgeDetection() { ... }

/*
* 应用形态学操作
*/
// async function applyMorphology() { ... }

/*
* 应用阈值分割
*/
// async function applyThreshold() { ... }

/**
 * 调用服务器处理图像（核心函数，后续步骤将重新使用）
 */
async function processImageWithServer(operation, parameters) {
    try {
        showLoading('正在处理图像...');

        const response = await fetch(`${API_BASE_URL}/process_img`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image_id: imageId,
                operation: operation,
                parameters: parameters
            })
        });

        const result = await response.json();

        if (result.success) {
            // 保存处理后的图像数据
            processedImage = result.processed_image;
            processedFullImage = result.processed_full_image || result.processed_image;

            // 创建处理结果悬浮窗
            createResultWindow(processedImage, {
                width: result.width,
                height: result.height,
                operation: operation
            });

            if (result.is_large_image) {
                showInfo(`处理完成！图像已降采样预览（${result.width}x${result.height}），导出时使用完整分辨率`);
            } else {
                showSuccess('图像处理成功！');
            }
        } else {
            showError('处理失败: ' + result.error);
        }

    } catch (error) {
        console.error('图像处理错误:', error);
        showError('服务器连接失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * 创建处理结果悬浮窗（第五步完善：智能位置计算）
 * @param {string} imageData - 处理后的图像 Base64 数据
 * @param {object} imageInfo - 图像信息（width, height, operation）
 */
function createResultWindow(imageData, imageInfo) {
    const windowId = `result-image-${imageWindowCount++}`;
    const resultNumber = imageWindowCount; // 窗口编号
    
    const canvas = document.getElementById('workflowCanvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    // 计算窗口尺寸（自适应图片大小）
    const maxWidth = Math.min(imageInfo.width, canvasRect.width * 0.5);
    const maxHeight = Math.min(imageInfo.height, canvasRect.height * 0.7);
    
    const scale = Math.min(maxWidth / imageInfo.width, maxHeight / imageInfo.height);
    const displayWidth = Math.floor(imageInfo.width * scale);
    const displayHeight = Math.floor(imageInfo.height * scale);
    
    const windowWidth = displayWidth + 30;
    const windowHeight = displayHeight + 55;
    
    // 智能位置计算：自动检索画布空白坐标，避开已有窗口
    const windowPosition = calculateOptimalWindowPosition(windowWidth, windowHeight, canvasRect);
    
    // 创建窗口内容（包含 canvas）
    const canvasElement = document.createElement('canvas');
    canvasElement.id = `canvas-${windowId}`;
    canvasElement.width = displayWidth;
    canvasElement.height = displayHeight;
    
    // 渲染图像到 canvas
    renderImageToCanvas(canvasElement, imageData, displayWidth, displayHeight);
    
    // 使用窗口管理器创建窗口
    const resultWindow = windowManager.createWindow(windowId, `处理结果 #${resultNumber} (${imageInfo.operation})`, 'image-window', {
        width: windowWidth,
        height: windowHeight,
        x: windowPosition.x,
        y: windowPosition.y,
        content: canvasElement
    });
    
    // 存储窗口信息
    resultWindow.dataset.imageData = imageData;
    resultWindow.dataset.originalWidth = imageInfo.width;
    resultWindow.dataset.originalHeight = imageInfo.height;
    resultWindow.dataset.resultNumber = resultNumber;
    
    console.log(`处理结果窗口创建成功: ${windowId}（编号 #${resultNumber}）`);
    return resultWindow;
}

/**
 * 计算最优窗口位置（智能避开已有窗口）
 * @param {number} windowWidth - 窗口宽度
 * @param {number} windowHeight - 窗口高度
 * @param {DOMRect} canvasRect - 画布矩形
 * @returns {object} - 窗口位置 {x, y}
 */
function calculateOptimalWindowPosition(windowWidth, windowHeight, canvasRect) {
    // 获取所有现有窗口的位置信息
    const existingWindows = [];
    
    windowManager.windows.forEach((data) => {
        if (data.element.style.display !== 'none') {
            const rect = data.element.getBoundingClientRect();
            existingWindows.push({
                x: parseFloat(data.element.style.left),
                y: parseFloat(data.element.style.top),
                width: parseFloat(data.element.style.width),
                height: parseFloat(data.element.style.height),
                right: parseFloat(data.element.style.left) + parseFloat(data.element.style.width),
                bottom: parseFloat(data.element.style.top) + parseFloat(data.element.style.height)
            });
        }
    });
    
    // 定义候选位置（网格布局策略）
    const candidatePositions = [];
    const gridSize = 50; // 网格间距
    const margin = 30; // 窗口间距
    
    // 从左上角开始，生成候选位置网格
    for (let y = margin; y < canvasRect.height - windowHeight - margin; y += gridSize) {
        for (let x = margin; x < canvasRect.width - windowWidth - margin; x += gridSize) {
            candidatePositions.push({ x, y });
        }
    }
    
    // 评估每个候选位置的重叠程度
    let bestPosition = { x: canvasRect.width - windowWidth - 50, y: 50 }; // 默认右侧位置
    let minOverlapScore = Infinity;
    
    candidatePositions.forEach(position => {
        // 计算当前位置的重叠分数
        let overlapScore = 0;
        let overlapsWithControlPanel = false;
        
        existingWindows.forEach(window => {
            // 检测窗口重叠
            const overlaps = !(position.x + windowWidth + margin < window.x ||
                              position.x > window.right + margin ||
                              position.y + windowHeight + margin < window.y ||
                              position.y > window.bottom + margin);
            
            if (overlaps) {
                // 计算重叠面积作为分数
                const overlapWidth = Math.min(position.x + windowWidth, window.right) - Math.max(position.x, window.x);
                const overlapHeight = Math.min(position.y + windowHeight, window.bottom) - Math.max(position.y, window.y);
                overlapScore += overlapWidth * overlapHeight;
                
                // 检测是否与控制面板重叠（控制面板优先级最高）
                if (window.x > canvasRect.width * 0.5 && window.y < 100) {
                    overlapsWithControlPanel = true;
                }
            }
        });
        
        // 选择最优位置（重叠分数最小）
        if (!overlapsWithControlPanel && overlapScore < minOverlapScore) {
            minOverlapScore = overlapScore;
            bestPosition = position;
        }
    });
    
    // 如果找到完全无重叠的位置，使用它
    // 否则使用默认右侧位置（可能是第一个结果窗口）
    if (minOverlapScore > 0) {
        // 没有完全空白的位置，使用右侧偏移策略
        const existingResultWindows = existingWindows.filter(w => 
            w.x > canvasRect.width * 0.5 && w.width < 500
        );
        
        if (existingResultWindows.length > 0) {
            // 在现有结果窗口下方排列
            const maxY = Math.max(...existingResultWindows.map(w => w.bottom));
            bestPosition.y = maxY + margin;
            bestPosition.x = existingResultWindows[0].x;
            
            // 如果超出画布底部，换到右侧新列
            if (bestPosition.y + windowHeight > canvasRect.height - margin) {
                bestPosition.x = canvasRect.width - windowWidth - margin;
                bestPosition.y = margin;
            }
        }
    }
    
    console.log(`窗口位置计算完成: (${bestPosition.x}, ${bestPosition.y})，重叠分数: ${minOverlapScore}`);
    return bestPosition;
}

// ==================== 保存和导出 ====================
/**
 * 保存图像（支持完整分辨率导出）
 */
async function saveImage() {
    if (!processedImage) {
        showError('没有处理后的图像可保存');
        return;
    }

    try {
        showLoading('正在保存图像...');

        const imageDataToSave = processedFullImage || processedImage;

        const response = await fetch(`${API_BASE_URL}/save_img`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image_data: processedImage,
                full_image_data: processedFullImage,
                image_id: imageId,
                filename: `processed_image_${Date.now()}.png`,
                full_resolution: true
            })
        });

        const result = await response.json();

        if (result.success) {
            const resolutionInfo = result.resolution === 'full' ? '完整分辨率' : '预览分辨率';
            const sizeInfo = `${result.width}x${result.height}`;
            const fileSizeKB = Math.round(result.file_size / 1024);

            showSuccess(`图像已保存！\n分辨率: ${resolutionInfo} (${sizeInfo})\n文件大小: ${fileSizeKB}KB`);
        } else {
            showError('保存失败: ' + result.error);
        }

    } catch (error) {
        console.error('保存图像错误:', error);
        showError('服务器连接失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * 重置所有
 */
async function resetAll() {
    try {
        // 调用服务器重置接口（在清空变量之前）
        if (imageId) {
            await fetch(`${API_BASE_URL}/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image_id: imageId
                })
            });
        }
        
        // 销毁所有直方图弹窗
        destroyAllHistograms();
        
        // 销毁所有图像窗口和控制面板
        windowManager.getAllWindows().forEach(w => {
            windowManager.closeWindow(w.element.id);
        });
        
        // 重置窗口计数器
        imageWindowCount = 0;
        histogramWindowCount = 0;
        activeImageWindowId = null;
        
        // 清空变量（图片缓存）
        originalImage = null;
        processedImage = null;
        processedFullImage = null;
        imageId = null;

        // 禁用保存和导出按钮
        const saveBtn = document.getElementById('saveBtn');
        const exportBtn = document.getElementById('exportBtn');
        
        if (saveBtn) saveBtn.disabled = true;
        if (exportBtn) exportBtn.disabled = true;

        // 显示初始提示文字（画布恢复空白状态）
        const placeholder = document.getElementById('canvasPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'block';
        }

        showSuccess('已重置所有内容！');

    } catch (error) {
        console.error('重置错误:', error);
        showError('重置失败: ' + error.message);
    }
}

/**
 * 导出直方图（后续步骤将重新实现）
 */
function exportHistogram() {
    // 暂时提示功能待实现
    showInfo('直方图导出功能将在后续步骤实现');
}

// ==================== 工具函数 ====================
/**
 * 节流函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// ==================== UI提示 ====================
/**
 * 显示Toast提示
 */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // 自动消失
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/**
 * 显示加载提示
 */
function showLoading(message) {
    const existingLoading = document.getElementById('loadingOverlay');
    if (existingLoading) return;

    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';

    const spinner = document.createElement('div');
    spinner.innerHTML = `
        <div style="font-size: 16px; color: #444;">${message}</div>
        <div class="spinner"></div>
    `;

    overlay.appendChild(spinner);
    document.body.appendChild(overlay);
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
}

/**
 * 显示成功消息
 */
function showSuccess(message) {
    showToast(message, 'success', 2000);
}

/**
 * 显示错误消息
 */
function showError(message) {
    showToast(message, 'error', 4000);
}

/**
 * 显示警告消息
 */
function showWarning(message) {
    showToast(message, 'warning', 3000);
}

/**
 * 显示信息消息
 */
function showInfo(message) {
    showToast(message, 'info', 2000);
}

// ==================== 页面加载完成提示 ====================
console.log('DigPic 数字图像处理系统前端脚本加载完成（液态玻璃 UI 版本 - 第一阶段）');

// ==================== 窗口管理系统 ====================
/**
 * 窗口管理器 - 负责所有悬浮窗口的创建、拖拽、层级管理
 */
class WindowManager {
    constructor() {
        this.windows = new Map(); // 存储所有窗口实例
        this.minimizedTags = new Map(); // 存储最小化标签
        this.topZIndex = 100; // 当前最高层级
        this.draggingWindow = null; // 当前拖拽的窗口
        this.dragOffset = { x: 0, y: 0 }; // 拖拽偏移量
        this.resizingWindow = null; // 当前调整大小的窗口
        this.resizeStartSize = { width: 0, height: 0 }; // 调整前的尺寸
        this.resizeStartPos = { x: 0, y: 0 }; // 调整前的鼠标位置
        
        // 创建最小化标签容器
        this.createMinimizedTagsContainer();
        
        // 初始化拖拽事件监听
        this.initDragListeners();
        
        // 初始化窗口大小调整事件监听
        this.initResizeListeners();
        
        console.log('窗口管理器已初始化');
    }
    
    /**
     * 创建最小化标签容器
     */
    createMinimizedTagsContainer() {
        if (!document.getElementById('minimizedTagsContainer')) {
            const container = document.createElement('div');
            container.id = 'minimizedTagsContainer';
            container.className = 'minimized-tags-container';
            document.getElementById('workflowCanvas').appendChild(container);
        }
    }
    
    /**
     * 初始化全局拖拽事件监听
     */
    initDragListeners() {
        document.addEventListener('mousemove', (e) => this.handleDrag(e));
        document.addEventListener('mouseup', (e) => this.endDrag(e));
    }
    
    /**
     * 初始化窗口大小调整事件监听
     */
    initResizeListeners() {
        document.addEventListener('mousemove', (e) => this.handleResize(e));
        document.addEventListener('mouseup', (e) => this.endResize(e));
    }
    
    /**
     * 创建窗口（工厂函数）
     * @param {string} windowId - 窗口唯一ID
     * @param {string} title - 窗口标题
     * @param {string} type - 窗口类型（image-window, control-panel-window, histogram-window）
     * @param {object} options - 配置选项（width, height, x, y, content）
     * @returns {HTMLElement} - 窗口DOM元素
     */
    createWindow(windowId, title, type, options = {}) {
        // 如果窗口已存在，先删除
        if (this.windows.has(windowId)) {
            this.closeWindow(windowId);
        }
        
        // 默认配置
        const config = {
            width: options.width || 400,
            height: options.height || 300,
            x: options.x || 100,
            y: options.y || 100,
            content: options.content || ''
        };
        
        // 创建窗口DOM结构
        const windowElement = document.createElement('div');
        windowElement.id = windowId;
        windowElement.className = `float-window ${type}`;
        windowElement.style.width = `${config.width}px`;
        windowElement.style.height = `${config.height}px`;
        windowElement.style.left = `${config.x}px`;
        windowElement.style.top = `${config.y}px`;
        
        // 设置层级并置顶
        this.bringToFront(windowElement, type);
        
        // 创建标题栏
        const header = document.createElement('div');
        header.className = 'float-window-header';
        header.innerHTML = `
            <h3 class="float-window-title">${title}</h3>
            <div class="float-window-controls">
                <button class="float-window-minimize" title="最小化">−</button>
                <button class="float-window-close" title="关闭">×</button>
            </div>
        `;
        
        // 创建内容主体
        const body = document.createElement('div');
        body.className = 'float-window-body';
        if (typeof config.content === 'string') {
            body.innerHTML = config.content;
        } else if (config.content instanceof HTMLElement) {
            body.appendChild(config.content);
        }
        
        // 组装窗口
        windowElement.appendChild(header);
        windowElement.appendChild(body);
        
        // 绑定事件
        this.bindWindowEvents(windowElement, header);
        
        // 添加到画布
        document.getElementById('workflowCanvas').appendChild(windowElement);
        
        // 存储窗口实例
        this.windows.set(windowId, {
            element: windowElement,
            type: type,
            title: title,
            config: config,
            minimized: false
        });
        
        // 窗口激活状态
        this.setActiveWindow(windowElement);
        
        console.log(`窗口创建成功: ${windowId} (${type})`);
        return windowElement;
    }
    
    /**
     * 绑定窗口事件（拖拽、最小化、关闭、调整大小、标题编辑）
     */
    bindWindowEvents(windowElement, header) {
        // 标题栏拖拽
        header.addEventListener('mousedown', (e) => {
            // 如果点击的是控制按钮或编辑界面，不触发拖拽
            if (e.target.classList.contains('float-window-minimize') || 
                e.target.classList.contains('float-window-close') ||
                e.target.closest('.title-edit-interface')) {
                return;
            }
            this.startDrag(e, windowElement);
        });
        
        // 点击窗口时激活
        windowElement.addEventListener('mousedown', () => {
            this.setActiveWindow(windowElement);
        });
        
        // 窗口右下角调整大小（resize handle）
        windowElement.addEventListener('mousedown', (e) => {
            // 检查是否点击了右下角的 resize handle（距离右下角20px范围内）
            const rect = windowElement.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            
            if (offsetX > rect.width - 20 && offsetY > rect.height - 20) {
                this.startResize(e, windowElement);
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        // 最小化按钮
        const minimizeBtn = header.querySelector('.float-window-minimize');
        minimizeBtn.addEventListener('click', () => {
            this.minimizeWindow(windowElement.id);
        });
        
        // 关闭按钮
        const closeBtn = header.querySelector('.float-window-close');
        closeBtn.addEventListener('click', () => {
            this.closeWindow(windowElement.id);
        });
        
        // 标题编辑功能（悬浮1.5秒触发）
        this.bindTitleEditEvent(header, windowElement);
    }
    
    /**
     * 绑定标题编辑事件（悬浮1.5秒触发）
     */
    bindTitleEditEvent(header, windowElement) {
        const titleElement = header.querySelector('.float-window-title');
        if (!titleElement) return;
        
        let hoverTimeout = null;
        let editHintTimeout = null;
        
        // 鼠标悬浮开始
        titleElement.addEventListener('mouseenter', (e) => {
            // 设置1.5秒延迟
            hoverTimeout = setTimeout(() => {
                // 显示编辑提示
                titleElement.classList.add('show-edit-hint');
                
                // 创建提示tooltip
                if (!titleElement.querySelector('.edit-hint-tooltip')) {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'edit-hint-tooltip';
                    tooltip.textContent = '点击可编辑名称';
                    titleElement.appendChild(tooltip);
                    
                    // 300ms后显示tooltip
                    editHintTimeout = setTimeout(() => {
                        tooltip.classList.add('show');
                    }, 300);
                }
            }, 1500); // 1.5秒延迟
        });
        
        // 鼠标悬浮结束
        titleElement.addEventListener('mouseleave', (e) => {
            // 清除延迟
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            if (editHintTimeout) {
                clearTimeout(editHintTimeout);
                editHintTimeout = null;
            }
            
            // 移除提示
            titleElement.classList.remove('show-edit-hint');
            const tooltip = titleElement.querySelector('.edit-hint-tooltip');
            if (tooltip) {
                tooltip.classList.remove('show');
                setTimeout(() => {
                    if (!titleElement.querySelector('.title-edit-interface.show')) {
                        tooltip.remove();
                    }
                }, 300);
            }
        });
        
        // 点击标题显示编辑界面
        titleElement.addEventListener('click', (e) => {
            // 如果编辑界面已显示，不重复创建
            if (titleElement.querySelector('.title-edit-interface.show')) {
                return;
            }
            
            // 移除提示tooltip
            const tooltip = titleElement.querySelector('.edit-hint-tooltip');
            if (tooltip) {
                tooltip.remove();
            }
            
            // 创建编辑界面
            this.createTitleEditInterface(titleElement, windowElement);
        });
    }
    
    /**
     * 创建标题编辑界面
     */
    createTitleEditInterface(titleElement, windowElement) {
        // 获取当前标题
        const currentTitle = titleElement.textContent.trim();
        
        // 创建编辑界面容器
        const editInterface = document.createElement('div');
        editInterface.className = 'title-edit-interface show';
        
        // 创建输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'title-edit-input';
        input.value = currentTitle;
        input.placeholder = '输入新名称';
        
        // 创建按钮组
        const buttons = document.createElement('div');
        buttons.className = 'title-edit-buttons';
        
        // 保存按钮
        const saveBtn = document.createElement('button');
        saveBtn.className = 'title-edit-btn save';
        saveBtn.textContent = '保存';
        saveBtn.addEventListener('click', () => {
            this.saveTitleEdit(titleElement, windowElement, input.value);
        });
        
        // 取消按钮
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'title-edit-btn cancel';
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => {
            this.cancelTitleEdit(titleElement);
        });
        
        // 组装界面
        buttons.appendChild(saveBtn);
        buttons.appendChild(cancelBtn);
        editInterface.appendChild(input);
        editInterface.appendChild(buttons);
        titleElement.appendChild(editInterface);
        
        // 自动聚焦输入框
        input.focus();
        input.select();
        
        // 按Enter键保存
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.saveTitleEdit(titleElement, windowElement, input.value);
            } else if (e.key === 'Escape') {
                this.cancelTitleEdit(titleElement);
            }
        });
        
        // 点击编辑界面外部关闭
        editInterface.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
        });
        
        document.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.title-edit-interface') && 
                !e.target.closest('.float-window-title')) {
                this.cancelTitleEdit(titleElement);
            }
        }, { once: true });
    }
    
    /**
     * 保存标题编辑
     */
    saveTitleEdit(titleElement, windowElement, newTitle) {
        // 验证新标题
        if (!newTitle || newTitle.trim() === '') {
            showError('名称不能为空');
            return;
        }
        
        const trimmedTitle = newTitle.trim();
        
        // 更新标题显示
        titleElement.textContent = trimmedTitle;
        
        // 保存到dataset
        windowElement.dataset.customTitle = trimmedTitle;
        
        // 移除编辑界面
        this.cancelTitleEdit(titleElement);
        
        // 显示成功提示
        showSuccess(`窗口名称已更新为: ${trimmedTitle}`);
        
        console.log(`窗口标题更新: ${windowElement.id} -> ${trimmedTitle}`);
    }
    
    /**
     * 取消标题编辑
     */
    cancelTitleEdit(titleElement) {
        // 移除编辑界面
        const editInterface = titleElement.querySelector('.title-edit-interface');
        if (editInterface) {
            editInterface.remove();
        }
        
        // 移除提示状态
        titleElement.classList.remove('show-edit-hint');
        
        // 移除tooltip
        const tooltip = titleElement.querySelector('.edit-hint-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
    
    /**
     * 开始拖拽
     */
    startDrag(e, windowElement) {
        this.draggingWindow = windowElement;
        
        // 计算偏移量（鼠标位置 - 窗口位置）
        const rect = windowElement.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
        
        // 添加拖拽样式
        windowElement.classList.add('dragging');
        
        // 置顶窗口
        const windowData = this.windows.get(windowElement.id);
        this.bringToFront(windowElement, windowData.type);
        
        e.preventDefault(); // 防止选中文字
    }
    
    /**
     * 处理拖拽移动
     */
    handleDrag(e) {
        if (!this.draggingWindow) return;
        
        // 获取画布边界
        const canvas = document.getElementById('workflowCanvas');
        const canvasRect = canvas.getBoundingClientRect();
        const windowRect = this.draggingWindow.getBoundingClientRect();
        
        // 计算新位置
        let newX = e.clientX - canvasRect.left - this.dragOffset.x;
        let newY = e.clientY - canvasRect.top - this.dragOffset.y;
        
        // 限制边界（不超出画布）
        const minX = 0;
        const maxX = canvasRect.width - windowRect.width;
        const minY = 0;
        const maxY = canvasRect.height - windowRect.height;
        
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));
        
        // 应用新位置
        this.draggingWindow.style.left = `${newX}px`;
        this.draggingWindow.style.top = `${newY}px`;
    }
    
    /**
     * 结束拖拽
     */
    endDrag(e) {
        if (this.draggingWindow) {
            this.draggingWindow.classList.remove('dragging');
            this.draggingWindow = null;
        }
    }
    
    /**
     * 开始调整窗口大小
     */
    startResize(e, windowElement) {
        this.resizingWindow = windowElement;
        
        // 记录起始尺寸和鼠标位置
        this.resizeStartSize.width = parseFloat(windowElement.style.width);
        this.resizeStartSize.height = parseFloat(windowElement.style.height);
        this.resizeStartPos.x = e.clientX;
        this.resizeStartPos.y = e.clientY;
        
        // 添加调整样式
        windowElement.classList.add('resizing');
        
        e.preventDefault();
    }
    
    /**
     * 处理窗口大小调整
     */
    handleResize(e) {
        if (!this.resizingWindow) return;
        
        // 计算尺寸变化
        const deltaX = e.clientX - this.resizeStartPos.x;
        const deltaY = e.clientY - this.resizeStartPos.y;
        
        // 计算新尺寸（保持最小尺寸限制）
        const minWidth = 300;
        const minHeight = 200;
        
        const newWidth = Math.max(minWidth, this.resizeStartSize.width + deltaX);
        const newHeight = Math.max(minHeight, this.resizeStartSize.height + deltaY);
        
        // 应用新尺寸
        this.resizingWindow.style.width = `${newWidth}px`;
        this.resizingWindow.style.height = `${newHeight}px`;
        
        // 如果有 Chart.js 图表，触发 resize
        const windowId = this.resizingWindow.id;
        if (window[`${windowId}_grayChart`]) {
            window[`${windowId}_grayChart`].resize();
        }
        if (window[`${windowId}_rgbChart`]) {
            window[`${windowId}_rgbChart`].resize();
        }
    }
    
    /**
     * 结束窗口大小调整
     */
    endResize(e) {
        if (this.resizingWindow) {
            this.resizingWindow.classList.remove('resizing');
            this.resizingWindow = null;
        }
    }
    
    /**
     * 窶口置顶（层级管理）
     */
    bringToFront(windowElement, type) {
        // 根据窗口类型设置基础层级
        let baseZIndex;
        if (type === 'control-panel-window') {
            baseZIndex = 300;
        } else if (type === 'histogram-window') {
            baseZIndex = 200;
        } else {
            baseZIndex = 100;
        }
        
        // 动态提升层级（确保新窗口在最上层）
        this.topZIndex = Math.max(this.topZIndex, baseZIndex) + 1;
        windowElement.style.zIndex = this.topZIndex;
    }
    
    /**
     * 设置激活窗口
     */
    setActiveWindow(windowElement) {
        // 移除其他窗口的激活状态
        this.windows.forEach((data) => {
            data.element.classList.remove('active');
        });
        
        // 设置当前窗口激活
        windowElement.classList.add('active');
        
        // 窮口置顶
        const windowData = this.windows.get(windowElement.id);
        if (windowData) {
            this.bringToFront(windowElement, windowData.type);
            
            // 如果是图像窗口，更新全局激活窗口ID（用于直方图识别）
            if (windowData.type === 'image-window') {
                activeImageWindowId = windowElement.id;
                console.log(`激活图像窗口: ${windowElement.id}`);
            }
        }
    }
    
    /**
     * 最小化窗口
     */
    minimizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.minimized) return;
        
        // 隐藏窗口
        windowData.element.style.display = 'none';
        windowData.minimized = true;
        
        // 创建最小化标签
        this.createMinimizedTag(windowId, windowData.title);
        
        console.log(`窗口已最小化: ${windowId}`);
    }
    
    /**
     * 创建最小化标签
     */
    createMinimizedTag(windowId, title) {
        const container = document.getElementById('minimizedTagsContainer');
        
        const tag = document.createElement('div');
        tag.className = 'minimized-tag';
        tag.id = `tag-${windowId}`;
        tag.innerHTML = `
            <span class="minimized-tag-title">${title}</span>
            <span class="minimized-tag-icon">↗</span>
        `;
        
        // 点击恢复窗口
        tag.addEventListener('click', () => {
            this.restoreWindow(windowId);
        });
        
        container.appendChild(tag);
        this.minimizedTags.set(windowId, tag);
    }
    
    /**
     * 恢复窗口（从最小化状态）
     */
    restoreWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || !windowData.minimized) return;
        
        // 显示窗口
        windowData.element.style.display = 'flex';
        windowData.minimized = false;
        
        // 移除最小化标签
        const tag = this.minimizedTags.get(windowId);
        if (tag) {
            tag.remove();
            this.minimizedTags.delete(windowId);
        }
        
        // 窮口置顶
        this.setActiveWindow(windowData.element);
        
        console.log(`窗口已恢复: ${windowId}`);
    }
    
    /**
     * 关闭窗口
     */
    closeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        // 移除最小化标签（如果存在）
        const tag = this.minimizedTags.get(windowId);
        if (tag) {
            tag.remove();
            this.minimizedTags.delete(windowId);
        }
        
        // 移除窗口DOM
        windowData.element.remove();
        
        // 从存储中删除
        this.windows.delete(windowId);
        
        console.log(`窗口已关闭: ${windowId}`);
    }
    
    /**
     * 获取窗口实例
     */
    getWindow(windowId) {
        return this.windows.get(windowId);
    }
    
    /**
     * 更新窗口内容
     */
    updateWindowContent(windowId, content) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        const body = windowData.element.querySelector('.float-window-body');
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            body.innerHTML = '';
            body.appendChild(content);
        }
    }
    
    /**
     * 获取所有窗口
     */
    getAllWindows() {
        return Array.from(this.windows.values());
    }
}

// ==================== 创建全局窗口管理器实例 ====================
const windowManager = new WindowManager();

// ==================== 图像窗口功能 ====================
/**
 * 创建原始图像悬浮窗
 * @param {string} imageData - 图像 Base64 数据
 * @param {string} imageId - 图像 ID
 * @param {object} imageInfo - 图像信息（width, height）
 * @returns {HTMLElement} - 窗口DOM元素
 */
function createImageWindow(imageData, imageId, imageInfo) {
    // 清除画布空白提示文字
    const placeholder = document.getElementById('canvasPlaceholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    // 生成唯一窗口ID
    const windowId = `original-image-${imageWindowCount++}`;
    
    // 计算窗口位置（画布左侧居中）
    const canvas = document.getElementById('workflowCanvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    // 计算窗口尺寸（自适应图片大小）
    const maxWidth = Math.min(imageInfo.width, canvasRect.width * 0.6); // 最大不超过画布宽度的60%
    const maxHeight = Math.min(imageInfo.height, canvasRect.height * 0.7); // 最大不超过画布高度的70%
    
    const scale = Math.min(maxWidth / imageInfo.width, maxHeight / imageInfo.height);
    const displayWidth = Math.floor(imageInfo.width * scale);
    const displayHeight = Math.floor(imageInfo.height * scale);
    
    const windowWidth = displayWidth + 30; // 窗口宽度 = 图片宽度 + padding
    const windowHeight = displayHeight + 55; // 窗口高度 = 图片高度 + 标题栏高度
    
    // 计算位置（左侧居中）
    const windowX = 50; // 左侧距离
    const windowY = Math.floor((canvasRect.height - windowHeight) / 2); // 垂直居中
    
    // 创建窗口内容（包含 canvas）
    const canvasElement = document.createElement('canvas');
    canvasElement.id = `canvas-${windowId}`;
    canvasElement.width = displayWidth;
    canvasElement.height = displayHeight;
    
    // 渲染图像到 canvas
    renderImageToCanvas(canvasElement, imageData, displayWidth, displayHeight);
    
    // 使用窗口管理器创建窗口
    const imageWindow = windowManager.createWindow(windowId, `原始图像 (${imageInfo.width}×${imageInfo.height})`, 'image-window', {
        width: windowWidth,
        height: windowHeight,
        x: windowX,
        y: windowY,
        content: canvasElement
    });
    
    // 存储窗口信息（用于后续操作）
    imageWindow.dataset.imageId = imageId;
    imageWindow.dataset.imageData = imageData;
    imageWindow.dataset.originalWidth = imageInfo.width;
    imageWindow.dataset.originalHeight = imageInfo.height;
    
    
    console.log(`原始图像窗口创建成功: ${windowId}`);
    return imageWindow;
}

/**
 * 渲染图像到 Canvas
 * @param {HTMLCanvasElement} canvas - 目标canvas
 * @param {string} imageData - 图像 Base64 数据
 * @param {number} displayWidth - 显示宽度
 * @param {number} displayHeight - 显示高度
 */
function renderImageToCanvas(canvas, imageData, displayWidth, displayHeight) {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制图像（高质量缩放）
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
        
        // 显示尺寸信息
        ctx.font = '12px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText(`${displayWidth}×${displayHeight}`, 10, 20);
    };
    
    img.src = imageData;
}

/**
 * 添加缩放控制按钮
 * @param {HTMLElement} imageWindow - 图像窗口元素
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @param {string} imageData - 原始图像数据
 * @param {object} imageInfo - 图像信息
 */
// ==================== 控制面板悬浮窗功能 ====================
/**
 * 创建算法控制面板悬浮窗
 * @param {string} imageId - 图像 ID
 * @returns {HTMLElement} - 控制面板窗口DOM元素
 */
function createControlPanel(imageId) {
    const windowId = 'control-panel';
    
    // 如果控制面板已存在，直接显示并返回
    const existingPanel = windowManager.getWindow(windowId);
    if (existingPanel) {
        existingPanel.element.style.display = 'flex';
        windowManager.setActiveWindow(existingPanel.element);
        return existingPanel.element;
    }
    
    // 计算窗口位置（原图右侧，错开不重叠）
    const canvas = document.getElementById('workflowCanvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    const windowX = canvasRect.width * 0.55; // 右侧位置（55%位置开始）
    const windowY = 50; // 顶部距离
    
    // 创建控制面板内容HTML
    const panelContent = `
        <!-- 噪声模块 -->
        <div class="control-module">
            <h4>噪声添加</h4>
            <label for="noiseType">噪声类型:</label>
            <select id="noiseType">
                <option value="gaussian">高斯噪声</option>
                <option value="poisson">泊松噪声</option>
                <option value="salt_pepper">椒盐噪声</option>
                <option value="speckle">斑点噪声</option>
            </select>
            <label for="noiseLevel">噪声强度:</label>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="range" id="noiseLevel" min="0" max="100" value="25" style="flex: 1;">
                <span id="noiseValue" style="min-width: 30px;">25</span>
            </div>
            <button class="apply-btn glass-button" id="applyNoise" style="width: 100%; margin-top: 10px;">应用噪声</button>
        </div>
        
        <!-- 滤波模块 -->
        <div class="control-module">
            <h4>图像滤波</h4>
            <label for="filterType">滤波类型:</label>
            <select id="filterType">
                <option value="mean">均值滤波</option>
                <option value="gaussian">高斯滤波</option>
                <option value="median">中值滤波</option>
            </select>
            <label for="kernelSize">核大小:</label>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="range" id="kernelSize" min="1" max="15" step="2" value="3" style="flex: 1;">
                <span id="kernelValue" style="min-width: 30px;">3</span>
            </div>
            <div style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px;">
                <label for="brightness">亮度调节:</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="range" id="brightness" min="-100" max="100" value="0" style="flex: 1;">
                    <span id="brightnessValue" style="min-width: 30px;">0</span>
                </div>
                <label for="contrast">对比度调节:</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="range" id="contrast" min="-100" max="100" value="0" style="flex: 1;">
                    <span id="contrastValue" style="min-width: 30px;">0</span>
                </div>
            </div>
            <button class="apply-btn glass-button" id="applyFilter" style="width: 100%; margin-top: 10px;">应用滤波</button>
        </div>
        
        <!-- 边缘检测模块 -->
        <div class="control-module">
            <h4>边缘检测</h4>
            <label for="edgeMethod">检测方法:</label>
            <select id="edgeMethod">
                <option value="roberts">Roberts</option>
                <option value="prewitt">Prewitt</option>
                <option value="sobel">Sobel</option>
                <option value="log">LoG</option>
                <option value="canny">Canny</option>
            </select>
            <div id="cannyParams" style="margin-top: 10px;">
                <label for="threshold1">阈值1:</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="range" id="threshold1" min="0" max="255" value="50" style="flex: 1;">
                    <span id="threshold1Value" style="min-width: 30px;">50</span>
                </div>
                <label for="threshold2">阈值2:</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="range" id="threshold2" min="0" max="255" value="150" style="flex: 1;">
                    <span id="threshold2Value" style="min-width: 30px;">150</span>
                </div>
            </div>
            <button class="apply-btn glass-button" id="applyEdge" style="width: 100%; margin-top: 10px;">应用边缘检测</button>
        </div>
        
        <!-- 阈值分割模块 -->
        <div class="control-module">
            <h4>阈值分割</h4>
            <label for="threshMethod">分割方法:</label>
            <select id="threshMethod">
                <option value="global">全局阈值</option>
                <option value="adaptive">自适应阈值</option>
                <option value="otsu">Otsu阈值</option>
            </select>
            <label for="threshValue">阈值:</label>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="range" id="threshValue" min="0" max="255" value="127" style="flex: 1;">
                <span id="threshValueDisplay" style="min-width: 30px;">127</span>
            </div>
            <button class="apply-btn glass-button" id="applyThreshold" style="width: 100%; margin-top: 10px;">应用阈值分割</button>
        </div>
        
        <!-- 形态学操作模块 -->
        <div class="control-module">
            <h4>形态学操作</h4>
            <label for="morphOperation">操作类型:</label>
            <select id="morphOperation">
                <option value="erode">腐蚀</option>
                <option value="dilate">膨胀</option>
                <option value="open">开运算</option>
                <option value="close">闭运算</option>
            </select>
            <label for="morphKernel">核大小:</label>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="range" id="morphKernel" min="1" max="15" step="2" value="3" style="flex: 1;">
                <span id="morphKernelValue" style="min-width: 30px;">3</span>
            </div>
            <label for="morphIterations">迭代次数:</label>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="range" id="morphIterations" min="1" max="10" value="1" style="flex: 1;">
                <span id="morphIterationsValue" style="min-width: 30px;">1</span>
            </div>
            <button class="apply-btn glass-button" id="applyMorph" style="width: 100%; margin-top: 10px;">应用形态学操作</button>
        </div>
    `;
    
    // 使用窗口管理器创建窗口
    const controlPanel = windowManager.createWindow(windowId, '算法控制面板', 'control-panel-window', {
        width: 320,
        height: 600,
        x: windowX,
        y: windowY,
        content: panelContent
    });
    
    // 存储图像ID
    controlPanel.dataset.imageId = imageId;
    
    // 修改关闭按钮行为（隐藏而不是销毁）
    const closeBtn = controlPanel.querySelector('.float-window-close');
    closeBtn.removeEventListener('click', windowManager.closeWindow.bind(windowManager, windowId));
    closeBtn.addEventListener('click', () => {
        controlPanel.style.display = 'none';
    });
    
    // 绑定所有控制面板事件
    bindControlPanelEvents(controlPanel);
    
    console.log(`控制面板创建成功: ${windowId}`);
    return controlPanel;
}

/**
 * 绑定控制面板事件
 * @param {HTMLElement} controlPanel - 控制面板窗口元素
 */
function bindControlPanelEvents(controlPanel) {
    // 滑块值显示更新
    const sliders = [
        { slider: 'noiseLevel', display: 'noiseValue' },
        { slider: 'kernelSize', display: 'kernelValue' },
        { slider: 'brightness', display: 'brightnessValue' },
        { slider: 'contrast', display: 'contrastValue' },
        { slider: 'threshold1', display: 'threshold1Value' },
        { slider: 'threshold2', display: 'threshold2Value' },
        { slider: 'threshValue', display: 'threshValueDisplay' },
        { slider: 'morphKernel', display: 'morphKernelValue' },
        { slider: 'morphIterations', display: 'morphIterationsValue' }
    ];
    
    sliders.forEach(({ slider, display }) => {
        const sliderElement = controlPanel.querySelector(`#${slider}`);
        const displayElement = controlPanel.querySelector(`#${display}`);
        if (sliderElement && displayElement) {
            sliderElement.addEventListener('input', function() {
                displayElement.textContent = this.value;
            });
        }
    });
    
    // 边缘检测方法切换时显示/隐藏Canny参数
    const edgeMethod = controlPanel.querySelector('#edgeMethod');
    const cannyParams = controlPanel.querySelector('#cannyParams');
    if (edgeMethod && cannyParams) {
        edgeMethod.addEventListener('change', function() {
            cannyParams.style.display = this.value === 'canny' ? 'block' : 'none';
        });
        // 初始化显示状态
        cannyParams.style.display = edgeMethod.value === 'canny' ? 'block' : 'none';
    }
    
    // 应用按钮事件绑定
    const applyButtons = [
        { btn: 'applyNoise', handler: applyNoiseFromPanel },
        { btn: 'applyFilter', handler: applyFilterFromPanel },
        { btn: 'applyEdge', handler: applyEdgeFromPanel },
        { btn: 'applyThreshold', handler: applyThresholdFromPanel },
        { btn: 'applyMorph', handler: applyMorphFromPanel }
    ];
    
    applyButtons.forEach(({ btn, handler }) => {
        const button = controlPanel.querySelector(`#${btn}`);
        if (button) {
            button.addEventListener('click', () => handler(controlPanel));
        }
    });
}

/**
 * 应用噪声（从控制面板）
 */
async function applyNoiseFromPanel(controlPanel) {
    const imageId = controlPanel.dataset.imageId;
    if (!imageId) {
        showError('请先上传图片！');
        return;
    }
    
    const noiseType = controlPanel.querySelector('#noiseType').value;
    const noiseLevel = parseFloat(controlPanel.querySelector('#noiseLevel').value);
    
    // 映射噪声类型到后端操作
    const operationMap = {
        'gaussian': 'noise_gaussian',
        'poisson': 'noise_poisson',
        'salt_pepper': 'noise_salt_pepper',
        'speckle': 'noise_speckle'
    };
    
    const operation = operationMap[noiseType];
    
    let parameters = {};
    if (noiseType === 'gaussian') {
        parameters = { mean: 0, sigma: noiseLevel };
    } else if (noiseType === 'salt_pepper') {
        parameters = { prob: noiseLevel / 1000 };
    } else if (noiseType === 'speckle') {
        parameters = { variance: noiseLevel / 100 };
    } else if (noiseType === 'poisson') {
        parameters = { scale: noiseLevel };
    }
    
    await processImageWithServer(operation, parameters);
}

/**
 * 应用滤波（从控制面板）
 */
async function applyFilterFromPanel(controlPanel) {
    const imageId = controlPanel.dataset.imageId;
    if (!imageId) {
        showError('请先上传图片！');
        return;
    }
    
    const filterType = controlPanel.querySelector('#filterType').value;
    const kernelSize = parseInt(controlPanel.querySelector('#kernelSize').value);
    const brightness = parseInt(controlPanel.querySelector('#brightness').value);
    const contrast = parseInt(controlPanel.querySelector('#contrast').value);
    
    const operationMap = {
        'mean': 'filter_mean',
        'gaussian': 'filter_gaussian',
        'median': 'filter_median'
    };
    
    const operation = operationMap[filterType];
    const parameters = {
        kernel_size: kernelSize,
        brightness: brightness,
        contrast: contrast
    };
    
    await processImageWithServer(operation, parameters);
}

/**
 * 应用边缘检测（从控制面板）
 */
async function applyEdgeFromPanel(controlPanel) {
    const imageId = controlPanel.dataset.imageId;
    if (!imageId) {
        showError('请先上传图片！');
        return;
    }
    
    const method = controlPanel.querySelector('#edgeMethod').value;
    const threshold1 = parseFloat(controlPanel.querySelector('#threshold1').value);
    const threshold2 = parseFloat(controlPanel.querySelector('#threshold2').value);
    
    const operationMap = {
        'roberts': 'edge_roberts',
        'prewitt': 'edge_prewitt',
        'sobel': 'edge_sobel',
        'log': 'edge_log',
        'canny': 'edge_canny'
    };
    
    const operation = operationMap[method];
    
    let parameters = {};
    if (method === 'canny') {
        parameters = { threshold1: threshold1, threshold2: threshold2 };
    } else if (method === 'log') {
        parameters = { ksize: 5 };
    } else {
        parameters = { ksize: 3 };
    }
    
    await processImageWithServer(operation, parameters);
}

/**
 * 应用阈值分割（从控制面板）
 */
async function applyThresholdFromPanel(controlPanel) {
    const imageId = controlPanel.dataset.imageId;
    if (!imageId) {
        showError('请先上传图片！');
        return;
    }
    
    const method = controlPanel.querySelector('#threshMethod').value;
    const thresholdValue = parseFloat(controlPanel.querySelector('#threshValue').value);
    
    const operationMap = {
        'global': 'threshold_global',
        'adaptive': 'threshold_adaptive',
        'otsu': 'threshold_otsu'
    };
    
    const operation = operationMap[method];
    
    let parameters = {};
    if (method === 'global') {
        parameters = { threshold: thresholdValue, max_val: 255 };
    } else if (method === 'adaptive') {
        parameters = { max_val: 255, block_size: 11, c: 2 };
    } else if (method === 'otsu') {
        parameters = { max_val: 255 };
    }
    
    await processImageWithServer(operation, parameters);
}

/**
 * 应用形态学操作（从控制面板）
 */
async function applyMorphFromPanel(controlPanel) {
    const imageId = controlPanel.dataset.imageId;
    if (!imageId) {
        showError('请先上传图片！');
        return;
    }
    
    const operationType = controlPanel.querySelector('#morphOperation').value;
    const kernelSize = parseInt(controlPanel.querySelector('#morphKernel').value);
    const iterations = parseInt(controlPanel.querySelector('#morphIterations').value);
    
    const operationMap = {
        'erode': 'morph_erode',
        'dilate': 'morph_dilate',
        'open': 'morph_open',
        'close': 'morph_close'
    };
    
    const operation = operationMap[operationType];
    const parameters = {
        kernel_size: kernelSize,
        iterations: iterations
    };
    
    await processImageWithServer(operation, parameters);
}

/**
 * 显示控制面板（从导航栏按钮调用）
 */
function showControlPanel() {
    const panel = windowManager.getWindow('control-panel');
    if (panel) {
        panel.element.style.display = 'flex';
        windowManager.setActiveWindow(panel.element);
    } else if (imageId) {
        // 如果面板不存在但有图像ID，创建新面板
        createControlPanel(imageId);
    } else {
        showInfo('请先上传图片后再使用控制面板');
    }
}

// ==================== 直方图悬浮弹窗功能 ====================
/**
 * 从 Canvas 元素计算直方图数据（前端实现）
 * @param {HTMLCanvasElement} canvas - Canvas 元素
 * @returns {object} - 直方图数据 {gray, r, g, b}
 */
function calculateHistogramFromCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    
    // 确保canvas有内容
    if (canvas.width === 0 || canvas.height === 0) {
        return null;
    }
    
    // 提取像素数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 初始化直方图数组（256个灰度级）
    const grayHist = new Array(256).fill(0);
    const rHist = new Array(256).fill(0);
    const gHist = new Array(256).fill(0);
    const bHist = new Array(256).fill(0);
    
    // 遍历所有像素（RGBA格式，每4个字节一个像素）
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // 计算灰度值（加权平均法）
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        
        // 统计直方图
        grayHist[gray]++;
        rHist[r]++;
        gHist[g]++;
        bHist[b]++;
    }
    
    return {
        gray: grayHist,
        r: rHist,
        g: gHist,
        b: bHist
    };
}

/**
 * 创建灰度/RGB直方图悬浮弹窗（支持前端计算）
 * @param {string} imageId - 图像 ID（可选，原始图像使用）
 * @param {HTMLCanvasElement} canvas - Canvas 元素（可选，处理结果使用）
 * @param {string} windowTitle - 窗口标题
 * @param {object} position - 窗口位置 {x, y}
 */
function createHistogramWindow(imageId, canvas, windowTitle, position) {
    const windowId = `histogram-${histogramWindowCount++}`;
    
    const canvasElement = document.getElementById('workflowCanvas');
    const canvasRect = canvasElement.getBoundingClientRect();
    
    // 计算窗口位置（在激活窗口下方就近位置）
    const windowX = position.x || canvasRect.width - 450;
    const windowY = position.y || 50;
    
    // 创建直方图容器HTML（固定比例布局）
    const histogramContent = `
        <div style="display: flex; flex-direction: column; gap: 20px; padding: 10px;">
            <!-- 灰度直方图 -->
            <div style="flex: 1; min-height: 180px;">
                <h4 style="font-size: 14px; margin-bottom: 10px; color: #333;">灰度直方图</h4>
                <div style="position: relative; height: 160px;">
                    <canvas id="grayHistogram-${windowId}"></canvas>
                </div>
            </div>
            
            <!-- RGB三通道直方图 -->
            <div style="flex: 1; min-height: 180px;">
                <h4 style="font-size: 14px; margin-bottom: 10px; color: #333;">RGB通道直方图</h4>
                <div style="position: relative; height: 160px;">
                    <canvas id="rgbHistogram-${windowId}"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // 使用窗口管理器创建窗口（固定尺寸）
    const histogramWindow = windowManager.createWindow(windowId, windowTitle, 'histogram-window', {
        width: 500,  // 固定宽度 500px
        height: 420, // 固定高度 420px（合适的比例）
        x: windowX,
        y: windowY,
        content: histogramContent
    });
    
    // 存储窗口信息
    if (imageId) {
        histogramWindow.dataset.imageId = imageId;
    }
    histogramWindow.dataset.histogramId = windowId;
    
    // 计算直方图数据
    if (canvas) {
        // 从 Canvas 元素计算直方图（前端计算）
        showLoading('正在计算直方图...');
        
        setTimeout(() => {
            try {
                const histogramData = calculateHistogramFromCanvas(canvas);
                
                if (histogramData) {
                    // 渲染灰度直方图
                    renderGrayHistogram(histogramData.gray, windowId);
                    
                    // 渲染RGB直方图
                    renderRGBHistogram({
                        r: histogramData.r,
                        g: histogramData.g,
                        b: histogramData.b
                    }, windowId);
                    
                    showSuccess('直方图生成成功！');
                } else {
                    showError('直方图计算失败：图像数据为空');
                }
            } catch (error) {
                console.error('直方图计算错误:', error);
                showError('直方图计算失败: ' + error.message);
            } finally {
                hideLoading();
            }
        }, 100); // 延迟100ms确保Canvas渲染完成
    } else if (imageId) {
        // 从后端获取直方图数据
        fetchHistogramData(imageId, windowId);
    } else {
        showError('缺少图像数据');
    }
    
    console.log(`直方图窗口创建成功: ${windowId}`);
    return histogramWindow;
}

/**
 * 获取直方图数据（调用后端API）
 * @param {string} imageId - 图像 ID
 * @param {string} windowId - 窗口 ID
 */
async function fetchHistogramData(imageId, windowId) {
    try {
        showLoading('正在生成直方图...');
        
        const response = await fetch(`${API_BASE_URL}/get_histogram`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image_id: imageId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 检查直方图数据格式（后端返回的是 histogram 而不是 gray_histogram/rgb_histogram）
            if (result.histogram) {
                // 后端返回的直方图数据格式
                const histogramData = result.histogram;
                
                // 渲染灰度直方图
                if (histogramData.gray) {
                    renderGrayHistogram(histogramData.gray, windowId);
                }
                
                // 渲染RGB直方图
                if (histogramData.r && histogramData.g && histogramData.b) {
                    renderRGBHistogram({
                        r: histogramData.r,
                        g: histogramData.g,
                        b: histogramData.b
                    }, windowId);
                }
            }
            
            showSuccess('直方图生成成功！');
        } else {
            showError('直方图生成失败: ' + result.error);
        }
        
    } catch (error) {
        console.error('直方图数据获取错误:', error);
        showError('服务器连接失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * 渲染灰度直方图（Chart.js）
 * @param {array} grayData - 灰度直方图数据
 * @param {string} windowId - 窗口 ID
 */
function renderGrayHistogram(grayData, windowId) {
    const canvas = document.getElementById(`grayHistogram-${windowId}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 销毁已有图表实例
    if (window[`${windowId}_grayChart`]) {
        window[`${windowId}_grayChart`].destroy();
    }
    
    // 创建灰度直方图
    window[`${windowId}_grayChart`] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 256}, (_, i) => i),
            datasets: [{
                label: '灰度值分布',
                data: grayData,
                backgroundColor: 'rgba(100, 100, 100, 0.6)',
                borderColor: 'rgba(100, 100, 100, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '灰度值'
                    },
                    ticks: {
                        maxTicksLimit: 20
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '像素数量'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * 渲染RGB三通道直方图（Chart.js）
 * @param {object} rgbData - RGB直方图数据 {r, g, b}
 * @param {string} windowId - 窗口 ID
 */
function renderRGBHistogram(rgbData, windowId) {
    const canvas = document.getElementById(`rgbHistogram-${windowId}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 销毁已有图表实例
    if (window[`${windowId}_rgbChart`]) {
        window[`${windowId}_rgbChart`].destroy();
    }
    
    // 创建RGB直方图
    window[`${windowId}_rgbChart`] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 256}, (_, i) => i),
            datasets: [
                {
                    label: 'R通道',
                    data: rgbData.r,
                    borderColor: 'rgba(255, 0, 0, 0.8)',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'G通道',
                    data: rgbData.g,
                    borderColor: 'rgba(0, 255, 0, 0.8)',
                    backgroundColor: 'rgba(0, 255, 0, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'B通道',
                    data: rgbData.b,
                    borderColor: 'rgba(0, 0, 255, 0.8)',
                    backgroundColor: 'rgba(0, 0, 255, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '像素值'
                    },
                    ticks: {
                        maxTicksLimit: 20
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '像素数量'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * 导出直方图按钮点击事件（支持自由选择任意图像）
 */
function exportHistogram() {
    // 检查是否有图像
    if (!imageId && !activeImageWindowId) {
        showInfo('请先上传图片后再导出直方图');
        return;
    }
    
    // 优先使用激活的图像窗口
    if (activeImageWindowId) {
        const activeWindow = windowManager.getWindow(activeImageWindowId);
        if (activeWindow && activeWindow.element.style.display !== 'none') {
            // 获取窗口中的 canvas 元素
            const canvas = activeWindow.element.querySelector('canvas');
            if (canvas) {
                // 计算位置（在激活窗口下方）
                const windowX = parseFloat(activeWindow.element.style.left);
                const windowY = parseFloat(activeWindow.element.style.top) + parseFloat(activeWindow.element.style.height) + 30;
                
                // 确保不超出画布底部
                const canvasElement = document.getElementById('workflowCanvas');
                const canvasRect = canvasElement.getBoundingClientRect();
                
                let targetPosition;
                if (windowY + 420 > canvasRect.height - 30) {
                    // 如果超出底部，换到右侧
                    targetPosition = { x: canvasRect.width - 520, y: 50 };
                } else {
                    targetPosition = { x: windowX, y: windowY };
                }
                
                // 窗口标题
                const title = activeWindow.element.querySelector('.float-window-title').textContent;
                
                // 创建直方图窗口（使用 canvas 参数，前端计算）
                createHistogramWindow(null, canvas, `${title} - 直方图`, targetPosition);
                return;
            }
        }
    }
    
    // 如果没有激活窗口，使用原始图像
    // 目标窗口标题和位置
    let targetWindowTitle = '原始图像 - 直方图';
    let targetPosition = { x: 100, y: 100 };
    
    // 查找最后一个原始图像窗口
    const lastOriginalWindowId = `original-image-${Math.max(0, imageWindowCount - 1)}`;
    const originalWindow = windowManager.getWindow(lastOriginalWindowId);
    
    if (originalWindow && originalWindow.element.style.display !== 'none') {
        // 获取原始图像窗口的 canvas 元素
        const canvas = originalWindow.element.querySelector('canvas');
        
        if (canvas) {
            // 计算位置（在原始图像窗口下方）
            const windowX = parseFloat(originalWindow.element.style.left);
            const windowY = parseFloat(originalWindow.element.style.top) + parseFloat(originalWindow.element.style.height) + 30;
            
            // 确保不超出画布底部
            const canvasElement = document.getElementById('workflowCanvas');
            const canvasRect = canvasElement.getBoundingClientRect();
            
            if (windowY + 420 > canvasRect.height - 30) {
                // 如果超出底部，换到右侧
                targetPosition = { x: canvasRect.width - 520, y: 50 };
            } else {
                targetPosition = { x: windowX, y: windowY };
            }
            
            targetWindowTitle = `${originalWindow.element.querySelector('.float-window-title').textContent} - 直方图`;
            
            // 创建直方图窗口（使用 canvas 参数，前端计算）
            createHistogramWindow(null, canvas, targetWindowTitle, targetPosition);
        } else {
            // 如果找不到 canvas，使用 imageId 从后端获取
            createHistogramWindow(imageId, null, targetWindowTitle, targetPosition);
        }
    } else {
        // 如果没有原始图像窗口，使用 imageId 从后端获取
        createHistogramWindow(imageId, null, targetWindowTitle, targetPosition);
    }
}

/**
 * 销毁所有直方图弹窗（重置时调用）
 */
function destroyAllHistograms() {
    const histogramWindows = windowManager.getAllWindows().filter(w => w.type === 'histogram-window');
    
    histogramWindows.forEach(w => {
        // 销毁Chart.js实例
        const windowId = w.element.id;
        if (window[`${windowId}_grayChart`]) {
            window[`${windowId}_grayChart`].destroy();
            delete window[`${windowId}_grayChart`];
        }
        if (window[`${windowId}_rgbChart`]) {
            window[`${windowId}_rgbChart`].destroy();
            delete window[`${windowId}_rgbChart`];
        }
        
        // 关闭窗口
        windowManager.closeWindow(windowId);
    });
    
    console.log('所有直方图弹窗已销毁');
}