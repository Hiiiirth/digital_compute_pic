"""
工具函数模块
包含Base64转换、缓存、采样等工具函数
"""

import base64
import cv2
import numpy as np
import os
import time
from typing import Tuple, Optional, Dict
from io import BytesIO
from PIL import Image
from functools import wraps


# ==================== Base64转换 ====================
def image_to_base64(image: np.ndarray, format: str = '.png') -> str:
    """
    将OpenCV图像转换为Base64字符串

    Args:
        image: OpenCV图像数组 (BGR格式)
        format: 图像格式 ('.png', '.jpg')

    Returns:
        Base64编码的字符串
    """
    try:
        # 将OpenCV图像编码为指定格式
        success, buffer = cv2.imencode(format, image)

        if not success:
            raise ValueError("图像编码失败")

        # 转换为Base64
        base64_str = base64.b64encode(buffer).decode('utf-8')

        # 添加数据前缀
        mime_type = 'image/png' if format == '.png' else 'image/jpeg'
        return f"data:{mime_type};base64,{base64_str}"

    except Exception as e:
        print(f"图像转Base64错误: {e}")
        return ""


def base64_to_image(base64_str: str) -> Optional[np.ndarray]:
    """
    将Base64字符串转换为OpenCV图像

    Args:
        base64_str: Base64编码的字符串

    Returns:
        OpenCV图像数组 (BGR格式)，失败返回None
    """
    try:
        # 移除数据前缀
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]

        # 解码Base64
        image_data = base64.b64decode(base64_str)

        # 转换为PIL图像
        pil_image = Image.open(BytesIO(image_data))

        # 转换为OpenCV格式 (RGB -> BGR)
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

        return opencv_image

    except Exception as e:
        print(f"Base64转图像错误: {e}")
        return None


# ==================== 降采样与缩放 ====================
def resize_image(image: np.ndarray, max_size: Tuple[int, int] = (800, 600)) -> np.ndarray:
    """
    调整图像大小以适应显示（降采样优化）

    Args:
        image: 输入图像
        max_size: 最大尺寸 (宽, 高)

    Returns:
        调整后的图像
    """
    try:
        h, w = image.shape[:2]

        # 如果图像尺寸已经在范围内，直接返回
        if w <= max_size[0] and h <= max_size[1]:
            return image

        # 计算缩放比例，保持宽高比
        scale_w = max_size[0] / w
        scale_h = max_size[1] / h
        scale = min(scale_w, scale_h)

        # 新尺寸
        new_w = int(w * scale)
        new_h = int(h * scale)

        # 使用高质量插值方法
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)

        return resized
    except Exception as e:
        print(f"图像缩放错误: {e}")
        return image


def create_thumbnail(image: np.ndarray, size: Tuple[int, int] = (150, 150)) -> np.ndarray:
    """
    创建缩略图

    Args:
        image: 输入图像
        size: 缩略图尺寸 (宽, 高)

    Returns:
        缩略图
    """
    try:
        return resize_image(image, size)
    except Exception as e:
        print(f"创建缩略图错误: {e}")
        return image


# ==================== 缓存机制 ====================
class ImageCache:
    """图像缓存管理类"""

    def __init__(self, max_size: int = 5):
        """
        初始化缓存

        Args:
            max_size: 最大缓存数量
        """
        self.cache = {}
        self.max_size = max_size

    def get(self, key: str) -> Optional[np.ndarray]:
        """
        从缓存获取图像

        Args:
            key: 缓存键

        Returns:
            缓存的图像，不存在返回None
        """
        return self.cache.get(key)

    def set(self, key: str, image: np.ndarray) -> None:
        """
        设置缓存

        Args:
            key: 缓存键
            image: 要缓存的图像
        """
        # 如果缓存已满，删除最早的项
        if len(self.cache) >= self.max_size:
            oldest_key = next(iter(self.cache))
            self.cache.pop(oldest_key)

        self.cache[key] = image.copy()

    def clear(self) -> None:
        """清空缓存"""
        self.cache.clear()

    def contains(self, key: str) -> bool:
        """
        检查缓存是否存在

        Args:
            key: 缓存键

        Returns:
            是否存在
        """
        return key in self.cache


# 全局图像缓存实例
image_cache = ImageCache(max_size=10)


