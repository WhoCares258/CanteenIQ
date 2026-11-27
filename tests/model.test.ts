import test from "node:test";
import assert from "node:assert/strict";
import {
  newState,
  update,
  getPlan,
  requirements,
  metrics,
  aggregate,
  HOME,
  offset,
  wasteValue,
  validDate,
  vendors,
  type Waste,
} from "../src/model";

test("a dated draft recalculates ingredients and confirmation locks its quantities", () => {
  const s = newState(),
    date = offset(HOME, 1),
    quantities = [10, 0, 0, 0];
  const saved = update(s, {
    type: "savePlan",
    date,
    quantities,
    confirm: false,
  });
  assert.deepEqual(
    requirements(getPlan(saved, date).quantities),
    [0.9, 1.4, 0, 0, 0.4, 0],
  );
  assert.equal(getPlan(saved, date).confirmed, false);
  const locked = update(saved, {
    type: "savePlan",
    date,
    quantities,
    confirm: true,
  });
  assert.throws(() =>
    update(locked, { type: "savePlan", date, quantities, confirm: true }),
  );
  assert.throws(() =>
    update(s, {
      type: "savePlan",
      date,
      quantities: [0, 0, 0, 0],
      confirm: true,
    }),
  );
  assert.throws(() =>
    update(s, {
      type: "savePlan",
      date,
      quantities: [0.5, -1, 0, 0],
      confirm: true,
    }),
  );
  assert.equal(getPlan(locked, HOME).quantities[0], 162);
});
test("pending, received and repeated supplier or transfer requests preserve stock", () => {
  for (const source of [
    "Supplier · Pasar Segar",
    "Vendor transfer · Kolej Kitchen",
  ]) {
    const s = newState(),
      order = {
        type: "order" as const,
        id: "a",
        ingredient: 1,
        kg: 3.25,
        source,
      };
    const pending = update(s, order);
    assert.equal(pending.stock[1], 16);
    assert.throws(() => update(pending, order));
    const received = update(pending, { type: "receive", id: "a" });
    assert.equal(received.stock[1], 19.25);
    assert.throws(() => update(received, { type: "receive", id: "a" }));
    assert.throws(() => update(s, { ...order, kg: -1 }));
  }
});
test("batch reservation, completion and repeat prevention respect current inventory", () => {
  const s = newState();
  assert.throws(() => update(s, { type: "start", dish: 0, count: 1000 }));
  const started = update(s, { type: "start", dish: 0, count: 50 });
  assert.equal(started.stock[1], 16);
  assert.throws(() => update(started, { type: "start", dish: 0, count: 1 }));
  const spoiled: Waste = {
    id: "bad",
    date: HOME,
    kind: "Ingredient",
    item: 1,
    quantity: 10,
    reason: "Spoilage",
    staff: "Aina Rahman",
  };
  assert.throws(() => update(started, { type: "waste", entry: spoiled }));
  const done = update(started, { type: "complete", dish: 0 });
  assert.equal(done.stock[1], 9);
  assert.equal(getPlan(done, HOME).prepared[0], 130);
  assert.throws(() => update(done, { type: "complete", dish: 0 }));
});
test("both waste types update filtered analytics and undo restores the original totals", () => {
  const s = newState(),
    before = aggregate(metrics(s, 7, "All vendors"));
  for (const kind of ["Meal", "Ingredient"] as const) {
    const entry: Waste = {
      id: "w",
      date: HOME,
      kind,
      item: 0,
      quantity: 2,
      reason: "Quality concern",
      staff: "Aina Rahman",
    };
    const saved = update(s, { type: "waste", entry });
    assert.throws(() => update(saved, { type: "waste", entry }));
    const change = wasteValue(entry),
      after = aggregate(metrics(saved, 7, "All vendors"));
    assert.ok(Math.abs(after.weight - before.weight - change.weight) < 1e-7);
    assert.ok(Math.abs(after.cost - before.cost - change.cost) < 1e-7);
    assert.deepEqual(metrics(s, 7, vendors[1]), metrics(saved, 7, vendors[1]));
    assert.deepEqual(update(saved, { type: "undo", id: "w" }), s);
  }
  assert.throws(() =>
    update(s, {
      type: "waste",
      entry: {
        id: "bad",
        date: HOME,
        kind: "Meal",
        item: 0,
        quantity: 81,
        reason: "Overproduction",
        staff: "Aina Rahman",
      },
    }),
  );
});
test("date, role and reload preserve a completed plan, issues and transaction records", () => {
  const date = offset(HOME, 1);
  let s = update(newState(), {
    type: "savePlan",
    date,
    quantities: [2, 0, 0, 0],
    confirm: true,
  });
  s = update(s, { type: "date", date });
  s = update(s, { type: "role", role: "Kitchen Staff" });
  s = update(s, { type: "start", dish: 0, count: 2 });
  s = update(s, { type: "complete", dish: 0 });
  s = update(s, {
    type: "issue",
    issue: { id: "p", date, dish: 0, reason: "Service delay" },
  });
  s = update(s, { type: "role", role: "Vendor Manager" });
  const restored = JSON.parse(JSON.stringify(s));
  assert.equal(getPlan(restored, date).prepared[0], 2);
  assert.equal(restored.issues[0].reason, "Service delay");
  assert.deepEqual(update(s, { type: "reset" }), newState());
  assert.equal(validDate("2027-02-31"), false);
});
