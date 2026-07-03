import time
from playwright.sync_api import sync_playwright

def run_tests():
    print("[E2E] Starting local end-to-end tests...")
    
    # 截图保存路径
    artifact_dir = "/Users/caolei/.gemini/antigravity/brain/3b93d9ad-0450-40d8-afbe-bf295d3f2f54"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        
        # 1. 验证热更新开发环境 (Port 4321)
        try:
            print("[E2E] Testing Dev environment (127.0.0.1:4321)...")
            page = context.new_page()
            page.goto("http://127.0.0.1:4321", timeout=10000)
            page.wait_for_load_state("networkidle")
            
            # 确认主元素
            title = page.title()
            print(f"[E2E] Dev Page Title: {title}")
            assert "曹磊的" in title or "Personal" in title
            
            # 截图
            page.screenshot(path=f"{artifact_dir}/dev_snapshot.png")
            print("[E2E] Dev page snapshot saved.")
            page.close()
        except Exception as e:
            print(f"[E2E] [ERROR] Dev environment check failed: {e}")

        # 2. 验证静态生产预览环境 (Port 4322)
        try:
            print("[E2E] Testing Preview environment (127.0.0.1:4322)...")
            page = context.new_page()
            page.goto("http://127.0.0.1:4322", timeout=10000)
            page.wait_for_load_state("networkidle")
            
            title = page.title()
            print(f"[E2E] Preview Page Title: {title}")
            assert "曹磊的" in title or "Personal" in title
            
            # 截图
            page.screenshot(path=f"{artifact_dir}/preview_snapshot.png")
            print("[E2E] Preview page snapshot saved.")
            page.close()
        except Exception as e:
            print(f"[E2E] [ERROR] Preview environment check failed: {e}")

        # 3. 验证语义关系图谱页面 (Port 4322 /lab/graph)
        try:
            print("[E2E] Testing Semantic Graph page (127.0.0.1:4322/lab/graph)...")
            page = context.new_page()
            page.goto("http://127.0.0.1:4322/lab/graph", timeout=10000)
            page.wait_for_load_state("networkidle")
            
            # 稍微等一会物理力导向模拟渲染
            time.sleep(2)
            
            # 确保 SVG 元素存在
            svg = page.locator("svg")
            assert svg.count() > 0
            print("[E2E] SVG canvas elements found on graph page.")
            
            # 截图
            page.screenshot(path=f"{artifact_dir}/graph_snapshot.png")
            print("[E2E] Graph page snapshot saved.")
            page.close()
        except Exception as e:
            print(f"[E2E] [ERROR] Graph page check failed: {e}")

        # 4. 验证管理员工作台页面 (Port 4322 /admin)
        try:
            print("[E2E] Testing Admin Console page (127.0.0.1:4322/admin)...")
            page = context.new_page()
            page.goto("http://127.0.0.1:4322/admin", timeout=10000)
            page.wait_for_load_state("networkidle")
            
            # 确认含有本地实例安全提示
            security_banner = page.locator("text=SECURITY GATEWAY")
            assert security_banner.count() > 0
            print("[E2E] Admin security warning banner verified.")
            
            # 截图
            page.screenshot(path=f"{artifact_dir}/admin_snapshot.png")
            print("[E2E] Admin page snapshot saved.")
            page.close()
        except Exception as e:
            print(f"[E2E] [ERROR] Admin Console check failed: {e}")

        browser.close()
    print("[E2E] E2E verification workflow completed.")

if __name__ == "__main__":
    run_tests()
