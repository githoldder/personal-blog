import urllib.request
import urllib.error

def check_url(url, expected_keyword):
    print(f"[E2E-HTTP] Requesting {url} ...")
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (E2E Test Agent)'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.status
            html = response.read().decode('utf-8')
            
            # 校验状态
            if status != 200:
                print(f"[E2E-HTTP] [FAIL] {url} returned status {status}")
                return False
                
            # 校验关键词
            if expected_keyword not in html:
                print(f"[E2E-HTTP] [FAIL] {url} did not contain keyword '{expected_keyword}'")
                return False
                
            print(f"[E2E-HTTP] [SUCCESS] {url} responded with 200 OK and verified.")
            return True
            
    except urllib.error.URLError as e:
        print(f"[E2E-HTTP] [FAIL] Network error on {url}: {e.reason}")
        return False
    except Exception as e:
        print(f"[E2E-HTTP] [FAIL] Unexpected error on {url}: {e}")
        return False

def run_suite():
    tests = [
        ("http://127.0.0.1:4321", "曹磊"),
        ("http://127.0.0.1:4322", "曹磊"),
        ("http://127.0.0.1:4322/notes/", "知识耕作花园"),
        ("http://127.0.0.1:4322/projects/", "项目研发轨迹"),
        ("http://127.0.0.1:4322/lab/graph/", "全息语义大脑图谱"),
        ("http://127.0.0.1:4322/admin/", "离线管理控制台")
    ]
    
    passed = 0
    for url, kw in tests:
        if check_url(url, kw):
            passed += 1
            
    print(f"\n[E2E-HTTP] Summary: {passed}/{len(tests)} tests passed.")
    if passed < len(tests):
        print("[E2E-HTTP] [ERROR] Some routes failed to load. Please verify server logs.")
        exit(1)
    else:
        print("[E2E-HTTP] [OK] All routes verified successfully via loopback HTTP check.")
        exit(0)

if __name__ == "__main__":
    run_suite()
