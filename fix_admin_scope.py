import sys

with open("src/components/UserManagementAdmin.tsx", "r") as f:
    content = f.read()

# The wrongly placed function
func_start = "    const handleRestoreThumbnails = async () => {"
func_end = "    setIsRestoringThumbnails(false);\n  };\n"

start_idx = content.find(func_start)
end_idx = content.find(func_end) + len(func_end)

if start_idx != -1:
    wrong_part = content[start_idx:end_idx]
    # Remove it from there
    content = content[:start_idx] + content[end_idx:]
    
    # Find the main return (
    main_return_idx = content.find("  return (\n    <div className=\"fixed inset-0")
    if main_return_idx != -1:
        # Re-insert the function right before the main return
        content = content[:main_return_idx] + wrong_part + "\n" + content[main_return_idx:]
        
        with open("src/components/UserManagementAdmin.tsx", "w") as f:
            f.write(content)
        print("Fixed successfully")
    else:
        print("Could not find main return")
else:
    print("Could not find wrong part")
