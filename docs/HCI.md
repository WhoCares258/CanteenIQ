# CanteenIQ HCI evaluation notes

The group draft describes a time-constrained vendor, kitchen staff using a shared tablet, and an administrator comparing waste across vendors. The CSC3024 brief and rubric distinguish a functional prototype from participant evaluation. The walkthrough below provides a repeatable starting state for that evaluation.

## Task analysis and implemented screens

| Goal | Screen sequence | Observable end state |
| --- | --- | --- |
| Confirm tomorrow’s preparation | Overview → Demand forecast → adjust dish quantities → inspect ingredients → review → confirm | A dated, confirmed plan appears on the kitchen board on its service date. |
| Resolve ingredient shortages | Inventory → compare required and available stock → replenish → choose source → confirm → receive | A pending request becomes received and the ingredient balance increases. |
| Complete kitchen preparation | Kitchen board → inspect remaining portions → choose batch size → start → complete → report issue if needed | The remaining count and stock decrease. The manager sees reported issues. |
| Record end-of-day waste | Waste log → select staff → select meal or ingredient → enter amount and reason → review → submit | The entry, cost and weight appear. Undo reverses the record and associated stock adjustment. |
| Analyse performance and report | Waste analytics → filter → compare against 6% → inspect vendor → Reports → configure → preview → export | The selected period and vendor appear in the CSV and printable report. |

## Nielsen’s heuristics in the prototype

| Principle | Design decision |
| --- | --- |
| Visibility of system status | Draft, confirmed, cooking, pending and received states use text. Progress and stock totals update after each transaction. |
| Match with the real world | Staff work with familiar dishes, service dates, portions, kilograms and RM. |
| User control and freedom | Drafts remain editable, review dialogs support cancellation, and submitted waste entries support undo. |
| Consistency and standards | Shared navigation, labelled fields, cards, confirmation dialogs and action placement recur across roles. |
| Error prevention | Quantity checks, batch reservations and final plan review guard against impossible transactions. |
| Recognition over recall | Each dish shows its counts. Replenishment opens with the shortage quantity filled in. |
| Flexibility and efficiency | Default batch sizes, selectable reasons and tablet-sized cooking actions reduce typing. |
| Aesthetic and minimalist design | Role-specific navigation limits each workspace to relevant tasks. |
| Recognise, diagnose and recover from errors | Batch errors explain stock constraints and suggest receiving stock or reducing batch size. |
| Help and documentation | The in-app Demo guide explains role handoffs and the service-date change. |

## Proposed participant session

Reset before each participant. Record device, task time, independent completion, errors, prompts and comments. Ask participants to think aloud. Record any facilitator intervention separately.

1. As a vendor, plan 180 Chicken Rice portions for tomorrow. Ask the participant which ingredient changes and when the kitchen can see the plan.
2. Obtain a missing ingredient from another vendor. Ask when the additional kilograms become usable.
3. As kitchen staff on the scheduled date, prepare 20 portions, report a delay and identify the remaining quantity.
4. Record three unsold Chicken Rice portions under a chosen staff profile. Time the workflow against the draft’s proposed 60-second target. Ask the participant to correct a mistaken entry.
5. As administrator, identify a vendor above the 6% target, inspect its performance and export a seven-day report with daily detail.

Ask which status was hardest to interpret and where the participant hesitated. Use observed difficulties to prioritise the next iteration. Participant results remain open for the group to collect.

## Prototype iteration log

| Iteration | Implemented change | Evidence or rationale |
| --- | --- | --- |
| Shared operating model | Linked dated meal plans, recipes, stock, batch progress and waste records. | Model tests exercise quantity recalculation, duplicate actions, reservations, rounding and undo. |
| Role-specific interfaces | Added manager overview, tablet kitchen controls and campus reporting. | Each task in the group draft maps to a role and a visible completion state. |
| Workflow verification | Added stable request IDs, in-dialog error feedback and explicit form labels. | Browser testing exposed an ambiguous select label during replenishment. The corrected label supports the complete cross-role walkthrough. |
| Responsive verification | Exercised role switching and reporting at desktop, tablet and mobile sizes. | Browser checks measure page overflow and capture rendered layouts at each size. |
| Wireframe alignment | Added dated Today and Tomorrow previews, direct access to forecast factors and portion steppers. Moved vendor target status ahead of historical charts. | The manager wireframe moves from forecast to adjustment to confirmation. The administrator wireframe starts with target exceptions. |

These entries describe implementation and engineering verification. Participant observations should be added after the group conducts its sessions.
