"""
Flask服务主程序
负责处理前端请求，调用图像处理算法，返回处理结果
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import sys
import uuid
import threading
import time
import glob
from datetime import datetime, timedelta

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.processor import ImageProcessor
from backend.utils import (
    image_to_base64,
    base64_to_image,
    resize_image,
    extract_histogram_data,
    save_image_to_file,
    generate_filename,
    image_cache
)

# 创建Flask应用
app = Flask(__name__,
            template_folder='../frontend',
            static_folder='../frontend/static')

# 生产环境安全配置
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'

# 配置跨域
CORS(app)

# 配置上传文件保存路径
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'temp')
SAVED_FOLDER = os.path.join(UPLOAD_FOLDER, 'saved')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SAVED_FOLDER'] = SAVED_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 限制上传文件大小 16MB

# 确保目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SAVED_FOLDER, exist_ok=True)

# 初始化图像处理器
processor = ImageProcessor()

# 存储上传的原始图像（用于防抖缓存）
uploaded_images = {}

# 存储原图完整分辨率数据（用于导出）
original_full_images = {}


# ==================== 定时清理功能 ====================
def cleanup_temp_files():
    """
    定时清理temp文件夹中的旧文件
    清理超过1小时的临时文件，防止磁盘空间堆积
    """
    while True:
        try:
            # 每小时清理一次
            time.sleep(3600)  # 1小时 = 3600秒

            current_time = datetime.now()
            cutoff_time = current_time - timedelta(hours=1)

            # 清理temp目录中的临时文件
            temp_pattern = os.path.join(UPLOAD_FOLDER, '*.*')
            temp_files = glob.glob(temp_pattern)

            # 保留saved子目录
            for file_path in temp_files:
                if os.path.isfile(file_path):
                    # 检查文件修改时间
                    file_mtime = datetime.fromtimestamp(os.path.getmtime(file_path))

                    if file_mtime < cutoff_time:
                        try:
                            os.remove(file_path)
                            print(f"[清理] 已删除临时文件: {file_path}")
                        except Exception as e:
                            print(f"[清理错误] 无法删除 {file_path}: {e}")

            # 清理saved目录中的旧文件（保留最近24小时的）
            saved_cutoff = current_time - timedelta(hours=24)
            saved_pattern = os.path.join(SAVED_FOLDER, '*.*')
            saved_files = glob.glob(saved_pattern)

            for file_path in saved_files:
                if os.path.isfile(file_path):
                    file_mtime = datetime.fromtimestamp(os.path.getmtime(file_path))

                    if file_mtime < saved_cutoff:
                        try:
                            os.remove(file_path)
                            print(f"[清理] 已删除保存文件: {file_path}")
                        except Exception as e:
                            print(f"[清理错误] 无法删除 {file_path}: {e}")

            print(f"[清理完成] temp文件夹清理完成，时间: {current_time}")

        except Exception as e:
            print(f"[清理错误] 定时清理失败: {e}")


# 启动定时清理线程（在后台运行）
cleanup_thread = threading.Thread(target=cleanup_temp_files, daemon=True)
cleanup_thread.start()
print("[系统] 定时清理线程已启动，每小时清理一次临时文件")


@app.route('/')
def index():
    """主页路由"""
    return render_template('index.html')


@app.route('/api/upload_img', methods=['POST'])
def upload_image():
    """
    上传图片接口
    接收前端上传原图，缓存图像数据并返回预览图

    Returns:
        JSON响应包含图像ID和预览图Base64
    """
    try:
        # 获取上传的图像数据
        if 'file' in request.files:
            # 文件上传方式
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': '未选择文件'}), 400

            # 读取文件并转换为OpenCV格式
            file_bytes = file.read()
            import numpy as np
            image_array = np.frombuffer(file_bytes, dtype=np.uint8)
            image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        elif 'image_data' in request.json:
            # Base64上传方式
            base64_data = request.json['image_data']
            image = base64_to_image(base64_data)

            if image is None:
                return jsonify({'error': '图像解码失败'}), 400

        else:
            return jsonify({'error': '未提供图像数据'}), 400

        # 生成唯一图像ID
        image_id = str(uuid.uuid4())

        # 缓存原始图像（用于快速处理）
        uploaded_images[image_id] = image.copy()
        image_cache.set(f'original_{image_id}', image)

        # 缓存完整分辨率原图（用于导出）
        original_full_images[image_id] = image.copy()

        # 创建预览图（降采样）
        preview_image = resize_image(image, (800, 600))

        # 转换为Base64
        preview_base64 = image_to_base64(preview_image)

        # 提取直方图数据
        histogram_data = extract_histogram_data(image)

        # 返回响应
        return jsonify({
            'success': True,
            'image_id': image_id,
            'preview': preview_base64,
            'histogram': histogram_data,
            'width': image.shape[1],
            'height': image.shape[0],
            'is_large_image': image.shape[1] > 800 or image.shape[0] > 600
        })

    except Exception as e:
        print(f"上传图像错误: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/process_img', methods=['POST'])
def process_image():
    """
    图像处理接口
    接收前端传递的算法类型、参数，调用ImageProcessor处理图像，返回处理后图片+直方图数据

    Returns:
        JSON响应包含处理后的图像和直方图数据
    """
    try:
        # 获取请求参数
        data = request.json

        image_id = data.get('image_id')
        operation = data.get('operation')
        parameters = data.get('parameters', {})

        # 检查必要参数
        if not image_id:
            return jsonify({'error': '缺少图像ID'}), 400

        if not operation:
            return jsonify({'error': '缺少操作类型'}), 400

        # 从缓存获取原始图像
        original_image = uploaded_images.get(image_id)

        if original_image is None:
            return jsonify({'error': '图像未找到，请重新上传'}), 404

        # 检查是否有缓存的处理结果
        cache_key = f"{image_id}_{operation}_{str(parameters)}"
        cached_result = image_cache.get(cache_key)

        if cached_result is not None:
            # 使用缓存的结果
            processed_image = cached_result
        else:
            # 处理图像
            processed_image = processor.process_image(original_image, operation, **parameters)

            # 缓存处理结果
            image_cache.set(cache_key, processed_image)

        # 创建预览图（用于前端显示）
        preview_processed = resize_image(processed_image, (800, 600))

        # 转换为Base64（预览图）
        preview_base64 = image_to_base64(preview_processed)

        # 同时保存完整分辨率处理结果（用于导出）
        processed_full_base64 = image_to_base64(processed_image)

        # 提取直方图数据
        histogram_data = extract_histogram_data(processed_image)

        # 返回响应
        return jsonify({
            'success': True,
            'processed_image': preview_base64,
            'processed_full_image': processed_full_base64,  # 完整分辨率图像
            'histogram': histogram_data,
            'width': processed_image.shape[1],
            'height': processed_image.shape[0],
            'is_large_image': processed_image.shape[1] > 800 or processed_image.shape[0] > 600
        })

    except Exception as e:
        print(f"图像处理错误: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/save_img', methods=['POST'])
def save_image():
    """
    保存图片接口（支持完整分辨率导出）
    接收图片base64，保存至本地电脑指定文件夹

    Returns:
        JSON响应包含保存路径
    """
    try:
        # 获取请求参数
        data = request.json

        image_data = data.get('image_data')
        use_full_resolution = data.get('full_resolution', True)  # 默认导出完整分辨率
        image_id = data.get('image_id')  # 用于获取原图

        filename = data.get('filename', 'processed_image.png')

        # 检查必要参数
        if not image_data and not image_id:
            return jsonify({'error': '缺少图像数据或图像ID'}), 400

        # 优先使用完整分辨率图像
        if use_full_resolution and image_id:
            # 如果有image_id，尝试获取完整分辨率处理结果
            # 这里使用前端传递的processed_full_image数据
            full_image_data = data.get('full_image_data')

            if full_image_data:
                image_data = full_image_data

        # 解码Base64图像
        image = base64_to_image(image_data)

        if image is None:
            return jsonify({'error': '图像解码失败'}), 400

        # 生成保存路径
        if not filename.endswith('.png') and not filename.endswith('.jpg'):
            filename = generate_filename('processed', '.png')

        filepath = os.path.join(app.config['SAVED_FOLDER'], filename)

        # 保存图像
        success = save_image_to_file(image, filepath)

        if success:
            # 返回文件信息
            file_size = os.path.getsize(filepath)

            return jsonify({
                'success': True,
                'filepath': filepath,
                'filename': filename,
                'width': image.shape[1],
                'height': image.shape[0],
                'file_size': file_size,
                'resolution': 'full' if use_full_resolution else 'preview'
            })
        else:
            return jsonify({'error': '图像保存失败'}), 500

    except Exception as e:
        print(f"保存图像错误: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/reset', methods=['POST'])
def reset():
    """
    重置接口
    清空缓存、重置所有图像与图表

    Returns:
        JSON响应表示重置成功
    """
    try:
        # 获取请求参数
        data = request.json
        image_id = data.get('image_id')

        # 清空上传的图像
        if image_id:
            uploaded_images.pop(image_id, None)
            original_full_images.pop(image_id, None)

        # 清空缓存
        image_cache.clear()

        # 返回响应
        return jsonify({
            'success': True,
            'message': '已清空所有缓存',
            'cached_images': len(uploaded_images),
            'full_images': len(original_full_images)
        })

    except Exception as e:
        print(f"重置错误: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/get_histogram', methods=['POST'])
def get_histogram():
    """
    获取直方图数据接口

    Returns:
        JSON响应包含直方图数据
    """
    try:
        # 获取请求参数
        data = request.json
        image_id = data.get('image_id')

        # 从缓存获取图像
        image = uploaded_images.get(image_id)

        if image is None:
            return jsonify({'error': '图像未找到'}), 404

        # 提取直方图数据
        histogram_data = extract_histogram_data(image)

        # 返回响应
        return jsonify({
            'success': True,
            'histogram': histogram_data
        })

    except Exception as e:
        print(f"获取直方图错误: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    健康检查接口

    Returns:
        JSON响应表示服务状态
    """
    # 统计缓存信息
    temp_files = len(glob.glob(os.path.join(UPLOAD_FOLDER, '*.*')))
    saved_files = len(glob.glob(os.path.join(SAVED_FOLDER, '*.*')))

    return jsonify({
        'status': 'healthy',
        'service': 'image_processing_web_system',
        'version': '1.0.0',
        'cached_images': len(uploaded_images),
        'full_resolution_images': len(original_full_images),
        'temp_files': temp_files,
        'saved_files': saved_files,
        'cleanup_thread_active': cleanup_thread.is_alive()
    })


if __name__ == '__main__':
    print("=" * 50)
    print("数字图像处理Web系统 - Flask服务器")
    print("=" * 50)
    
    # 从环境变量读取配置，支持本地开发和生产部署
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    debug = app.config['DEBUG']
    
    print(f"服务器地址: http://{host}:{port}")
    print(f"调试模式: {'开启' if debug else '关闭'}")
    print(f"临时文件路径: {UPLOAD_FOLDER}")
    print(f"保存文件路径: {SAVED_FOLDER}")
    print(f"支持的功能: 噪声、滤波、边缘检测、形态学、阈值分割")
    print(f"性能优化: 缓存机制、降采样预览、完整分辨率导出")
    print(f"自动清理: 每小时清理临时文件，每24小时清理保存文件")
    print("=" * 50)

    app.run(debug=debug, host=host, port=port)