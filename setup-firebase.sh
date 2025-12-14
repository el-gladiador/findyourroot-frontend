#!/bin/bash

echo "🔥 Firebase Real-Time Sync Setup"
echo "================================="
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
  echo "✅ .env.local already exists"
else
  echo "📝 Creating .env.local from .env.example..."
  cp .env.example .env.local
  echo "✅ .env.local created"
fi

echo ""
echo "📋 Next steps:"
echo ""
echo "1. Get your Firebase config:"
echo "   → Go to: https://console.firebase.google.com"
echo "   → Select your project"
echo "   → Project Settings > General"
echo "   → Scroll to 'Your apps' section"
echo "   → Copy the config values"
echo ""
echo "2. Edit .env.local and add your Firebase credentials:"
echo "   → Open: frontend/.env.local"
echo "   → Uncomment and fill in the NEXT_PUBLIC_FIREBASE_* variables"
echo ""
echo "3. Restart the frontend:"
echo "   → npm run dev"
echo ""
echo "4. Check console for confirmation:"
echo "   → Should see: '[Realtime Sync] Using Firestore real-time listeners'"
echo ""
echo "💡 If you don't configure Firebase, the app will use polling (works with any DB)"
echo ""
