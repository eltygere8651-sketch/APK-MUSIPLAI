import re

with open("src/components/UserManagementAdmin.tsx", "r") as f:
    content = f.read()

# Remove the whole restore block in JSX
start_str = "{/* RESTAURAR CARATULAS */}"
end_str = "              </div>"
start_idx = content.find(start_str)
if start_idx != -1:
    end_idx = content.find(end_str, start_idx) + len(end_str)
    content = content[:start_idx] + content[end_idx:]

# Remove the state
content = content.replace("  const [isRestoringThumbnails, setIsRestoringThumbnails] = useState(false);\n  const [restoreProgress, setRestoreProgress] = useState(\"\");\n", "")

# Remove the function
func_start = "    const handleRestoreThumbnails = async () => {"
func_end = "    setIsRestoringThumbnails(false);\n  };\n"
f_start_idx = content.find(func_start)
if f_start_idx != -1:
    f_end_idx = content.find(func_end, f_start_idx) + len(func_end)
    content = content[:f_start_idx] + content[f_end_idx:]

with open("src/components/UserManagementAdmin.tsx", "w") as f:
    f.write(content)
