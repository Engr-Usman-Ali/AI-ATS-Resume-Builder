from app import create_app
import os

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"\n🚀 Server starting on http://localhost:{port}")
    print(f"📚 API Docs: http://localhost:{port}/api/health\n")
    app.run(host='0.0.0.0', port=port, debug=True)