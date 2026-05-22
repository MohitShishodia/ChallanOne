# ChallanOne Test Suite

Run all tests from the `ChallanOne` folder:

```bash
npm test
```

Or run per package:

```bash
npm run test:server   # Node.js built-in test runner
npm run test:client   # Vitest + React Testing Library
npm run test:admin    # Vitest + React Testing Library
```

## Server (`server/`)

Uses Node.js native `node:test` (no extra test framework).

| Test file | Coverage |
|-----------|----------|
| `tests/delhiOtpChallan.test.js` | Delhi OTP transform, filtering, run states, error mapping |
| `tests/challanHelpers.test.js` | Name masking, date/time formatting, vehicle normalization |
| `tests/validate.middleware.test.js` | Zod validation middleware |
| `tests/delhiOtpRoutes.test.js` | Delhi OTP HTTP routes (mocked external API) |

```bash
cd server && npm test
```

## Client (`client/`)

Uses Vitest + React Testing Library + jsdom.

| Test file | Coverage |
|-----------|----------|
| `src/utils/challanUtils.test.js` | Flow types, external challan transform, payment totals |
| `src/config/api.test.js` | API endpoint configuration |
| `src/components/ui/StatusBadge.test.jsx` | Status badge rendering |
| `src/components/ui/PrimaryButton.test.jsx` | Button component |
| `src/components/ui/InputField.test.jsx` | Input field component |
| `src/components/ProtectedRoute.test.jsx` | Auth-gated route |
| `src/pages/PayChallan.test.jsx` | Flow selector, Fetch All, Delhi OTP integration |
| `src/pages/Home.test.jsx` | Home page CTAs |
| `src/components/DelhiOtpFlow.test.jsx` | OTP input steps and API errors |

```bash
cd client && npm test
```

## Admin (`admin/`)

Uses Vitest + React Testing Library + jsdom.

| Test file | Coverage |
|-----------|----------|
| `src/utils/formatters.test.js` | Currency, date, number formatters |
| `src/utils/api.test.js` | API URL builder |
| `src/hooks/useDebounce.test.js` | Debounce hook |
| `src/components/ui/Badge.test.jsx` | Status badge component |
| `src/components/ui/DataTable.test.jsx` | Data table rendering |
| `src/pages/Dashboard.test.jsx` | Dashboard stats, charts, activity |
| `src/pages/challans/ChallanList.test.jsx` | Challan list, modal, status update |

```bash
cd admin && npm test
```

## Watch mode

```bash
cd client && npm run test:watch
cd admin && npm run test:watch
cd server && npm run test:watch
```
