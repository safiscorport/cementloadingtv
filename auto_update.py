import os
import glob

# 1. Dynamically locate GitHub Desktop's Git path to prevent version mismatch errors
git_paths = glob.glob(r"C:\Users\PORT SUPERVISOR\AppData\Local\GitHubDesktop\app-*\resources\app\git\cmd\git.exe")
if git_paths:
    os.environ["GIT_PYTHON_GIT_EXECUTABLE"] = git_paths[-1]

# 2. Import Git and other packages AFTER setting the path
import time
from mss import mss
from git import Repo

# Configuration
REPO_DIR = r"C:\Users\PORT SUPERVISOR\Documents\GitHub\cementloadingtv"
IMAGE_NAME = "dashboard1.png"
INTERVAL_SECONDS = 120  # Seconds between screen captures

os.chdir(REPO_DIR)

def capture_and_auto_commit():
    print("Capturing 2nd monitor dashboard screenshot...")
    
    with mss() as sct:
        # Targets second monitor, falls back to main monitor if not found
        target_monitor = sct.monitors[2] if len(sct.monitors) > 2 else sct.monitors[1]
        sct_img = sct.grab(target_monitor)
        
        from mss.tools import to_png
        to_png(sct_img.rgb, sct_img.size, output=IMAGE_NAME)
    
    print("Syncing with GitHub...")
    try:
        repo = Repo(REPO_DIR)
        origin = repo.remote(name='origin')
        origin.pull()
        
        repo.index.add([IMAGE_NAME])
        repo.index.commit("Auto-update 2nd monitor dashboard screenshot")
        origin.push()
        
        print("Successfully updated and pushed 2nd monitor view automatically!\n")
    except Exception as e:
        print(f"Auto-sync note: {e}\n")

if __name__ == "__main__":
    while True:
        capture_and_auto_commit()
        print(f"Waiting {INTERVAL_SECONDS} seconds for the next update...")
        time.sleep(INTERVAL_SECONDS)
