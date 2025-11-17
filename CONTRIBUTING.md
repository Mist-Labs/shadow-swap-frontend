# Contributing to Shadow Swap

Thank you for your interest in contributing to Shadow Swap! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a professional environment

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- A Starknet wallet for testing
- Basic knowledge of React, TypeScript, and Starknet

### Development Setup

1. Fork the repository
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/shadow-swap-frontend.git
cd shadow-swap-frontend
```

3. Install dependencies:

```bash
pnpm install
```

4. Create a branch:

```bash
git checkout -b feature/your-feature-name
```

5. Start development server:

```bash
pnpm dev
```

## Development Guidelines

### Code Style

- **TypeScript**: Use strict mode, no `any` types
- **Components**: Functional components with hooks
- **Naming**:
  - Components: PascalCase (`SwapCard.tsx`)
  - Files: kebab-case (`wallet-store.ts`)
  - Functions: camelCase (`formatAddress`)
- **Imports**: Absolute imports with `@/` prefix

### Component Guidelines

```typescript
// Good component structure
'use client' // Only if using hooks/client features

import { useState } from 'react'
import { motion } from 'framer-motion'

interface MyComponentProps {
  title: string
  onAction: () => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState(false)

  return <motion.div>{/* Component content */}</motion.div>
}
```

### State Management

- Use Zustand for global state
- Use useState for local UI state
- Keep stores focused and minimal
- Document state updates

### Styling

- Use Tailwind utility classes
- Follow mobile-first approach
- Use semantic color names
- Keep animations smooth (60fps)

### Performance

- Lazy load heavy components
- Optimize images (use SVG when possible)
- Minimize re-renders
- Keep bundle size small

## Making Changes

### Before You Start

1. Check existing issues and PRs
2. Create or comment on an issue
3. Wait for maintainer feedback
4. Fork and create a branch

### While Working

1. Write clean, readable code
2. Add comments for complex logic
3. Keep commits atomic and focused
4. Test your changes thoroughly

### Before Submitting

1. Run linter:

```bash
pnpm lint
```

2. Build the project:

```bash
pnpm build
```

3. Test in multiple browsers
4. Update documentation if needed

## Commit Guidelines

Use semantic commit messages:

```
feat: add token search functionality
fix: resolve wallet connection issue
docs: update README with new features
style: format code with prettier
refactor: simplify swap logic
perf: optimize token list rendering
test: add wallet connection tests
chore: update dependencies
```

Examples:

```bash
git commit -m "feat: add multi-hop swap routing"
git commit -m "fix: prevent negative token amounts"
git commit -m "docs: add architecture diagram"
```

## Pull Request Process

### Creating a PR

1. Push your branch to your fork
2. Open a PR against `main` branch
3. Fill out the PR template
4. Link related issues

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tested locally
- [ ] Tested with wallet
- [ ] Checked responsive design
- [ ] No console errors

## Screenshots

Add screenshots for UI changes

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. Maintainers will review your PR
2. Address feedback and comments
3. Make requested changes
4. Wait for approval
5. PR will be merged by maintainers

## Areas to Contribute

### High Priority

- Real DEX integration
- Token price feeds
- Transaction history
- Improved error handling

### Medium Priority

- Additional wallet support
- Multi-language support
- Advanced swap features
- Performance optimizations

### Good First Issues

- UI improvements
- Documentation
- Testing
- Bug fixes

## Testing

### Manual Testing

- Test all wallet connections
- Try different token combinations
- Test error scenarios
- Check responsive layouts

### Browser Testing

- Chrome/Edge
- Firefox
- Safari
- Mobile browsers

## Documentation

Update documentation for:

- New features
- API changes
- Configuration options
- Breaking changes

## Questions?

- Open a discussion on GitHub
- Check existing documentation
- Ask in PRs/issues
- Be patient and respectful

## Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation
