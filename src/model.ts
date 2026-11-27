export const HOME = "2026-11-16";
export const vendors = [
  "Seri Rasa Café",
  "Kolej Kitchen",
  "Warisan Corner",
] as const;
export const staff = ["Aina Rahman", "Daniel Tan", "Kavitha Ravi"];
export const ingredients = [
  { name: "Rice", price: 3.6 },
  { name: "Chicken", price: 11.4 },
  { name: "Eggs", price: 8.2 },
  { name: "Fresh noodles", price: 5.2 },
  { name: "Vegetables", price: 6.5 },
  { name: "Coconut milk", price: 9.2 },
];
export const dishes = [
  {
    name: "Chicken Rice",
    short: "CR",
    color: "#37845d",
    tint: "#e5efe4",
    cost: 4.2,
    weight: 0.38,
    recipe: [0.09, 0.14, 0, 0, 0.04, 0],
  },
  {
    name: "Nasi Lemak",
    short: "NL",
    color: "#c7a441",
    tint: "#f6eed9",
    cost: 3.5,
    weight: 0.31,
    recipe: [0.085, 0, 0.05, 0, 0.025, 0.025],
  },
  {
    name: "Fried Noodles",
    short: "FN",
    color: "#bd7951",
    tint: "#f7e7db",
    cost: 3.2,
    weight: 0.32,
    recipe: [0, 0, 0.025, 0.16, 0.045, 0],
  },
  {
    name: "Vegetable Rice",
    short: "VR",
    color: "#7f9b72",
    tint: "#e9efde",
    cost: 2.8,
    weight: 0.3,
    recipe: [0.09, 0, 0, 0, 0.12, 0],
  },
];
export type Role = "Vendor Manager" | "Kitchen Staff" | "Campus Administrator";
export type Plan = {
  quantities: number[];
  confirmed: boolean;
  prepared: number[];
  active: number[];
};
export type Order = {
  id: string;
  ingredient: number;
  kg: number;
  source: string;
  date: string;
  received: boolean;
};
export type Issue = { id: string; date: string; dish: number; reason: string };
export type Waste = {
  id: string;
  date: string;
  staff: string;
  kind: "Meal" | "Ingredient";
  item: number;
  quantity: number;
  reason: string;
};
export type State = {
  version: 1;
  date: string;
  role: Role;
  plans: Record<string, Plan>;
  stock: number[];
  orders: Order[];
  issues: Issue[];
  waste: Waste[];
};
export const sum = (items: number[]) => items.reduce((a, b) => a + b, 0);
export const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 1000) / 1000;
export const kg = (value: number) =>
  value.toLocaleString("en-MY", { maximumFractionDigits: 3 });
export const money = (value: number) => "RM " + value.toFixed(2);
export const zeros = () => dishes.map(() => 0);
export function offset(date: string, days: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function fmt(
  date: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
) {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", {
    ...options,
    timeZone: "UTC",
  });
}
export function forecast(date: string) {
  const day = new Date(date + "T12:00:00Z").getUTCDay();
  const delta = [-28, 0, 8, 4, 12, -6, -34][day];
  return [162, 135, 103, 80].map((n, i) =>
    Math.round(n + delta * (1 - i * 0.13)),
  );
}
export function getPlan(state: State, date: string): Plan {
  return (
    state.plans[date] ?? {
      quantities: forecast(date),
      confirmed: false,
      prepared: zeros(),
      active: zeros(),
    }
  );
}
export function requirements(quantities: number[]) {
  return ingredients.map((_, i) =>
    round(sum(quantities.map((n, j) => n * dishes[j].recipe[i]))),
  );
}
export function newState(): State {
  const today: Plan = {
    quantities: forecast(HOME),
    confirmed: true,
    prepared: [80, 65, 40, 30],
    active: zeros(),
  };
  return {
    version: 1,
    date: HOME,
    role: "Vendor Manager",
    plans: { [HOME]: today },
    stock: [45, 16, 13, 23, 19, 6],
    orders: [],
    issues: [],
    waste: [],
  };
}
export type Action =
  | { type: "date"; date: string }
  | { type: "role"; role: Role }
  | { type: "reset" }
  | { type: "savePlan"; date: string; quantities: number[]; confirm: boolean }
  | {
      type: "order";
      id: string;
      ingredient: number;
      kg: number;
      source: string;
    }
  | { type: "receive"; id: string }
  | { type: "start"; dish: number; count: number }
  | { type: "complete"; dish: number }
  | { type: "issue"; issue: Issue }
  | { type: "waste"; entry: Waste }
  | { type: "undo"; id: string };
