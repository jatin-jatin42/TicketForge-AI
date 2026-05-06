# Swagger & API Documentation Strategy

## 🚀 Overview
This project uses **OpenAPI 3.0** (Swagger) to document the backend services. The setup is designed to be **scalable**, **modular**, and **non-intrusive**, allowing the documentation to grow alongside the codebase without cluttering the business logic.

**Swagger UI URL:** `http://localhost:4000/api-docs` (Local)

---

## 📂 Documentation Structure
To ensure scalability, the documentation is split into **actual REST routes** and **virtual service definitions** (for GraphQL/Internal logic).

| Domain | Type | Source File | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `REST` | `src/auth/auth.routes.ts` | Real endpoints for Login, Register, Refresh Token. |
| **Upload** | `REST` | `src/upload/upload.routes.ts` | Real endpoint for Admin Image Uploads. |
| **Booking** | `Virtual` | `src/bookings/bookings.swagger.ts` | Documents the Booking Logic (currently handled via GraphQL Mutation). |
| **Pricing** | `Virtual` | `src/pricing/pricing.swagger.ts` | Documents the Dynamic Pricing Engine & AI Demand Model inputs/outputs. |
| **Events** | `Virtual` | `src/events/events.swagger.ts` | Documents Event Sourcing & Retrieval logic. |
| **Payments** | `Virtual` | `src/payments/payments.swagger.ts` | Documents Razorpay Integration flow (Order Creation & Verification). |
| **Fraud** | `Virtual` | `src/fraud/fraud.swagger.ts` | Documents the internal AI Fraud Detection Service. |

---

## 🛠 Scalability Principles

### 1. **Distributed Documentation files (`*.swagger.ts`)**
Instead of a gigantic `swagger.json` file, we define documentation **alongside the code**.
- **REST Routes**: JSDoc comments (`@openapi`) are placed directly above the controller/route in `.routes.ts`.
- **Complex/GraphQL Logic**: Dedicated `.swagger.ts` files are used. This allows us to document "Logical APIs" even if they strictly live inside a GraphQL resolver or internal service.

### 2. **Auto-Discovery**
The Swagger Config (`src/swagger/swagger.config.ts`) is configured to automatically scan specifically named files:
```typescript
apis: [
  './src/**/*.routes.ts',      // Standard REST Routes
  './src/**/*.controller.ts',  // Controllers
  './src/**/*.swagger.ts'      // Dedicated Documentation Files
]
```
This means when you add a new module (e.g., `src/notifications/notifications.swagger.ts`), it automatically appears in the docs without changing global config.

### 3. **Reusable Schemas**
Common data structures are defined centrally in `src/swagger/swagger.config.ts` under `components/schemas`.
- `BookingRequest`
- `PricingResponse`
- `FraudScore`
- `UserProfile`

This ensures consistency across different endpoints and mocks.

---

## 📖 How to Add New Docs

1. **For a new REST Route:**
   Add the `@openapi` comment directly above your `router.get()` or `router.post()` call in standard JSDoc format.

2. **For a new Service/Module:**
   Create a `[module].swagger.ts` file in your module folder.
   ```typescript
   /**
    * @openapi
    * /my-module/action:
    *   post:
    *     tags: [MyModule]
    *     summary: Does something cool
    *     ...
    */
   ```

3. **Verify:**
   Check `/api-docs` to see your changes instantly (hot-reload supported).
