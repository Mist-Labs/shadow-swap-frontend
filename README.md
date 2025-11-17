# 👁️ Shadow Swap

A high-performance, privacy-focused decentralized exchange (DEX) built on Starknet. Shadow Swap offers lightning-fast token swaps with a beautiful, modern UI and support for multiple wallet providers.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)
![Starknet](https://img.shields.io/badge/Starknet-Mainnet-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwind-css)

## ✨ Features

### 🔐 Multi-Wallet Support
- **ArgentX** - The most popular Starknet wallet
- **Braavos** - Advanced security features
- **Cartridge** - Gaming-focused wallet with controller support

### 🎨 Modern Design
- **Noise Background** - Subtle animated texture for depth
- **Glassmorphism** - Elegant frosted glass effects
- **Smooth Animations** - Powered by Framer Motion
- **Responsive** - Works perfectly on all devices

### ⚡ Performance Optimized
- **Minimal Bundle Size** - Carefully selected dependencies
- **Tree Shaking** - Only import what you use
- **Fast Load Times** - Optimized for speed
- **Lightweight State** - Zustand for efficient state management

### 💱 Swap Features
- **Token Selection** - Easy-to-use token picker
- **Real-time Quotes** - Live pricing updates
- **Slippage Control** - Customizable slippage tolerance
- **Price Impact** - Clear transaction cost display

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- pnpm (recommended for performance)
- A Starknet wallet (ArgentX, Braavos, or Cartridge)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd shadow-swap-frontend
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Project Structure

```
shadow-swap-frontend/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── effects/            # Visual effects
│   │   └── noise-background.tsx
│   ├── swap/               # Swap-related components
│   │   ├── swap-card.tsx
│   │   ├── token-select.tsx
│   │   └── settings-modal.tsx
│   ├── ui/                 # Reusable UI components
│   │   └── modal.tsx
│   └── wallet/             # Wallet components
│       ├── wallet-button.tsx
│       └── wallet-modal.tsx
├── lib/                     # Business logic
│   ├── constants/          # App constants
│   │   └── tokens.ts
│   ├── stores/             # State management
│   │   ├── wallet-store.ts
│   │   └── swap-store.ts
│   ├── utils/              # Utility functions
│   │   └── format.ts
│   └── wallet/             # Wallet integration
│       └── connect.ts
└── public/                  # Static assets
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Blockchain**: Starknet.js 6
- **Wallet Connection**: get-starknet-core
- **Icons**: Lucide React

## 📦 Dependencies

### Core Dependencies (Minimal & Essential)
```json
{
  "starknet": "6.11.0",           // Starknet blockchain interaction
  "get-starknet-core": "latest",  // Wallet connection
  "framer-motion": "latest",      // Smooth animations
  "zustand": "latest",            // Lightweight state (3KB)
  "lucide-react": "latest"        // Tree-shakeable icons
}
```

## 🎯 Key Features Implemented

### Wallet Integration
- Custom lightweight wallet connector
- Support for ArgentX, Braavos, and Cartridge
- Connection state management
- Address formatting and display

### Swap Interface
- Token selection with search
- Amount input with validation
- Price impact calculation
- Slippage tolerance settings
- Transaction preview

### UI/UX
- Noise background animation
- Animated gradient orbs
- Smooth page transitions
- Hover and tap animations
- Modal dialogs with backdrop blur
- Custom scrollbar styling

## 🔒 Security Features

- Client-side wallet connection only
- No private keys stored
- Transaction signing through wallet
- Slippage protection
- Price impact warnings

## 🎨 Design Philosophy

Shadow Swap follows these design principles:

1. **Performance First** - Every dependency is justified
2. **Modern Aesthetics** - Beautiful but not overwhelming
3. **User Experience** - Intuitive and responsive
4. **Accessibility** - Keyboard navigation and focus states
5. **Dark Mode Native** - Designed for dark theme

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 90+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🚧 Roadmap

- [ ] Token price fetching from DEX APIs
- [ ] Real-time swap quotes
- [ ] Transaction history
- [ ] Liquidity pool information
- [ ] Advanced routing algorithms
- [ ] Multi-hop swaps
- [ ] Token analytics
- [ ] Portfolio tracker
- [ ] Limit orders
- [ ] Gas estimation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Starknet team for the amazing L2 solution
- ArgentX, Braavos, and Cartridge for wallet infrastructure
- Next.js team for the incredible framework
- Tailwind CSS for the utility-first CSS framework

## 📞 Support

For support, please open an issue in the GitHub repository.

---

Built with ❤️ for the Starknet ecosystem
