# Falcon - Next-Gen Google Hub & Search Experience

Falcon is a modern, high-performance web application combining a customized Google search homepage with smart apps, daily quizzes, customizable shortcuts, interactive widgets, and full user authentication.

## 🚀 Features

- 🔍 **Unified Search Hub**: Google Search with instant suggestions, voice search, lens integration, and smart tabs.
- 🔐 **Authentication System**: Secure JWT-based authentication with MongoDB and bcrypt password hashing.
- 🧩 **Interactive Daily Quiz**: Engaging quiz widget with streaks, animations, and confetti celebrations.
- 📱 **Google Apps & Shortcuts Grid**: Quick access to Google Apps, custom bookmarks, and quick links.
- 🎨 **Modern Aesthetics**: Sleek dark/light theme support, glassmorphism, responsive mobile/desktop design.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Auth**: JWT (jsonwebtoken) & bcryptjs
- **Icons**: Lucide React
- **Effects**: Canvas Confetti

## 📦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/ScripterCode200/Falcon-HomePage.git
cd Falcon-HomePage
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Update `.env.local` with your MongoDB URI and JWT Secret:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=365d
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📄 License
MIT
