# -*- coding: utf-8 -*-
"""
PythonAnywhere WSGI 配置文件
为用户 Hojo1iiii 定制化配置

使用方法：
1. 在 PythonAnywhere Web 标签页编辑 WSGI configuration file
2. 将此文件内容复制粘贴进去
3. 保存并重新加载 Web App
"""

import os
import sys

# ==================== 项目路径配置 ====================
# 添加项目路径到 Python 搜索路径
project_home = '/home/Hojo1iiii/digital_compute_pic/image_web_system/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# 设置工作目录
os.chdir(project_home)

# ==================== 虚拟环境激活 ====================
# 激活虚拟环境（PythonAnywhere 会自动处理）
# 虚拟环境路径已在 Web 控制台配置：/home/Hojo1iiii/myvenv

# ==================== 环境变量配置 ====================
os.environ['FLASK_ENV'] = 'production'
os.environ['PORT'] = '5000'

# ==================== 创建必要的目录 ====================
# 确保 temp 目录存在（用于存储临时文件）
temp_dir = os.path.join(project_home, 'temp')
saved_dir = os.path.join(temp_dir, 'saved')
os.makedirs(temp_dir, exist_ok=True)
os.makedirs(saved_dir, exist_ok=True)

# ==================== 导入 Flask 应用 ====================
# 导入 Flask app，PythonAnywhere 要求命名为 'application'
from app import app as application

# ==================== 日志输出（可选）====================
# 如果需要调试，可以添加日志输出
print(f"[PythonAnywhere WSGI] 项目路径: {project_home}")
print(f"[PythonAnywhere WSGI] 工作目录: {os.getcwd()}")
print(f"[PythonAnywhere WSGI] 临时文件目录已创建: {temp_dir}")
print(f"[PythonAnywhere WSGI] Flask 应用已加载成功")