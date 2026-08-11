import os
import shutil
import re

# 1. Move supabaseAdmin.ts
os.rename("src/server/supabaseAdmin.ts", "server/supabaseAdmin.ts")

# 2. Update imports in backend
files_to_update = [
    "server/services/lynx/lynxWebhookService.ts",
    "server/services/lynx/lynxPaymentService.ts",
    "server/routes/lynxRoutes.ts"
]

for file_path in files_to_update:
    with open(file_path, 'r') as f:
        content = f.read()
    content = content.replace("../../src/server/supabaseAdmin.js", "../supabaseAdmin.js")
    content = content.replace("../../../src/server/supabaseAdmin.js", "../../supabaseAdmin.js")
    with open(file_path, 'w') as f:
        f.write(content)

# 3. Remove src/server directory completely
shutil.rmtree("src/server")

# 4. Remove temporary files
temp_files = [
    "add_credit_rpc.sql", "add_deleted_at.sql", "check_admin.ts", 
    "chunk1.txt", "chunk2.txt", "chunk3.txt", "chunk4.txt",
    "fix2.py", "fix_profiles.sql", "fix_server.py", "generate_sql.sh", 
    "get_chunks.sh", "patch_hooks.sh", "patch_server.sh", "split_script.sh", 
    "temp.sql", "update_admin_auth.sh"
]

for file in temp_files:
    if os.path.exists(file):
        os.remove(file)

print("Cleanup script executed.")
