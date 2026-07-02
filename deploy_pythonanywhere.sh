#!/bin/bash
# PythonAnywhere 自动化部署脚本
# 用户名: Hojo1iiii
# 项目: digital_compute_pic

echo "=========================================="
echo "PythonAnywhere 自动化部署脚本"
echo "用户: Hojo1iiii"
echo "项目: digital_compute_pic"
echo "=========================================="

# 步骤 1: 克隆项目仓库
echo "[步骤 1] 克隆 GitHub 仓库..."
cd ~
if [ -d "digital_compute_pic" ]; then
    echo "项目目录已存在，跳过克隆"
    cd digital_compute_pic
    git pull origin main
else
    git clone https://github.com/Hiiiirth/digital_compute_pic.git
    cd digital_compute_pic
fi

# 步骤 2: 创建虚拟环境
echo "[步骤 2] 创建虚拟环境..."
if [ -d "$HOME/myvenv" ]; then
    echo "虚拟环境已存在，跳过创建"
else
    python3.11 -m venv ~/myvenv
fi

# 步骤 3: 激活虚拟环境
echo "[步骤 3] 激活虚拟环境..."
source ~/myvenv/bin/activate

# 步骤 4: 安装依赖
echo "[步骤 4] 安装 Python 依赖..."
cd ~/digital_compute_pic/image_web_system
pip install --upgrade pip
pip install -r requirements.txt

# 步骤 5: 检查 OpenCV 安装
echo "[步骤 5] 检查 OpenCV..."
if ! pip show opencv-python > /dev/null 2>&1; then
    echo "安装 opencv-python-headless（无 GUI 版本，适合服务器环境）"
    pip install opencv-python-headless
fi

# 步骤 6: 验证安装
echo "[步骤 6] 验证依赖安装..."
pip list | grep -E "Flask|opencv|numpy|Pillow|gunicorn"

# 步骤 7: 创建必要的目录
echo "[步骤 7] 创建临时文件目录..."
cd ~/digital_compute_pic/image_web_system/backend
mkdir -p temp/saved

# 步骤 8: 测试 Flask 应用
echo "[步骤 8] 测试 Flask 应用导入..."
python -c "from app import app; print('Flask 应用导入成功')"

echo "=========================================="
echo "部署脚本执行完成！"
echo "=========================================="
echo ""
echo "接下来的手动步骤："
echo "1. 在 PythonAnywhere Web 标签页创建新的 Web App"
echo "2. 选择 Manual Configuration (Python 3.11)"
echo "3. 配置虚拟环境路径: /home/Hojo1iiii/myvenv"
echo "4. 编辑 WSGI 文件，复制 wsgi_config.py 内容"
echo "5. 配置静态文件映射:"
echo "   URL: /static"
echo "   Path: /home/Hojo1iiii/digital_compute_pic/image_web_system/frontend/static"
echo "6. 点击 Reload 按钮"
echo ""
echo "访问地址: https://Hojo1iiii.pythonanywhere.com/"
echo "=========================================="