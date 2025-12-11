#!/bin/bash

# Quick Start Script for CreedaVA Development
# This starts both the Azure Functions API and the React frontend

echo "🚀 Starting CreedaVA Development Environment..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    echo "Please run this from /workspaces/CreedaVA"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "api/node_modules" ]; then
    echo "📦 Installing API dependencies..."
    cd api && npm install && cd ..
fi

# Check if Azure Functions Core Tools is installed
if ! command -v func &> /dev/null; then
    echo "⚠️  Azure Functions Core Tools not found"
    echo "Install it with: npm install -g azure-functions-core-tools@4 --unsafe-perm true"
    exit 1
fi

# Kill any existing processes on ports 7071 and 5173
echo "🔍 Checking for existing processes..."
lsof -ti:7071 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo ""
echo "✅ Starting Azure Functions API..."
cd api
func start > /tmp/azure-functions.log 2>&1 &
API_PID=$!
cd ..

# Wait for API to start
echo "⏳ Waiting for API to initialize..."
sleep 5

# Check if API started successfully
if ps -p $API_PID > /dev/null; then
    echo "✅ Azure Functions running on http://localhost:7071"
else
    echo "❌ Failed to start Azure Functions"
    echo "Check logs: tail -f /tmp/azure-functions.log"
    exit 1
fi

echo ""
echo "✅ Starting React Frontend..."
npm run dev > /tmp/vite.log 2>&1 &
VITE_PID=$!

# Wait for Vite to start
sleep 3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 CreedaVA is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Frontend:  http://localhost:5173"
echo "⚡ API:       http://localhost:7071"
echo "👤 Admin:     http://localhost:5173/admin"
echo ""
echo "📊 Available API endpoints:"
echo "   POST http://localhost:7071/api/trackEvent"
echo "   GET  http://localhost:7071/api/getAnalytics"
echo "   POST http://localhost:7071/api/submitContact"
echo ""
echo "📝 Logs:"
echo "   API:      tail -f /tmp/azure-functions.log"
echo "   Frontend: tail -f /tmp/vite.log"
echo ""
echo "🛑 To stop: Press Ctrl+C"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Keep script running and handle Ctrl+C
trap "echo ''; echo '🛑 Shutting down...'; kill $API_PID $VITE_PID 2>/dev/null; exit 0" INT

# Wait for both processes
wait
