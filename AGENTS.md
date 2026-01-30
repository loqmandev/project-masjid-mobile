# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains Expo Router screens and layouts (file-based routing). Example: `app/(tabs)/index.tsx` for Home.
- `components/` houses shared UI and feature components (`components/ui/` for primitives).
- `hooks/`, `lib/`, and `constants/` keep reusable logic, API clients, and theme tokens.
- `assets/` stores images, icons, and fonts used by the app.
- `docs/` holds product and technical specs (see `docs/PRD.md`, `docs/TECHNICAL_SPEC.md`).
- Native projects live in `android/` and `ios/` (generated/managed by Expo).

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npx expo start`: run the dev server (mobile + web). Use `--clear` to clear cache.
- `npm run android` / `npm run ios`: open native dev builds.
- `npm run web`: run the web target.
- `npm run prebuild`: generate native projects from Expo config.
- `npm run lint`: run ESLint via Expo (no tests configured yet).

## Coding Style & Naming Conventions

### Formatting & Indentation
- 2-space indentation consistently throughout the codebase.
- No trailing whitespace.
- Use functional components with React hooks (no class components).

### Imports
- Use `@/` path alias for root-based imports (configured in tsconfig.json):
  ```typescript
  import { Card } from '@/components/ui/card';
  import { Colors, Spacing } from '@/constants/theme';
  import { useColorScheme } from '@/hooks/use-color-scheme';
  ```
- Organize imports: React/React Native first, third-party packages next, then local imports with `@/`.
- Prefer absolute imports over relative imports (`@/components/ui/card` not `../../components/ui/card`).

### Types & TypeScript
- TypeScript strict mode enabled (`strict: true` in tsconfig.json).
- Define interfaces for component props, extending React Native types where appropriate:
  ```typescript
  interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold';
    loading?: boolean;
  }
  ```
- Use `const` type assertions for literal types: `'600' as const`.
- Export interfaces for complex data structures (e.g., `LocationState`, `LocationCoords`).

### Naming Conventions
- **Components**: PascalCase (`Card`, `HomeScreen`, `ProgressBar`).
- **Hooks**: camelCase with `use` prefix (`useLocation`, `useUserProfile`, `useColorScheme`).
- **Variables/Functions**: camelCase (`isLoading`, `handlePress`, `getLocation`).
- **Constants**: lowercase with object notation (`primary[500]`, `Spacing.md`, `Typography.h1`).
- **File names**: kebab-case for UI components (`card.tsx`, `button.tsx`), PascalCase for screens (`index.tsx`, `explore.tsx`).

### Error Handling
- Use try-catch blocks with meaningful error messages.
- Store error state in hooks: `error: string | null`.
- Provide fallback behavior (e.g., cached data when API fails).
- Display user-friendly error messages in UI with retry functionality.
- Check for Error instances when setting error state: `err instanceof Error ? err.message : 'Fallback error'`.

### State Management
- Custom hooks for reusable state logic with TypeScript interfaces.
- TanStack Query (@tanstack/react-query) for server state with caching and retries.
- QueryClient configured globally in `_layout.tsx` with `retry: 2` and `staleTime: 30s`.
- Use `useState` for component-specific local state only.

### Styling & Theming
- Centralized theme in `constants/theme.ts`: exports `Colors`, `Spacing`, `BorderRadius`, `Typography`.
- Use `StyleSheet.create()` at the bottom of components for styles.
- Leverage theme constants for consistency: `Spacing.md`, `Colors[colorScheme].background`.
- Support light/dark mode with `useColorScheme()` hook from `@/hooks/use-color-scheme`.
- Apply theme colors dynamically: `colors.text`, `colors.primary`, etc.
- Platform-specific fonts in `Fonts` constant (iOS, Android, Web).

### Component Patterns
- Functional components with TypeScript.
- Props interface should extend relevant React Native props (e.g., `ViewProps`, `TouchableOpacityProps`).
- Provide default values for optional props (`variant = 'primary'`, `size = 'md'`).
- Destructure props with `...props` for passthrough to native components.
- Use conditional rendering for loading/error states.

### Accessibility & UX
- Use SafeAreaView with `useSafeAreaInsets()` for proper padding.
- Add haptic feedback with `expo-haptics` for touch interactions.
- Ensure good color contrast in both light and dark themes.
- Use semantic color tokens: `colors.text`, `colors.textSecondary`, `colors.success`, etc.

### Comments
- JSDoc-style comments at top of modules to describe purpose.
- Brief comments for complex logic sections.
- Keep comments concise and update them when code changes.

### File Organization
- Co-locate related files (e.g., `components/ui/card.tsx`).
- Use barrel exports (`index.ts`) when appropriate for cleaner imports.
- Keep styles near the component they apply to.

## Testing Guidelines
- No test runner is currently configured in this repo.
- If adding tests, document the tool (Jest, React Native Testing Library) and add scripts to `package.json`.
- Suggested naming: `*.test.ts(x)` colocated with features or under `__tests__/` directory.

## Commit & Pull Request Guidelines
- Commit history uses type prefixes: `FEAT: ...`, `FIX: ...`, `REFACTOR: ...`, `chore: ...`.
- Keep commit subjects imperative and focused (one change per commit).
- PRs should include: concise description, screenshots for UI changes, links to issues/specs in `docs/`.

## Agent-Specific Instructions
- Additional architectural notes live in `CLAUDE.md`.
- Follow routing structure defined in `CLAUDE.md` when adding new screens.
- Mock data patterns: place mock data at top of screen files, replace with API calls when backend is ready.
- Planned backend: Firebase Auth (Google OAuth), AWS DynamoDB (single-table), Lambda + API Gateway, S3 for photos.
