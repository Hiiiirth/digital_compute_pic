"""
OpenCV功能验证脚本
测试OpenCV图像读写、加噪、滤波等基本功能
"""

import cv2
import numpy as np
import os

def test_opencv_functions():
    """测试OpenCV基本功能"""

    print("=" * 50)
    print("OpenCV功能验证测试")
    print("=" * 50)

    # 1. 创建测试图像
    print("\n1. 创建测试图像...")
    test_image = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    print(f"   ✓ 成功创建 {test_image.shape} 大小的测试图像")

    # 2. 测试图像写入
    print("\n2. 测试图像写入...")
    temp_dir = os.path.join(os.path.dirname(__file__), 'backend', 'temp')
    test_file = os.path.join(temp_dir, 'test_image.png')
    cv2.imwrite(test_file, test_image)
    print(f"   ✓ 成功写入图像到: {test_file}")

    # 3. 测试图像读取
    print("\n3. 测试图像读取...")
    loaded_image = cv2.imread(test_file)
    if loaded_image is not None:
        print(f"   ✓ 成功读取图像，形状: {loaded_image.shape}")
    else:
        print("   ✗ 图像读取失败")
        return False

    # 4. 测试图像转换（灰度）
    print("\n4. 测试图像转换...")
    gray_image = cv2.cvtColor(loaded_image, cv2.COLOR_BGR2GRAY)
    print(f"   ✓ 成功转换为灰度图像，形状: {gray_image.shape}")

    # 5. 测试添加高斯噪声
    print("\n5. 测试添加高斯噪声...")
    noisy_image = loaded_image.copy()
    mean = 0
    sigma = 25
    gauss = np.random.normal(mean, sigma, loaded_image.shape)
    noisy_image = loaded_image + gauss.astype(np.uint8)
    noisy_image = np.clip(noisy_image, 0, 255)
    print("   ✓ 成功添加高斯噪声")

    # 6. 测试高斯滤波
    print("\n6. 测试高斯滤波...")
    filtered_image = cv2.GaussianBlur(noisy_image, (5, 5), 0)
    print("   ✓ 成功应用高斯滤波")

    # 7. 测试中值滤波
    print("\n7. 测试中值滤波...")
    median_filtered = cv2.medianBlur(noisy_image, 5)
    print("   ✓ 成功应用中值滤波")

    # 8. 测试边缘检测（Canny）
    print("\n8. 测试边缘检测...")
    edges = cv2.Canny(gray_image, 50, 150)
    print(f"   ✓ 成功应用Canny边缘检测，结果形状: {edges.shape}")

    # 9. 测试形态学操作
    print("\n9. 测试形态学操作...")
    kernel = np.ones((3, 3), np.uint8)
    dilated = cv2.dilate(edges, kernel, iterations=1)
    eroded = cv2.erode(edges, kernel, iterations=1)
    print("   ✓ 成功应用膨胀和腐蚀操作")

    # 10. 测试阈值分割
    print("\n10. 测试阈值分割...")
    ret, thresh = cv2.threshold(gray_image, 127, 255, cv2.THRESH_BINARY)
    print(f"   ✓ 成功应用阈值分割，阈值: {ret}")

    # 11. 保存处理后的图像
    print("\n11. 保存处理后的图像...")
    results_dir = os.path.join(temp_dir, 'test_results')
    os.makedirs(results_dir, exist_ok=True)

    cv2.imwrite(os.path.join(results_dir, 'noisy.png'), noisy_image)
    cv2.imwrite(os.path.join(results_dir, 'filtered.png'), filtered_image)
    cv2.imwrite(os.path.join(results_dir, 'edges.png'), edges)
    cv2.imwrite(os.path.join(results_dir, 'threshold.png'), thresh)
    print(f"   ✓ 处理结果保存到: {results_dir}")

    # 12. 计算直方图
    print("\n12. 测试直方图计算...")
    hist = cv2.calcHist([gray_image], [0], None, [256], [0, 256])
    print(f"   ✓ 成功计算灰度直方图，形状: {hist.shape}")

    # 清理测试文件
    print("\n清理测试文件...")
    try:
        os.remove(test_file)
        print(f"   ✓ 已删除测试文件: {test_file}")
    except Exception as e:
        print(f"   ✗ 清理失败: {e}")

    print("\n" + "=" * 50)
    print("所有OpenCV功能测试通过！")
    print("=" * 50)

    return True


if __name__ == '__main__':
    test_opencv_functions()