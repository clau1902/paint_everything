# 🎨 Paint Everything

A feature-rich digital painting application built with Next.js, React 19, TypeScript, and shadcn/ui. Create artwork, save it to the cloud, and share it with anyone via a public link.

## ✨ Features

### 🖌️ Drawing Tools
- **Brush** - Freehand drawing with customizable size
- **Eraser** - Remove painted areas
- **Line** - Draw straight lines
- **Rectangle** - Draw rectangles and squares
- **Circle/Ellipse** - Draw circles and ellipses
- **Fill (Paint Bucket)** - Flood fill enclosed areas with color

### 🎨 Color Controls
- Full color picker supporting any color
- 15 preset colors for quick access
- Live color preview in the toolbar

### 📏 Brush Size
- Adjustable size from 1px to 100px
- Visual size preview showing current brush

### ⚡ Actions
- **Undo/Redo** - Up to 50 history states
- **Clear Canvas** - Start fresh with a blank canvas
- **Save Image** - Download your artwork as PNG

### 👤 User Accounts & Cloud Storage
- Sign up / log in with email and password
- Auto-save drawings to the cloud
- Gallery view of all your saved drawings
- Load any saved drawing back onto the canvas

### 🔗 Sharing
- Generate a public share link for any drawing
- Anyone with the link can view the drawing (no account needed)

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `B` | Brush tool |
| `E` | Eraser tool |
| `L` | Line tool |
| `R` | Rectangle tool |
| `C` | Circle tool |
| `F` | Fill tool |
| `⌘/Ctrl + Z` | Undo |
| `⌘/Ctrl + Shift + Z` | Redo |
| `⌘/Ctrl + S` | Save image |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd paint_everything

# Install dependencies
bun install
# or
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
JWT_SECRET=your-secret-key-here
```

> The app falls back to a default secret in development, but you should set a strong value in production.

### Database Setup

```bash
# Push the schema to the SQLite database
bun run db:push
# or
npx drizzle-kit push
```

### Run the Development Server

```bash
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to start painting!

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + Radix UI
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **React**: React 19
- **Database**: SQLite via [Drizzle ORM](https://orm.drizzle.team/)
- **Auth**: JWT (jose) + bcryptjs

## 📁 Project Structure

```
paint_everything/
├── app/
│   ├── api/
│   │   ├── auth/             # Login, logout, register, me endpoints
│   │   ├── drawings/         # CRUD + share endpoints for drawings
│   │   └── share/[token]/    # Public share token lookup
│   ├── components/
│   │   ├── PaintCanvas.tsx   # Canvas with drawing logic
│   │   ├── Toolbar.tsx       # Sidebar with tools and controls
│   │   ├── AuthDialog.tsx    # Sign up / login modal
│   │   ├── GalleryDialog.tsx # Saved drawings gallery
│   │   ├── SaveDialog.tsx    # Save drawing dialog
│   │   ├── SaveStatusIndicator.tsx
│   │   ├── ShareDialog.tsx   # Share link dialog
│   │   └── UserMenu.tsx      # User account menu
│   ├── share/[token]/        # Public view for shared drawings
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts          # Drizzle client
│   │   └── schema.ts         # Users and drawings tables
│   ├── auth.ts               # JWT helpers
│   ├── auth-context.tsx      # React auth context
│   └── utils.ts
└── public/
```

## 🎯 How to Use

1. **Select a Tool** - Click on any tool in the toolbar or use keyboard shortcuts
2. **Choose a Color** - Use the color picker or click a preset color
3. **Adjust Size** - Use the slider to change brush/shape size
4. **Draw** - Click and drag on the canvas to create your artwork
5. **Sign Up / Log In** - Create an account to save your work to the cloud
6. **Save** - Name and save your drawing; it will appear in your gallery
7. **Share** - Generate a public link and share your artwork with anyone

## 📄 License

MIT License - feel free to use this project for learning or building your own applications!

---

Made with ❤️ using Next.js and React
