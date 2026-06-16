#!/usr/bin/env python3
"""
生成 NullTodo 操作演示 GIF
"""
import subprocess
import time
from PIL import Image, ImageDraw, ImageFont
import os

# 配置
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = "http://localhost:3000/#"
OUTPUT_DIR = r"d:\PersonalProject\docs\gifs"
SCREENSHOT_DIR = r"d:\PersonalProject\docs\screenshots"

# 确保输出目录存在
os.makedirs(OUTPUT_DIR, exist_ok=True)

def capture_page(url, output_path, wait_time=3):
    """使用 Chrome headless 截取页面"""
    cmd = [
        CHROME_PATH,
        "--headless",
        f"--screenshot={output_path}",
        "--window-size=1280,800",
        "--no-sandbox",
        "--disable-gpu",
        url
    ]
    subprocess.run(cmd, capture_output=True)
    time.sleep(wait_time)

def create_gif_from_images(image_paths, output_path, duration=1500):
    """将多张图片合成为 GIF"""
    images = []
    for path in image_paths:
        if os.path.exists(path):
            img = Image.open(path)
            # 调整大小为统一尺寸
            img = img.resize((1280, 800), Image.Resampling.LANCZOS)
            images.append(img)
    
    if images:
        # 保存为 GIF
        images[0].save(
            output_path,
            save_all=True,
            append_images=images[1:],
            duration=duration,
            loop=0,
            optimize=True
        )
        print(f"GIF 已生成: {output_path}")
        return True
    return False

def add_text_overlay(image_path, text, output_path):
    """在图片上添加文字说明"""
    img = Image.open(image_path)
    draw = ImageDraw.Draw(img)
    
    # 使用中文字体
    font_path = r"C:\Windows\Fonts\msyh.ttc"  # 微软雅黑
    if not os.path.exists(font_path):
        font_path = r"C:\Windows\Fonts\simhei.ttf"  # 黑体
    if not os.path.exists(font_path):
        font_path = r"C:\Windows\Fonts\Deng.ttf"  # 等线
    
    try:
        font = ImageFont.truetype(font_path, 36)
    except:
        font = ImageFont.load_default()
    
    # 在顶部添加文字背景
    draw.rectangle([(0, 0), (1280, 80)], fill=(0, 0, 0, 200))
    
    # 添加文字
    draw.text((20, 20), text, fill=(255, 255, 255), font=font)
    
    img.save(output_path)
    return output_path

def generate_workflow_gif():
    """生成工作流程演示 GIF"""
    print("生成工作流程 GIF...")
    
    # 截取不同页面
    pages = [
        ("", "首页 - 任务概览"),
        ("/tasks", "任务管理 - AI 自然语言输入"),
        ("/schedule", "日程视图 - 周历规划"),
        ("/review", "复盘分析 - 数据洞察"),
        ("/settings", "个性化设置 - 定制体验")
    ]
    
    image_paths = []
    for i, (path, title) in enumerate(pages):
        url = f"{BASE_URL}{path}"
        screenshot_path = os.path.join(SCREENSHOT_DIR, f"temp_{i}.png")
        capture_page(url, screenshot_path)
        
        # 添加文字说明
        labeled_path = os.path.join(OUTPUT_DIR, f"step_{i}.png")
        add_text_overlay(screenshot_path, title, labeled_path)
        image_paths.append(labeled_path)
        
        print(f"  已截取: {title}")
    
    # 合成 GIF
    gif_path = os.path.join(OUTPUT_DIR, "workflow.gif")
    if create_gif_from_images(image_paths, gif_path, duration=2000):
        print(f"✓ 工作流程 GIF 已生成: {gif_path}")
        return gif_path
    return None

def generate_feature_gif():
    """生成功能展示 GIF"""
    print("\n生成功能展示 GIF...")
    
    # 截取核心功能页面
    pages = [
        ("/tasks", "AI 自然语言输入"),
        ("/tasks", "智能任务管理"),
        ("/schedule", "日程规划"),
        ("/review", "数据分析")
    ]
    
    image_paths = []
    for i, (path, title) in enumerate(pages):
        url = f"{BASE_URL}{path}"
        screenshot_path = os.path.join(SCREENSHOT_DIR, f"feature_{i}.png")
        capture_page(url, screenshot_path)
        
        # 添加文字说明
        labeled_path = os.path.join(OUTPUT_DIR, f"feature_{i}.png")
        add_text_overlay(screenshot_path, title, labeled_path)
        image_paths.append(labeled_path)
        
        print(f"  已截取: {title}")
    
    # 合成 GIF
    gif_path = os.path.join(OUTPUT_DIR, "features.gif")
    if create_gif_from_images(image_paths, gif_path, duration=1800):
        print(f"✓ 功能展示 GIF 已生成: {gif_path}")
        return gif_path
    return None

def main():
    print("=" * 60)
    print("NullTodo 操作演示 GIF 生成器")
    print("=" * 60)
    
    # 生成工作流程 GIF
    workflow_gif = generate_workflow_gif()
    
    # 生成功能展示 GIF
    feature_gif = generate_feature_gif()
    
    print("\n" + "=" * 60)
    print("生成完成!")
    print("=" * 60)
    
    if workflow_gif:
        print(f"\n工作流程 GIF: {workflow_gif}")
    if feature_gif:
        print(f"功能展示 GIF: {feature_gif}")
    
    print("\n提示: 可以将这些 GIF 添加到 README.md 和推广文案中")

if __name__ == "__main__":
    main()
