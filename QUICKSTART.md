# 🚀 Quick Start Guide

## Running the Application

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Key Features to Test

### 1. **Interactive Family Tree** (Home Tab)
- Click any person's avatar to see their details
- Notice the animated connection lines
- Hover over nodes for scale effects

### 2. **Advanced Search** (Search Tab)
- Type any name in the search box (debounced 300ms)
- Click the filter icon to open advanced filters
- Try filtering by generation, location, or birth year
- Click any search result to view details

### 3. **Theme Toggle**
- Click the sun/moon icon in the header
- OR press `T` key on your keyboard
- Notice the theme persists after refresh

### 4. **Settings** (Settings Tab)
- Toggle notifications, privacy mode, offline access
- Try exporting data (click Export Data)
- Try sharing (click Share Tree)

### 5. **Keyboard Shortcuts**
- Press `1` - Home (Tree View)
- Press `2` - Search
- Press `3` - Settings
- Press `4` - About
- Press `T` - Toggle Theme

### 6. **Mobile Gestures** (On Touch Devices)
- Swipe left/right to navigate between tabs

## 📋 Component Tour

### Main Components
1. **TopBar** - Header with title and theme toggle
2. **BottomNavigation** - Tab navigation at bottom
3. **TreeTab** - Family tree visualization
4. **SearchTab** - Search and filter interface
5. **SettingsTab** - App preferences
6. **AboutTab** - Creator information

### Modals
- **PersonModal** - Shows detailed person information
- **FilterModal** - Advanced search filters
- **ExportModal** - Data export options

### Utilities
- **Toast** - Notification system
- **LoadingSpinner** - Loading indicator
- **EmptyState** - No data placeholder

## 🔧 Development Tips

### Adding New Family Members

Edit `lib/data.ts`:

```typescript
{
  id: 'gen4-1',
  name: "New Person",
  role: "Grandson",
  birth: "2010",
  location: "London, UK",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NewPerson",
  bio: "Description here",
  children: []
}
```

### Customizing Colors

Modify Tailwind classes in components or update `app/globals.css`.

### Adding New Features

1. Create new component in `components/`
2. Add to appropriate tab or create new tab
3. Update navigation if needed
4. Add TypeScript types in `lib/types.ts`

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Build Errors
```bash
# Clean install
rm -rf node_modules .next
npm install
npm run dev
```

### TypeScript Errors
```bash
# Check for errors
npm run build
```

## 📦 Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main application
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── tabs/             # Tab components
│   └── ...               # Other components
├── lib/                  # Utilities and helpers
│   ├── data.ts          # Mock data
│   ├── types.ts         # TypeScript types
│   ├── hooks.ts         # Custom hooks
│   └── ...              # Other utilities
└── public/              # Static assets
    └── manifest.json    # PWA manifest
```

## 🎨 Customization Guide

### Change Primary Color
Find and replace `indigo` with your preferred Tailwind color:
- `bg-indigo-600` → `bg-blue-600`
- `text-indigo-600` → `text-blue-600`
- etc.

### Modify Tree Layout
Edit `components/tabs/TreeTab.tsx` to adjust spacing, connectors, or add more generations.

### Add New Settings
1. Add state in `components/tabs/SettingsTab.tsx`
2. Add localStorage persistence
3. Add toggle UI

## 🔗 Integration with Backend

### Replace Mock Data

Replace in `lib/data.ts`:
```typescript
// Before
export const FAMILY_DATA: Person[] = [...];

// After
export async function fetchFamilyData(): Promise<Person[]> {
  const res = await fetch('/api/family-members');
  return res.json();
}
```

### Use in Components
```typescript
const [familyData, setFamilyData] = useState<Person[]>([]);

useEffect(() => {
  fetchFamilyData().then(setFamilyData);
}, []);
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)

## ✅ Testing Checklist

- [ ] Tree nodes are clickable
- [ ] Search is working with debounce
- [ ] Filters apply correctly
- [ ] Theme toggle works
- [ ] Theme persists after reload
- [ ] Settings toggles save to localStorage
- [ ] Export downloads files
- [ ] Share functionality works
- [ ] Keyboard shortcuts work
- [ ] Swipe gestures work on mobile
- [ ] Toast notifications appear
- [ ] Modals open and close properly
- [ ] Responsive on all screen sizes

## 🎉 Ready to Use!

All features are fully functional. Start exploring the family tree!

---

**Need Help?** Check the detailed documentation in:
- `FEATURES.md` - Feature documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `README.md` - Project overview
