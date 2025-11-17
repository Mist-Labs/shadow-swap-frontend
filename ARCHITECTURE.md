# Shadow Swap Architecture

## Overview

Shadow Swap is built with performance and maintainability in mind. This document outlines the architecture decisions and patterns used throughout the application.

## Technology Stack

### Core Framework
- **Next.js 16** - React framework with App Router for optimal performance
- **TypeScript 5** - Type safety and better developer experience
- **Tailwind CSS 4** - Utility-first CSS with modern features

### State Management
- **Zustand** - Lightweight (3KB) state management
  - No boilerplate
  - Minimal re-renders
  - Easy to test
  - No Provider wrapper needed

### Blockchain Integration
- **Starknet.js 6** - Official Starknet SDK
- **get-starknet-core** - Wallet connection abstraction
- Custom wallet connectors for ArgentX, Braavos, and Cartridge

### UI/UX
- **Framer Motion** - Production-ready animation library
- **Lucide React** - Tree-shakeable icon library
- Custom components for maximum control

## Project Structure

```
shadow-swap-frontend/
│
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with fonts and metadata
│   ├── page.tsx                 # Home page with swap interface
│   └── globals.css              # Global styles and Tailwind config
│
├── components/                   # React Components
│   ├── effects/                 # Visual effects components
│   │   └── noise-background.tsx # Canvas-based noise animation
│   │
│   ├── swap/                    # Swap feature components
│   │   ├── swap-card.tsx       # Main swap interface
│   │   ├── token-select.tsx    # Token selection dropdown
│   │   └── settings-modal.tsx  # Slippage settings
│   │
│   ├── ui/                      # Reusable UI components
│   │   ├── modal.tsx           # Generic modal wrapper
│   │   └── button.tsx          # Animated button component
│   │
│   └── wallet/                  # Wallet integration
│       ├── wallet-button.tsx   # Connect/disconnect button
│       └── wallet-modal.tsx    # Wallet selection modal
│
├── lib/                          # Business Logic
│   ├── constants/               # App constants
│   │   ├── tokens.ts           # Supported tokens list
│   │   └── networks.ts         # Network configurations
│   │
│   ├── stores/                  # Zustand stores
│   │   ├── wallet-store.ts     # Wallet connection state
│   │   └── swap-store.ts       # Swap interface state
│   │
│   ├── utils/                   # Utility functions
│   │   └── format.ts           # Formatting helpers
│   │
│   └── wallet/                  # Wallet logic
│       └── connect.ts          # Wallet connection handlers
│
└── public/                       # Static Assets
    └── tokens/                  # Token logos (SVG)
```

## Design Patterns

### 1. Component Composition
Components are built to be composable and reusable. Each component has a single responsibility.

```typescript
// Good: Composable components
<SwapCard>
  <TokenSelect />
  <SettingsModal />
</SwapCard>

// Avoid: Monolithic components with too many responsibilities
```

### 2. State Management Strategy
- **Global State** (Zustand) - Wallet connection, swap data
- **Local State** (useState) - UI state like modals, dropdowns
- **Server State** - Will use React Query for API data (future)

### 3. Performance Optimization
- **Code Splitting** - Dynamic imports for large components
- **Memoization** - React.memo for expensive components
- **Lazy Loading** - Images and heavy assets loaded on demand
- **Tree Shaking** - Import only what you need

```typescript
// Good: Named imports for tree shaking
import { Wallet } from 'lucide-react';

// Avoid: Default imports from large libraries
import * as Icons from 'lucide-react';
```

### 4. Type Safety
All components and functions are fully typed:
- Interfaces for component props
- Type guards for runtime safety
- Enums for constants
- Utility types for complex scenarios

### 5. Error Handling
```typescript
try {
  await connectWallet(walletType);
} catch (error) {
  // User-friendly error messages
  // Graceful degradation
  // No app crashes
}
```

## State Flow

### Wallet Connection Flow
```
User clicks "Connect Wallet"
  ↓
WalletModal opens
  ↓
User selects wallet type
  ↓
connectWallet(type) called
  ↓
get-starknet-core handles connection
  ↓
Wallet store updated
  ↓
UI reflects connected state
```

### Swap Flow
```
User selects tokens
  ↓
User enters amount
  ↓
Quote calculated (future API call)
  ↓
User reviews transaction
  ↓
User clicks "Swap"
  ↓
Transaction sent to Starknet
  ↓
Confirmation displayed
```

## Styling Philosophy

### Utility-First with Tailwind
- Use Tailwind utilities for most styling
- Extract components for repeated patterns
- Use CSS variables for theming
- Animations with Framer Motion, not CSS

### Color Palette
- **Primary**: Purple (`#9333ea`) and Blue (`#3b82f6`)
- **Background**: Zinc shades for depth
- **Accent**: Subtle gradients and glows
- **Text**: White with opacity for hierarchy

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Fluid typography with clamp()
- Touch-friendly targets (44px minimum)

## Security Considerations

### Wallet Security
- Never store private keys
- All signing happens in wallet
- Clear permission requests
- Slippage protection

### Input Validation
- Sanitize all user inputs
- Validate amounts and addresses
- Prevent injection attacks
- Rate limiting on API calls

### Dependencies
- Regular security audits
- Minimal dependency tree
- Lock file for reproducible builds
- No deprecated packages

## Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: > 90
- **Bundle Size**: < 200KB (gzipped)

## Future Improvements

### Short Term
- [ ] Real DEX integration for quotes
- [ ] Transaction history
- [ ] Token balance display
- [ ] Price charts

### Medium Term
- [ ] Multi-hop routing
- [ ] Liquidity pools
- [ ] Limit orders
- [ ] Portfolio tracker

### Long Term
- [ ] Mobile app (React Native)
- [ ] Advanced trading features
- [ ] Social features
- [ ] Governance integration

## Testing Strategy

### Unit Tests
- Utility functions
- State management
- Business logic

### Integration Tests
- Wallet connection
- Swap flow
- API interactions

### E2E Tests
- Critical user journeys
- Wallet integration
- Transaction flows

## Deployment

### Development
```bash
pnpm dev
```

### Production Build
```bash
pnpm build
pnpm start
```

### CI/CD Pipeline
- Linting and type checking
- Build verification
- Automated testing
- Preview deployments
- Production deployment

## Contributing Guidelines

1. Follow TypeScript strict mode
2. Write tests for new features
3. Keep bundle size small
4. Document complex logic
5. Use semantic commit messages
6. Update this document when architecture changes

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Starknet Documentation](https://docs.starknet.io)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [Framer Motion](https://www.framer.com/motion)

