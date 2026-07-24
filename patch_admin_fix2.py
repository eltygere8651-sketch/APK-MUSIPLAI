import re

with open("src/components/UserManagementAdmin.tsx", "r") as f:
    content = f.read()

start_str = "              ) : ("
end_str = "              )}"

s_idx = content.find(start_str)
e_idx = content.find(end_str, s_idx) + len(end_str)

if s_idx != -1:
    # Everything after end_str until "            </div>" needs to be cleared.
    e_div_idx = content.find("            </div>", e_idx)
    content = content[:e_idx] + "\n" + content[e_div_idx:]

with open("src/components/UserManagementAdmin.tsx", "w") as f:
    f.write(content)