export function validDate(date: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    date >= HOME &&
    Number.isFinite(Date.parse(date + "T12:00:00Z")) &&
    offset(date, 0) === date
  );
}
function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
const integer = (n: number, max: number) =>
  Number.isInteger(n) && n >= 0 && n <= max;
export function update(state: State, action: Action): State {
  const p = getPlan(state, state.date);
  const save = (plan: Plan) => ({
    ...state,
    plans: { ...state.plans, [state.date]: plan },
  });
  switch (action.type) {
    case "reset":
      return newState();
    case "date":
      check(
        validDate(action.date),
        "Choose a valid service date from 16 November 2026 onward.",
      );
      return { ...state, date: action.date };
    case "role":
      return { ...state, role: action.role };
    case "savePlan": {
      const old = getPlan(state, action.date);
      check(
        action.date === offset(state.date, 1) && !old.confirmed,
        "This plan is already confirmed or outside the planning date.",
      );
      check(
        action.quantities.length === 4 &&
          action.quantities.every((n) => integer(n, 2000)) &&
          sum(action.quantities) > 0,
        "Enter 0–2,000 whole portions per dish, with at least one portion in total.",
      );
      return {
        ...state,
        plans: {
          ...state.plans,
          [action.date]: {
            ...old,
            quantities: [...action.quantities],
            confirmed: action.confirm,
          },
        },
      };
    }
    case "order": {
      check(
        !state.orders.some((o) => o.id === action.id),
        "This request has already been recorded.",
      );
      check(
        Number.isInteger(action.ingredient) &&
          !!ingredients[action.ingredient] &&
          Number.isFinite(action.kg) &&
          action.kg >= 0.001 &&
          action.kg <= 1000 &&
          round(action.kg) === action.kg,
        "Enter 0.001–1,000 kg, with up to three decimal places.",
      );
      return {
        ...state,
        orders: [
          {
            id: action.id,
            ingredient: action.ingredient,
            kg: action.kg,
            source: action.source,
            date: state.date,
            received: false,
          },
          ...state.orders,
        ],
      };
    }
    case "receive": {
      const order = state.orders.find((o) => o.id === action.id);
      check(
        order && !order.received && order.date <= state.date,
        "This request cannot be received on the selected date.",
      );
      return {
        ...state,
        stock: state.stock.map((n, i) =>
          round(n + (i === order.ingredient ? order.kg : 0)),
        ),
        orders: state.orders.map((o) =>
          o.id === order.id ? { ...o, received: true } : o,
        ),
      };
    }
    case "start": {
      const i = action.dish;
      check(
        p.confirmed &&
          dishes[i] &&
          !p.active[i] &&
          integer(action.count, p.quantities[i] - p.prepared[i]) &&
          action.count > 0,
        "Choose a valid batch size within the remaining portions.",
      );
      const reserved = ingredients.map((_, j) =>
        sum(
          Object.values(state.plans).map(
            (plan) => requirements(plan.active)[j],
          ),
        ),
      );
      check(
        dishes[i].recipe.every(
          (r, j) => round(r * action.count + reserved[j]) <= state.stock[j],
        ),
        "Insufficient available ingredients. Receive stock or start a smaller batch.",
      );
      return save({
        ...p,
        active: p.active.map((n, j) => (j === i ? action.count : n)),
      });
    }
    case "complete": {
      const i = action.dish;
      check(
        p.confirmed && p.active[i] > 0,
        "Start a batch before completing it.",
      );
      return {
        ...save({
          ...p,
          prepared: p.prepared.map((n, j) => (j === i ? n + p.active[i] : n)),
          active: p.active.map((n, j) => (j === i ? 0 : n)),
        }),
        stock: state.stock.map((n, j) =>
          round(n - p.active[i] * dishes[i].recipe[j]),
        ),
      };
    }
    case "issue":
      check(
        !state.issues.some((x) => x.id === action.issue.id),
        "This issue was already reported.",
      );
      return { ...state, issues: [action.issue, ...state.issues] };
    case "waste": {
      const e = action.entry;
      check(
        !state.waste.some((x) => x.id === e.id),
        "This entry is already saved.",
      );
      check(
        e.date === state.date &&
          staff.includes(e.staff) &&
          e.reason &&
          Number.isFinite(e.quantity) &&
          e.quantity > 0,
        "Check the date, staff member, reason and quantity.",
      );
      check(
        e.kind === "Meal"
          ? !!dishes[e.item] && integer(e.quantity, 2000)
          : !!ingredients[e.item] &&
              e.quantity <= 1000 &&
              round(e.quantity) === e.quantity,
        "Use whole portions or up to three decimal places for kilograms.",
      );
      if (e.kind === "Meal") {
        const logged = sum(
          state.waste
            .filter(
              (w) =>
                w.date === e.date && w.kind === "Meal" && w.item === e.item,
            )
            .map((w) => w.quantity),
        );
        check(
          e.quantity + logged <= p.prepared[e.item],
          "Unsold portions cannot exceed the prepared portions available to log.",
        );
      } else {
        const reserved = sum(
          Object.values(state.plans).map(
            (plan) => requirements(plan.active)[e.item],
          ),
        );
        check(
          round(e.quantity + reserved) <= state.stock[e.item],
          "Spoilage cannot exceed unreserved stock.",
        );
      }
      return {
        ...state,
        stock: state.stock.map((n, i) =>
          round(n - (e.kind === "Ingredient" && e.item === i ? e.quantity : 0)),
        ),
        waste: [e, ...state.waste],
      };
    }
    case "undo": {
      const e = state.waste.find((w) => w.id === action.id);
      check(e, "This entry has already been removed.");
      return {
        ...state,
        stock: state.stock.map((n, i) =>
          round(n + (e.kind === "Ingredient" && e.item === i ? e.quantity : 0)),
        ),
        waste: state.waste.filter((w) => w.id !== e.id),
      };
    }
  }
}
export function wasteValue(e: Pick<Waste, "kind" | "item" | "quantity">) {
  return e.kind === "Meal"
    ? {
        weight: e.quantity * dishes[e.item].weight,
        cost: e.quantity * dishes[e.item].cost,
      }
    : { weight: e.quantity, cost: e.quantity * ingredients[e.item].price };
}
export type Metric = {
  date: string;
  vendor: string;
  weight: number;
  cost: number;
  mass: number;
  actual: number;
  prediction: number;
  error: number;
};
export function history(date: string, v: number): Metric {
  const day = Math.round(Date.parse(date) / 86400000);
  const shift = Math.sin(day * 0.91 + v * 2);
  const prediction = sum(forecast(date)) - v * 43 + Math.round(shift * 13);
  const actual = prediction + Math.round(Math.cos(day * 0.82 + v) * 32);
  const mass = actual * 0.34;
  const weight = round(mass * ([0.044, 0.069, 0.051][v] + shift * 0.006));
  return {
    date,
    vendor: vendors[v],
    weight,
    cost: weight * (10.3 + v * 0.4),
    mass,
    actual,
    prediction,
    error: Math.abs(prediction - actual),
  };
}
export function metrics(s: State, days: number, vendor: string) {
  const rows: Metric[] = [];
  for (let n = 1 - days; n <= 0; n++) {
    const date = offset(s.date, n);
    vendors.forEach((v, i) => {
      if (vendor !== "All vendors" && v !== vendor) return;
      if (i === 0 && date >= HOME) {
        const plan = getPlan(s, date);
        const entries = s.waste.filter((e) => e.date === date).map(wasteValue);
        const spoiled = sum(
          s.waste
            .filter((e) => e.date === date && e.kind === "Ingredient")
            .map((e) => e.quantity),
        );
        rows.push({
          date,
          vendor: v,
          weight: sum(entries.map((e) => e.weight)),
          cost: sum(entries.map((e) => e.cost)),
          mass:
            sum(plan.prepared.map((q, j) => q * dishes[j].weight)) + spoiled,
          actual: 0,
          prediction: 0,
          error: 0,
        });
      } else rows.push(history(date, i));
    });
  }
  return rows;
}
export function aggregate(rows: Metric[]) {
  const total = (
    key: "weight" | "cost" | "mass" | "actual" | "prediction" | "error",
  ) => sum(rows.map((r) => r[key]));
  const mass = total("mass"),
    actual = total("actual"),
    weight = total("weight");
  return {
    weight,
    cost: total("cost"),
    rate: mass ? (100 * weight) / mass : 0,
    accuracy: actual ? 100 * (1 - total("error") / actual) : null,
  };
}
export function demandSeries(date: string, days: number) {
  return Array.from({ length: days }, (_, i) => {
    const d = offset(date, i - days);
    const h = history(d, 0);
    return {
      day: fmt(d, { day: "numeric", month: "short" }),
      actual: h.actual,
      forecast: h.prediction,
    };
  });
}
