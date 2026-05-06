# 🧪 Testing Guide - TicketForge AI

This document provides a comprehensive overview of the testing architecture, strategies, and commands for the TicketForge AI project.

---

## 📚 Table of Contents
1. [Testing Strategy](#-testing-strategy)
2. [Quick Start Commands](#-quick-start-commands)
3. [Backend Testing (Jest)](#-backend-testing-jest)
4. [Frontend Testing (Jest + RTL)](#-frontend-testing-jest--rtl)
5. [E2E Testing (Playwright)](#-e2e-testing-playwright)
6. [Best Practices](#-best-practices)
7. [Architecture Map](#-architecture-map)

---

## 🎯 Testing Strategy

We follow the **Testing Pyramid** approach to ensure maximum reliability with optimal performance.

| Layer | Tool | Coverage | Speed |
| :--- | :--- | :--- | :--- |
| **Unit Tests** | Jest | Business logic, utilities, individual components. | ⚡ Instant |
| **Integration Tests** | Jest + DB | Service-to-DB interactions, complex workflows. | 🚄 Fast |
| **E2E Tests** | Playwright | Critical user journeys (Booking, Login, Search). | 🐢 Slow |

---

## 🚀 Quick Start Commands

### Root Level (All Tests)
From the project root:
```bash
pnpm test          # Runs all Unit/Integration tests
```

### Backend (API)
Navigate to `apps/api`:
```bash
pnpm test          # Run all backend tests
pnpm test:watch    # Watch mode
pnpm test <file>   # Run specific test file
```

### Frontend (Web)
Navigate to `apps/web`:
```bash
pnpm test          # Run all frontend tests
pnpm test <file>   # Run specific test file
```

### End-to-End (E2E)
From the project root:
```bash
npx playwright test          # Run all E2E tests (Headless)
npx playwright test --ui     # Open Interactive UI (Recommended)
npx playwright test --debug  # Step-by-step debugging
```

---

## 🔧 Backend Testing (Jest)

The backend tests focus on business logic accuracy (Pricing, Auth, Bookings).

### Key Test Suites:
- `pricing.service.test.ts`: Validates dynamic pricing algorithms and multipliers.
- `bookings.service.test.ts`: Ensures safe room/seat locking and transaction integrity.
- `auth.utils.test.ts`: Verifies JWT signing, verification, and role-based security.
- `demandModel.test.ts`: Verifies TensorFlow AI model predictions.

### Example Assertion:
```typescript
test('should apply demand multiplier correctly', () => {
  const price = calculateDynamicPrice({
    basePrice: 1000,
    bookedSeats: 85,
    totalSeats: 100, // 85% occupancy
    eventDate: tomorrow
  });
  expect(price).toBe(1200); // 1.2x multiplier for >70% demand
});
```

---

## 🎨 Frontend Testing (Jest + RTL)

Frontend tests focus on component rendering and user interaction logic.

### Key Test Suites:
- `EventCard.test.tsx`: Checks if event details and INR prices render correctly.
- `Navigation.test.tsx`: Validates header behavior for logged-in vs logged-out users.
- `useSeatSelection.test.ts`: Tests the complex math of selecting multiple seats.
- `Button.test.tsx`: Ensures design system components meet accessibility and style rules.

---

## 🎭 E2E Testing (Playwright)

E2E tests simulate a real user in a real browser, covering the "Main Journey".

### The "Golden Path" - `booking-flow.spec.ts`:
1. **Browse**: User lands on homepage and views events.
2. **Select**: User chooses an event and selects seats A1 & A2.
3. **Checkout**: User proceeds to checkout and enters details.
4. **Pay**: User triggers payment simulation.
5. **Confirm**: User verifies the confirmation page and QR Code display.

---

## ✅ Best Practices

1. **AAA Pattern**: Always structure tests by **Arrange** (setup), **Act** (execute), **Assert** (verify).
2. **Deterministic Data**: Use fixed timestamps or mocks for dates to avoid "flaky" tests that fail depending on when they run.
3. **Mocking**: Use `jest.mock()` for external services (Cloudinary, Razorpay, Kafka) to keep tests fast and independent of the internet.
4. **Clean State**: Always clean up database data or clear mocks in `beforeEach`.

---

## 🗺️ Architecture Map

```text
TicketForge-AI/
├── apps/
│   ├── api/ (Backend)
│   │   ├── src/
│   │   │   ├── pricing/          ──▶ [Unit Tests]
│   │   │   ├── auth/             ──▶ [Unit Tests]
│   │   │   └── events/           ──▶ [Integration Tests]
│   │   └── jest.setup.ts         ──▶ [Global Mocks]
│   └── web/ (Frontend)
│       └── src/
│           ├── components/       ──▶ [Component Tests]
│           ├── hooks/            ──▶ [Hook Tests]
│           └── lib/              ──▶ [Util Tests]
└── test/
    └── e2e/                      ──▶ [Playwright Journeys]
```

Happy Testing! 🚀
