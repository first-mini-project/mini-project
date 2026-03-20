import os, sys
# Ensure current directory is in path
sys.path.append(os.getcwd())

try:
    print("1. Importing Config...")
    from config import Config
    print("   Success")

    print("2. Importing database...")
    import database
    print("   Success")

    print("3. Importing ai_service...")
    from services import ai_service
    print("   Success")

    print("4. Importing image_service...")
    from services import image_service
    print("   Success")

    print("5. Importing tts_service...")
    from services import tts_service
    print("   Success")

    print("\nAll imports successful!")
except Exception as e:
    print(f"\nError during import: {e}")
    import traceback
    traceback.print_exc()
