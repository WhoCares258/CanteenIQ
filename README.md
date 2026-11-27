# CanteenIQ

**Predict smarter. Prepare better. Waste less.**

A local, high-fidelity HCI prototype for predicting meal demand and reducing campus food waste. Three selectable roles share a Malaysian cafeteria scenario. All operations run in the browser.

## Run locally

Use Node.js 22 and npm. From the CanteenIQ directory run:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The application uses React, TypeScript, Vite, Tailwind CSS, reusable React controls, Recharts, Lucide icons and locally bundled Inter. To prepare a static Vercel build later, select the Vite preset, use `npm run build` and serve `dist/`.

## Demonstrate one service cycle

1. Start on **16 November 2026** as Vendor Manager at Seri Rasa Café. Select **Tomorrow** to preview demand and view influencing factors. Open **Review meal plan**, change Chicken Rice to 180 portions and inspect the ingredient requirements. Save a draft, then review and confirm it.
2. In **Inventory**, replenish each short ingredient. Choose a supplier or campus vendor, review the request, then receive it. Check how pending and available stock change.
3. Use the profile button to switch to **Kitchen Staff**. Open the date selector, choose **Tomorrow · Tue, 17 Nov**, then apply it. Start a Chicken Rice batch of 20 and complete it. Report a service delay. The manager can see the issue in Overview or workspace activity.
4. Open **Waste log**, choose a staff member and record three unsold Chicken Rice portions. Review the estimated **1.14 kg** and **RM 12.60**, then submit. Try a spoiled ingredient entry and undo it.
5. Switch to **Campus Administrator**. Filter analytics to the selected date and Seri Rasa Café to isolate the logged waste. Compare campus vendors over seven days. In **Reports**, configure the period, vendor and daily detail, preview, then download CSV or print to PDF.
6. Refresh to verify persistence. Use **Demo controls → Reset demo data** to start the original scenario again.

## Calculations and limitations

- Forecasts use fixed dish baselines and weekday adjustments. Historical demand and peer vendor records are deterministic fixtures. Weather and event descriptions illustrate influencing factors. The prototype uses no live feeds or trained model.
- Ingredient mass equals planned portions multiplied by each dish’s recipe. Active batches reserve ingredients. Completing a batch deducts them once. Stock is a current balance across demo dates. Changing the date selects service records and leaves transactions intact.
- Meal waste uses a fixed portion mass and unit cost. Spoiled ingredients use kilograms and RM per kilogram. Undo restores spoiled stock. Waste rate divides discarded mass by handled food mass. For the active vendor this is prepared meal mass plus separately discarded ingredients.
- Forecast accuracy is 100 × (1 − total absolute forecast error / total actual demand) for closed simulated records. Live preparation progress measures production, so it is excluded from the accuracy denominator.
- The 6% target and prices are illustrative. Demo roles switch without authentication. Use one tab for a walkthrough. LocalStorage is scoped to the browser and origin, with no cross-device synchronisation or external orders.
- The print button opens the browser print dialog, where the presenter can choose Save as PDF.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

To use an existing Microsoft Edge installation in PowerShell, set `$env:PW_BROWSER_CHANNEL='msedge'` before running browser tests. The browser suite starts an isolated Vite server on port 5187 and uses fresh browser contexts. Screenshots are written to the ignored test-results directory.

See [HCI evaluation notes](docs/HCI.md) for task mappings, design rationale, proposed participant tasks and the prototype iteration log.
