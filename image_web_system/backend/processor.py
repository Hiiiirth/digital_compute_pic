"""
核心图像处理算法类
包含噪声添加、滤波、边缘检测、形态学操作、阈值分割等功能
"""

import cv2
import numpy as np
from typing import Tuple, Optional, Dict


class ImageProcessor:
    """图像处理器类"""

    def __init__(self):
        """初始化图像处理器"""
        pass

    # ==================== 噪声生成 ====================
    @staticmethod
    def add_gaussian_noise(image: np.ndarray, mean: float = 0, sigma: float = 25) -> np.ndarray:
        """
        添加高斯噪声

        Args:
            image: 输入图像
            mean: 噪声均值
            sigma: 噪声标准差

        Returns:
            添加高斯噪声后的图像
        """
        try:
            # 生成高斯噪声
            gauss = np.random.normal(mean, sigma, image.shape).astype(np.float32)
            # 添加噪声并限制范围
            noisy = image.astype(np.float32) + gauss
            noisy = np.clip(noisy, 0, 255).astype(np.uint8)
            return noisy
        except Exception as e:
            print(f"添加高斯噪声错误: {e}")
            return image

    @staticmethod
    def add_poisson_noise(image: np.ndarray) -> np.ndarray:
        """
        添加泊松噪声

        Args:
            image: 输入图像

        Returns:
            添加泊松噪声后的图像
        """
        try:
            # 泊松噪声模拟
            vals = image.astype(np.float32)
            noisy = np.random.poisson(vals).astype(np.uint8)
            return noisy
        except Exception as e:
            print(f"添加泊松噪声错误: {e}")
            return image

    @staticmethod
    def add_salt_pepper_noise(image: np.ndarray, prob: float = 0.02) -> np.ndarray:
        """
        添加椒盐噪声

        Args:
            image: 输入图像
            prob: 噪声概率

        Returns:
            添加椒盐噪声后的图像
        """
        try:
            noisy = image.copy()
            # 盐噪声（白点）
            num_salt = int(prob * image.size * 0.5)
            coords = [np.random.randint(0, i - 1, num_salt) for i in image.shape[:2]]
            noisy[coords[0], coords[1], :] = 255 if len(image.shape) == 3 else 255

            # 椒噪声（黑点）
            num_pepper = int(prob * image.size * 0.5)
            coords = [np.random.randint(0, i - 1, num_pepper) for i in image.shape[:2]]
            noisy[coords[0], coords[1], :] = 0 if len(image.shape) == 3 else 0

            return noisy
        except Exception as e:
            print(f"添加椒盐噪声错误: {e}")
            return image

    @staticmethod
    def add_speckle_noise(image: np.ndarray, variance: float = 0.1) -> np.ndarray:
        """
        添加斑点噪声

        Args:
            image: 输入图像
            variance: 噪声方差

        Returns:
            添加斑点噪声后的图像
        """
        try:
            gauss = np.random.randn(*image.shape).astype(np.float32) * variance
            noisy = image.astype(np.float32) + image.astype(np.float32) * gauss
            noisy = np.clip(noisy, 0, 255).astype(np.uint8)
            return noisy
        except Exception as e:
            print(f"添加斑点噪声错误: {e}")
            return image

    # ==================== 滤波算法 ====================
    @staticmethod
    def mean_filter(image: np.ndarray, kernel_size: int = 3) -> np.ndarray:
        """
        均值滤波

        Args:
            image: 输入图像
            kernel_size: 核大小

        Returns:
            滤波后的图像
        """
        try:
            kernel_size = max(1, kernel_size)
            return cv2.blur(image, (kernel_size, kernel_size))
        except Exception as e:
            print(f"均值滤波错误: {e}")
            return image

    @staticmethod
    def gaussian_filter(image: np.ndarray, kernel_size: int = 3, sigma: float = 0) -> np.ndarray:
        """
        高斯滤波

        Args:
            image: 输入图像
            kernel_size: 核大小
            sigma: 标准差

        Returns:
            滤波后的图像
        """
        try:
            kernel_size = max(1, kernel_size | 1)  # 确保为奇数
            return cv2.GaussianBlur(image, (kernel_size, kernel_size), sigma)
        except Exception as e:
            print(f"高斯滤波错误: {e}")
            return image

    @staticmethod
    def median_filter(image: np.ndarray, kernel_size: int = 3) -> np.ndarray:
        """
        中值滤波

        Args:
            image: 输入图像
            kernel_size: 核大小

        Returns:
            滤波后的图像
        """
        try:
            kernel_size = max(1, kernel_size | 1)  # 确保为奇数
            return cv2.medianBlur(image, kernel_size)
        except Exception as e:
            print(f"中值滤波错误: {e}")
            return image

    @staticmethod
    def bilateral_filter(image: np.ndarray, d: int = 9, sigma_color: float = 75,
                         sigma_space: float = 75) -> np.ndarray:
        """
        双边滤波

        Args:
            image: 输入图像
            d: 像素邻域直径
            sigma_color: 颜色空间标准差
            sigma_space: 坐标空间标准差

        Returns:
            滤波后的图像
        """
        try:
            return cv2.bilateralFilter(image, d, sigma_color, sigma_space)
        except Exception as e:
            print(f"双边滤波错误: {e}")
            return image

    # ==================== 图像增强 ====================
    @staticmethod
    def adjust_brightness(image: np.ndarray, brightness: int = 0) -> np.ndarray:
        """
        调整亮度

        Args:
            image: 输入图像
            brightness: 亮度调整值 (-255到255)

        Returns:
            调整后的图像
        """
        try:
            brightness = max(-255, min(255, brightness))
            if brightness > 0:
                result = cv2.add(image, np.full(image.shape, brightness, dtype=np.uint8))
            else:
                result = cv2.subtract(image, np.full(image.shape, abs(brightness), dtype=np.uint8))
            return result
        except Exception as e:
            print(f"调整亮度错误: {e}")
            return image

    @staticmethod
    def adjust_contrast(image: np.ndarray, contrast: float = 1.0) -> np.ndarray:
        """
        调整对比度

        Args:
            image: 输入图像
            contrast: 对比度因子 (大于1增强，小于1减弱)

        Returns:
            调整后的图像
        """
        try:
            contrast = max(0.1, min(3.0, contrast))
            result = cv2.convertScaleAbs(image, alpha=contrast, beta=0)
            return result
        except Exception as e:
            print(f"调整对比度错误: {e}")
            return image

    @staticmethod
    def adjust_rgb_channels(image: np.ndarray, r: int = 0, g: int = 0, b: int = 0) -> np.ndarray:
        """
        RGB通道调整

        Args:
            image: 输入图像 (BGR格式)
            r: 红色通道调整值
            g: 绿色通道调整值
            b: 色通道调整值

        Returns:
            调整后的图像
        """
        try:
            result = image.copy()
            # BGR顺序
            result[:, :, 0] = np.clip(result[:, :, 0].astype(np.int32) + b, 0, 255).astype(np.uint8)
            result[:, :, 1] = np.clip(result[:, :, 1].astype(np.int32) + g, 0, 255).astype(np.uint8)
            result[:, :, 2] = np.clip(result[:, :, 2].astype(np.int32) + r, 0, 255).astype(np.uint8)
            return result
        except Exception as e:
            print(f"RGB通道调整错误: {e}")
            return image

    # ==================== 边缘检测 ====================
    @staticmethod
    def roberts_edge_detection(image: np.ndarray) -> np.ndarray:
        """
        Roberts边缘检测

        Args:
            image: 输入图像

        Returns:
            边缘检测结果
        """
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
            gray = gray.astype(np.float32)

            # Roberts算子
            kernel_x = np.array([[1, 0], [0, -1]], dtype=np.float32)
            kernel_y = np.array([[0, 1], [-1, 0]], dtype=np.float32)

            grad_x = cv2.filter2D(gray, -1, kernel_x)
            grad_y = cv2.filter2D(gray, -1, kernel_y)

            result = np.sqrt(grad_x**2 + grad_y**2)
            result = np.clip(result, 0, 255).astype(np.uint8)
            return result
        except Exception as e:
            print(f"Roberts边缘检测错误: {e}")
            return image

    @staticmethod
    def prewitt_edge_detection(image: np.ndarray) -> np.ndarray:
        """
        Prewitt边缘检测

        Args:
            image: 输入图像

        Returns:
            边缘检测结果
        """
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
            gray = gray.astype(np.float32)

            # Prewitt算子
            kernel_x = np.array([[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], dtype=np.float32)
            kernel_y = np.array([[-1, -1, -1], [0, 0, 0], [1, 1, 1]], dtype=np.float32)

            grad_x = cv2.filter2D(gray, -1, kernel_x)
            grad_y = cv2.filter2D(gray, -1, kernel_y)

            result = np.sqrt(grad_x**2 + grad_y**2)
            result = np.clip(result, 0, 255).astype(np.uint8)
            return result
        except Exception as e:
            print(f"Prewitt边缘检测错误: {e}")
            return image

    @staticmethod
    def sobel_edge_detection(image: np.ndarray, ksize: int = 3) -> np.ndarray:
        """
        Sobel边缘检测

        Args:
            image: 输入图像
            ksize: 核大小

        Returns:
            边缘检测结果
        """
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

            grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=ksize)
            grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=ksize)

            result = np.sqrt(grad_x**2 + grad_y**2)
            result = np.clip(result, 0, 255).astype(np.uint8)
            return result
        except Exception as e:
            print(f"Sobel边缘检测错误: {e}")
            return image

    @staticmethod
    def log_edge_detection(image: np.ndarray, ksize: int = 5) -> np.ndarray:
        """
        LoG (Laplacian of Gaussian) 边缘检测

        Args:
            image: 输入图像
            ksize: 核大小

        Returns:
            边缘检测结果
        """
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

            # 先高斯滤波
            blurred = cv2.GaussianBlur(gray, (ksize, ksize), 0)

            # 再Laplacian
            laplacian = cv2.Laplacian(blurred, cv2.CV_64F)

            result = np.abs(laplacian)
            result = np.clip(result, 0, 255).astype(np.uint8)
            return result
        except Exception as e:
            print(f"LoG边缘检测错误: {e}")
            return image

    @staticmethod
    def canny_edge_detection(image: np.ndarray, threshold1: float = 50,
                             threshold2: float = 150) -> np.ndarray:
        """
        Canny边缘检测

        Args:
            image: 输入图像
            threshold1: 低阈值
            threshold2: 高阈值

        Returns:
            边缘检测结果
        """
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
            edges = cv2.Canny(gray, threshold1, threshold2)
            return edges
        except Exception as e:
            print(f"Canny边缘检测错误: {e}")
            return image

    # ==================== 形态学操作 ====================
    @staticmethod
    def morphology_erode(image: np.ndarray, kernel_size: int = 3,
                         iterations: int = 1) -> np.ndarray:
        """
        腐蚀操作

        Args:
            image: 输入图像
            kernel_size: 核大小
            iterations: 迭代次数

        Returns:
            腐蚀后的图像
        """
        try:
            kernel_size = max(1, kernel_size | 1)
            iterations = max(1, iterations)
            kernel = np.ones((kernel_size, kernel_size), np.uint8)

            # 如果是彩色图像，分别处理每个通道
            if len(image.shape) == 3:
                result = np.zeros_like(image)
                for i in range(3):
                    result[:, :, i] = cv2.erode(image[:, :, i], kernel, iterations=iterations)
                return result
            else:
                return cv2.erode(image, kernel, iterations=iterations)
        except Exception as e:
            print(f"腐蚀操作错误: {e}")
            return image

    @staticmethod
    def morphology_dilate(image: np.ndarray, kernel_size: int = 3,
                         iterations: int = 1) -> np.ndarray:
        """
        膨胀操作

        Args:
            image: 输入图像
            kernel_size: 核大小
            iterations: 迭代次数

        Returns:
            膨胀后的图像
        """
        try:
            kernel_size = max(1, kernel_size | 1)
            iterations = max(1, iterations)
            kernel = np.ones((kernel_size, kernel_size), np.uint8)

            # 如果是彩色图像，分别处理每个通道
            if len(image.shape) == 3:
                result = np.zeros_like(image)
                for i in range(3):
                    result[:, :, i] = cv2.dilate(image[:, :, i], kernel, iterations=iterations)
                return result
            else:
                return cv2.dilate(image, kernel, iterations=iterations)
        except Exception as e:
            print(f"膨胀操作错误: {e}")
            return image

    @staticmethod
    def morphology_open(image: np.ndarray, kernel_size: int = 3,
                       iterations: int = 1) -> np.ndarray:
        """
        开运算（先腐蚀后膨胀）

        Args:
            image: 输入图像
            kernel_size: 核大小
            iterations: 迭代次数

        Returns:
            开运算后的图像
        """
        try:
            kernel_size = max(1, kernel_size | 1)
            iterations = max(1, iterations)
            kernel = np.ones((kernel_size, kernel_size), np.uint8)

            if len(image.shape) == 3:
                result = np.zeros_like(image)
                for i in range(3):
                    result[:, :, i] = cv2.morphologyEx(image[:, :, i],
                                                       cv2.MORPH_OPEN,
                                                       kernel,
                                                       iterations=iterations)
                return result
            else:
                return cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel,
                                       iterations=iterations)
        except Exception as e:
            print(f"开运算错误: {e}")
            return image

    @staticmethod
    def morphology_close(image: np.ndarray, kernel_size: int = 3,
                        iterations: int = 1) -> np.ndarray:
        """
        闭运算（先膨胀后腐蚀）

        Args:
            image: 输入图像
            kernel_size: 核大小
            iterations: 迭代次数

        Returns:
            闭运算后的图像
        """
        try:
            kernel_size = max(1, kernel_size | 1)
            iterations = max(1, iterations)
            kernel = np.ones((kernel_size, kernel_size), np.uint8)

            if len(image.shape) == 3:
                result = np.zeros_like(image)
                for i in range(3):
                    result[:, :, i] = cv2.morphologyEx(image[:, :, i],
                                                       cv2.MORPH_CLOSE,
                                                       kernel,
                                                       iterations=iterations)
                return result
            else:
                return cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel,
                                       iterations=iterations)
        except Exception as e:
            print(f"闭运算错误: {e}")
            return image

    # ==================== 阈值分割 ====================
    @staticmethod
    def global_threshold(image: np.ndarray, threshold: int = 127,
                        max_val: int = 255) -> np.ndarray:
        """
        全局阈值分割

        Args:
            image: 输入图像
            threshold: 阈值
            max_val: 最大值

        Returns:
            分割后的图像
        """
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
            _, result = cv2.threshold(gray, threshold, max_val, cv2.THRESH_BINARY)
            return result
        except Exception as e:
            print(f"全局阈值分割错误: {e}")
            return image

    @staticmethod
    def adaptive_threshold(image: np.ndarray, max_val: int = 255,
                          block_size: int = 11, c: int = 2) -> np.ndarray:
        """
        自适应阈值分割

        Args:
            image: 输入图像
            max_val: 最大值
            block_size: 块大小
            c: 常数

        Returns:
            分割后的图像
        """
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
            block_size = max(3, block_size | 1)  # 必须为奇数
            result = cv2.adaptiveThreshold(gray, max_val,
                                          cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                          cv2.THRESH_BINARY,
                                          block_size, c)
            return result
        except Exception as e:
            print(f"自适应阈值分割错误: {e}")
            return image

    @staticmethod
    def otsu_threshold(image: np.ndarray, max_val: int = 255) -> np.ndarray:
        """
        Otsu阈值分割

        Args:
            image: 输入图像
            max_val: 最大值

        Returns:
            分割后的图像
        """
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
            _, result = cv2.threshold(gray, 0, max_val,
                                     cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            return result
        except Exception as e:
            print(f"Otsu阈值分割错误: {e}")
            return image

    # ==================== 直方图计算 ====================
    @staticmethod
    def calculate_histogram(image: np.ndarray) -> Dict:
        """
        计算灰度直方图和RGB通道直方图

        Args:
            image: 输入图像

        Returns:
            包含灰度和RGB直方图数据的字典
        """
        try:
            result = {}

            # 灰度直方图
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
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

            return result
        except Exception as e:
            print(f"直方图计算错误: {e}")
            return {'gray': [], 'r': [], 'g': [], 'b': []}

    # ==================== 综合处理方法 ====================
    def process_image(self, image: np.ndarray, operation: str,
                     **kwargs) -> np.ndarray:
        """
        综合图像处理方法

        Args:
            image: 输入图像
            operation: 操作类型
            **kwargs: 操作参数

        Returns:
            处理后的图像
        """
        try:
            # 噪声处理
            if operation == 'noise_gaussian':
                return self.add_gaussian_noise(image, kwargs.get('mean', 0),
                                               kwargs.get('sigma', 25))
            elif operation == 'noise_poisson':
                return self.add_poisson_noise(image)
            elif operation == 'noise_salt_pepper':
                return self.add_salt_pepper_noise(image, kwargs.get('prob', 0.02))
            elif operation == 'noise_speckle':
                return self.add_speckle_noise(image, kwargs.get('variance', 0.1))

            # 滤波处理
            elif operation == 'filter_mean':
                return self.mean_filter(image, kwargs.get('kernel_size', 3))
            elif operation == 'filter_gaussian':
                return self.gaussian_filter(image, kwargs.get('kernel_size', 3),
                                          kwargs.get('sigma', 0))
            elif operation == 'filter_median':
                return self.median_filter(image, kwargs.get('kernel_size', 3))
            elif operation == 'filter_bilateral':
                return self.bilateral_filter(image, kwargs.get('d', 9),
                                          kwargs.get('sigma_color', 75),
                                          kwargs.get('sigma_space', 75))

            # 图像增强
            elif operation == 'brightness':
                return self.adjust_brightness(image, kwargs.get('brightness', 0))
            elif operation == 'contrast':
                return self.adjust_contrast(image, kwargs.get('contrast', 1.0))
            elif operation == 'rgb_adjust':
                return self.adjust_rgb_channels(image,
                                               kwargs.get('r', 0),
                                               kwargs.get('g', 0),
                                               kwargs.get('b', 0))

            # 边缘检测
            elif operation == 'edge_roberts':
                return self.roberts_edge_detection(image)
            elif operation == 'edge_prewitt':
                return self.prewitt_edge_detection(image)
            elif operation == 'edge_sobel':
                return self.sobel_edge_detection(image, kwargs.get('ksize', 3))
            elif operation == 'edge_log':
                return self.log_edge_detection(image, kwargs.get('ksize', 5))
            elif operation == 'edge_canny':
                return self.canny_edge_detection(image,
                                                kwargs.get('threshold1', 50),
                                                kwargs.get('threshold2', 150))

            # 形态学操作
            elif operation == 'morph_erode':
                return self.morphology_erode(image,
                                           kwargs.get('kernel_size', 3),
                                           kwargs.get('iterations', 1))
            elif operation == 'morph_dilate':
                return self.morphology_dilate(image,
                                            kwargs.get('kernel_size', 3),
                                            kwargs.get('iterations', 1))
            elif operation == 'morph_open':
                return self.morphology_open(image,
                                          kwargs.get('kernel_size', 3),
                                          kwargs.get('iterations', 1))
            elif operation == 'morph_close':
                return self.morphology_close(image,
                                             kwargs.get('kernel_size', 3),
                                             kwargs.get('iterations', 1))

            # 阈值分割
            elif operation == 'threshold_global':
                return self.global_threshold(image,
                                            kwargs.get('threshold', 127),
                                            kwargs.get('max_val', 255))
            elif operation == 'threshold_adaptive':
                return self.adaptive_threshold(image,
                                              kwargs.get('max_val', 255),
                                              kwargs.get('block_size', 11),
                                              kwargs.get('c', 2))
            elif operation == 'threshold_otsu':
                return self.otsu_threshold(image, kwargs.get('max_val', 255))

            else:
                print(f"未知操作类型: {operation}")
                return image

        except Exception as e:
            print(f"图像处理错误: {e}")
            return image