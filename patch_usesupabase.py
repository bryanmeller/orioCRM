with open("src/hooks/useSupabaseData.ts", "r") as f:
    content = f.read()

content = content.replace("console.error('Error loading data from Supabase:', err);", "// Fallback silencioso em producao")
content = content.replace("}, [currentUser]);", "}, [currentUser?.id]);")

with open("src/hooks/useSupabaseData.ts", "w") as f:
    f.write(content)
print("useSupabaseData.ts patched")
