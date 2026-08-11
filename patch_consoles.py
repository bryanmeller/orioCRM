import os

files = [
    "src/components/CustomerPortal/CustomerPortal.tsx",
    "src/components/TVSimulator/TVSeriesView.tsx",
    "src/components/TVSimulator/TVLiveTvView.tsx",
    "src/components/TVSimulator/components/PlayerScreenModal.tsx",
    "src/components/TVSimulator/TVMoviesView.tsx",
    "src/components/TVSimulator/TVFavoritesView.tsx"
]

for file in files:
    if os.path.exists(file):
        with open(file, "r") as f:
            content = f.read()
        
        # Replace console.error with safe logging or silent catch
        content = content.replace("console.error('Error fetching portal data:', err);", "// Tratamento silencioso da exceção")
        content = content.replace("console.error(e);", "/* Ignorado no fluxo produtivo */")
        
        with open(file, "w") as f:
            f.write(content)

print("Consoles patched")
