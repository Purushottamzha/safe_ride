# Contributing to SafeRide Nepal

## Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Code Standards

### Backend (NestJS)
- Follow NestJS module convention: module, controller, service, DTO, guard
- Use class-validator decorators for all DTOs
- Write unit tests for services and E2E tests for controllers
- Use Prisma for all database queries
- Document all endpoints with Swagger decorators

### Frontend (React)
- Use TypeScript with strict mode
- Follow existing component patterns (GlassCard, KpiCard, etc.)
- Use MUI `sx` prop for styling with Emotion
- Use Framer Motion for animations
- Use react-query for data fetching
- Wrap new pages in `motion.div` with page transitions

### Git Conventions
- Use conventional commit messages: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Keep PRs focused on a single change
- Rebase before merging to main

## Pull Request Checklist

- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] No console.log statements (use logger in backend)
- [ ] New components use existing design system