def cache_result(func):
    """
    结果缓存装饰器
    用于缓存图像处理结果，提高性能
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # 生成缓存键
        cache_key = f"{func.__name__}_{str(args)}_{str(kwargs)}"

        # 检查缓存
        cached_result = image_cache.get(cache_key)
        if cached_result is not None:
            return cached_result

        # 执行函数
        result = func(*args, **kwargs)

        # 缓存结果
        if isinstance(result, np.ndarray):
            image_cache.set(cache_key, result)

        return result

    return wrapper


# ==================== 节流控制 ====================
class ThrottleController:
    """请求节流控制器"""

    def __init__(self):
        self.last_request_time = {}
        self.min_interval = 0.1  # 最小间隔时间（秒）

    def can_request(self, key: str) -> bool:
        """
        检查是否可以发送请求

        Args:
            key: 请求键

        Returns:
            是否可以请求
        """
        current_time = time.time()

        if key not in self.last_request_time:
            self.last_request_time[key] = current_time
            return True

        time_diff = current_time - self.last_request_time[key]

        if time_diff >= self.min_interval:
            self.last_request_time[key] = current_time
            return True

        return False


# 全局节流控制器
throttle_controller = ThrottleController()


def throttle_request(interval: float = 0.1):
    """
    请求节流装饰器
    用于控制请求频率，防止高频调用

    Args:
        interval: 最小间隔时间（秒）
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 使用函数名作为键
            key = func.__name__

            # 检查是否可以执行
            if not throttle_controller.can_request(key):
                return None

            return func(*args, **kwargs)

        return wrapper

    return decorator


# ==================== 直方图数据提取 ====================
def extract_histogram_data(image: np.ndarray) -> Dict:
    """
    提取直方图数据供前端Chart.js使用

    Args:
        image: 输入图像

    Returns:
        直方图数据字典
    """
    try:
        result = {}

        # 灰度直方图
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image

        hist_gray = cv2.calcHist([gray], [0], None, [256], [0, 256])
        result['gray'] = hist_gray.flatten().tolist()

        # RGB直方图（如果是彩色图像）
        if len(image.shape) == 3:
            hist_b = cv2.calcHist([image], [0], None, [256], [0, 256])
            hist_g = cv2.calcHist([image], [1], None, [256], [0, 256])
            hist_r = cv2.calcHist([image], [2], None, [256], [0, 256])

            result['r'] = hist_r.flatten().tolist()
            result['g'] = hist_g.flatten().tolist()
            result['b'] = hist_b.flatten().tolist()
        else:
            # 灰度图像的RGB直方图数据（灰度值复制到三个通道）
            result['r'] = result['gray']
            result['g'] = result['gray']
            result['b'] = result['gray']

        return result

    except Exception as e:
        print(f"直方图数据提取错误: {e}")
        return {'gray': [], 'r': [], 'g': [], 'b': []}


# ==================== 文件读写 ====================
def save_image_to_file(image: np.ndarray, filepath: str) -> bool:
    """
    将图像保存到文件

    Args:
        image: OpenCV图像数组
        filepath: 文件路径

    Returns:
        是否成功
    """
    try:
        # 确保目录存在
        directory = os.path.dirname(filepath)
        if directory and not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)

        # 保存图像
        success = cv2.imwrite(filepath, image)

        return success
    except Exception as e:
        print(f"图像保存错误: {e}")
        return False


def load_image_from_file(filepath: str) -> Optional[np.ndarray]:
    """
    从文件加载图像

    Args:
        filepath: 文件路径

    Returns:
        OpenCV图像数组，失败返回None
    """
    try:
        if not os.path.exists(filepath):
            print(f"文件不存在: {filepath}")
            return None

        image = cv2.imread(filepath)

        if image is None:
            print(f"图像加载失败: {filepath}")
            return None

        return image
    except Exception as e:
        print(f"图像加载错误: {e}")
        return None


def generate_filename(prefix: str = 'image', extension: str = '.png') -> str:
    """
    生成唯一文件名

    Args:
        prefix: 文件名前缀
        extension: 文件扩展名

    Returns:
        文件名
    """
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    filename = f"{prefix}_{timestamp}{extension}"
    return filename


# ==================== 图像信息 ====================
def get_image_info(image: np.ndarray) -> Dict:
    """
    获取图像基本信息

    Args:
        image: OpenCV图像数组

    Returns:
        图像信息字典
    """
    try:
        info = {
            'height': image.shape[0],
            'width': image.shape[1],
            'channels': image.shape[2] if len(image.shape) == 3 else 1,
            'dtype': str(image.dtype),
            'size': image.size,
            'memory_size': image.nbytes
        }

        return info
    except Exception as e:
        print(f"获取图像信息错误: {e}")
        return {}


# ==================== 其他工具 ====================
def ensure_odd(value: int) -> int:
    """
    确保数值为奇数（用于核大小）

    Args:
        value: 输入值

    Returns:
        奇数值
    """
    return value if value % 2 != 0 else value + 1


def clamp(value, min_val, max_val):
    """
    限制值在范围内

    Args:
        value: 输入值
        min_val: 最小值
        max_val: 最大值

    Returns:
        限制后的值
    """
    return max(min_val, min(max_val, value))