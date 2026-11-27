import { useState } from "react";
import {
  Activity,
  Boxes,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  CloudSun,
  CookingPot,
  PackageCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Utensils,
  Users,
} from "lucide-react";
import { DishIcon, Empty, Field, Modal, PageTitle, Pill, useApp } from "./ui";
import { DemandChart } from "./Charts";
import {
  dishes,
  fmt,
  forecast,
  getPlan,
  ingredients,
  kg,
  offset,
  requirements,
  sum,
  vendors,
} from "./model";
export function Kpi({
  label,
  value,
  unit,
  note,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: string | number;
  unit?: string;
  note: string;
  icon: typeof TrendingUp;
  tone?: string;
}) {
  return (
    <div className="kpi">
      <div className="kpi-label">
        <span className={"metric-icon " + tone}>
          <Icon size={17} />
        </span>
        {label}
      </div>
      <div className="kpi-value">
        {value} <small>{unit}</small>
      </div>
      <p>{note}</p>
    </div>
  );
}
export function Overview() {
  const { s, go } = useApp();
  const [tomorrow, setTomorrow] = useState(true);
  const [factors, setFactors] = useState(false);
  const date = tomorrow ? offset(s.date, 1) : s.date;
  const plan = getPlan(s, date);
  const required = requirements(plan.quantities);
  const shortages = ingredients.filter((_, i) => required[i] > s.stock[i]);
  const issues = s.issues.filter((issue) => issue.date === s.date);
  return (
    <>
      <PageTitle
        title="Operations overview"
        sub="Choose a service day to check the prep list."
      />
      <div className="day-switch" role="group" aria-label="Preview service day">
        {[false, true].map((next) => (
          <button
            key={String(next)}
            aria-pressed={next === tomorrow}
            onClick={() => setTomorrow(next)}
          >
            <strong>{next ? "Tomorrow" : "Today"}</strong>
            <small>
              {fmt(next ? offset(s.date, 1) : s.date, {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </small>
          </button>
        ))}
      </div>
      <section className="briefing">
        <div>
          <span className="brief-label">
            {tomorrow ? "TOMORROW’S FORECAST" : "TODAY’S KITCHEN"}
          </span>
          <h2>
            {tomorrow ? sum(forecast(date)) : sum(plan.prepared)}{" "}
            {tomorrow ? "portions expected" : "portions ready"}
          </h2>
          <p>
            {tomorrow
              ? plan.confirmed
                ? "The kitchen has your confirmed prep list."
                : "Review the suggested portions and send your plan to the kitchen."
              : plan.confirmed
                ? sum(plan.quantities) + " portions planned for service."
                : "No confirmed plan for this service day."}
          </p>
          {tomorrow && (
            <button className="hero-btn" onClick={() => go("Demand forecast")}>
              <ClipboardList size={16} />
              Review meal plan
            </button>
          )}
        </div>
        <img alt="" src="./canteen.svg" />
      </section>
      {(tomorrow || plan.confirmed) && (
        <section className="card">
          <div className="card-head">
            <h2>{tomorrow ? "Forecast by dish" : "Today’s prep list"}</h2>
            {tomorrow ? (
              <button className="text-btn" onClick={() => setFactors(true)}>
                View influencing factors
              </button>
            ) : (
              <Pill>Confirmed</Pill>
            )}
          </div>
          {dishes.map((dish, i) => (
            <div className="info-row" key={dish.name}>
              <span className="name-cell">
                <DishIcon i={i} />
                {dish.name}
              </span>
              <strong>
                {tomorrow
                  ? forecast(date)[i] + " portions"
                  : plan.prepared[i] + " / " + plan.quantities[i] + " ready"}
              </strong>
            </div>
          ))}
        </section>
      )}
      {tomorrow && shortages.length > 0 && (
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Stock needed for tomorrow</h2>
              <p>{shortages.map((i) => i.name).join(", ")}</p>
            </div>
            <button className="secondary" onClick={() => go("Inventory")}>
              Check inventory
            </button>
          </div>
        </section>
      )}
      {factors && (
        <Modal
          title="Tomorrow’s influencing factors"
          onClose={() => setFactors(false)}
        >
          <p>Simulated outlook for {fmt(date)}.</p>
          {[
            [
              "Day type",
              [0, 6].includes(new Date(date + "T12:00Z").getUTCDay())
                ? "Weekend"
                : "Weekday",
            ],
            [
              "Expected demand",
              (sum(forecast(date)) - sum(forecast(s.date))).toLocaleString(
                "en",
                { signDisplay: "always" },
              ) + " portions vs today",
            ],
            ["Weather outlook", "Warm conditions"],
            ["Campus activity", "Regular student lunch service"],
          ].map(([label, value]) => (
            <div className="info-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </Modal>
      )}
      {issues.length > 0 && (
        <section className="card">
          <h2>Today’s kitchen issues</h2>
          {issues.map((i) => (
            <div className="issue" key={i.id}>
              <TriangleAlert size={16} />
              {dishes[i.dish].name} · {i.reason}
            </div>
          ))}
        </section>
      )}
    </>
  );
}
export function Forecast() {
  const { s, act, go } = useApp(),
    next = offset(s.date, 1),
    p = getPlan(s, next),
    rec = forecast(next);
  const [inputs, setInputs] = useState(p.quantities.map(String)),
    [review, setReview] = useState(false);
  const nums = inputs.map(Number),
    valid =
      inputs.every(
        (v, i) =>
          v.trim() !== "" &&
          Number.isInteger(nums[i]) &&
          nums[i] >= 0 &&
          nums[i] <= 2000,
      ) && sum(nums) > 0,
    need = requirements(nums);
  const save = (confirm: boolean) => {
    if (
      act(
        { type: "savePlan", date: next, quantities: nums, confirm },
        confirm
          ? "Plan confirmed and scheduled for the kitchen."
          : "Meal plan draft saved.",
      )
    )
      setReview(false);
  };
  return (
    <>
      <PageTitle
        title="Tomorrow’s meal plan"
        sub={
          "Forecast and meal planning for " +
          fmt(next, { weekday: "long", day: "numeric", month: "long" }) +
          "."
        }
      />
      <section className="briefing slim">
        <div>
          <span className="brief-label">
            <Sparkles size={15} /> SIMULATED FORECAST
          </span>
          <h2>
            {sum(rec)} <small>predicted portions</small>
          </h2>
          <p>Plan service for {vendors[0]} using the suggested quantities.</p>
        </div>
        <img alt="" src="./canteen.svg" />
      </section>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Preparation plan</h2>
            <p>Adjust portions before confirming for the kitchen.</p>
          </div>
          <Pill tone={p.confirmed ? "green" : "amber"}>
            {p.confirmed ? "Confirmed" : "Draft"}
          </Pill>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Dish</th>
                <th>Recommended</th>
                <th>Planned portions</th>
              </tr>
            </thead>
            <tbody>
              {dishes.map((d, i) => (
                <tr key={d.name}>
                  <td>
                    <div className="name-cell">
                      <DishIcon i={i} />
                      {d.name}
                    </div>
                  </td>
                  <td>{rec[i]} portions</td>
                  <td>
                    <div className="quantity-stepper">
                      <button
                        aria-label={"Decrease " + d.name}
                        disabled={p.confirmed || nums[i] <= 0}
                        onClick={() =>
                          setInputs(
                            inputs.map((x, j) =>
                              i === j
                                ? String(Math.max(0, Math.floor(Number(x)) - 1))
                                : x,
                            ),
                          )
                        }
                      >
                        −
                      </button>
                      <input
                        className="number"
                        type="number"
                        min="0"
                        max="2000"
                        aria-label={d.name + " planned portions"}
                        disabled={p.confirmed}
                        value={inputs[i]}
                        onChange={(e) =>
                          setInputs(
                            inputs.map((x, j) =>
                              j === i ? e.target.value : x,
                            ),
                          )
                        }
                      />
                      <button
                        aria-label={"Increase " + d.name}
                        disabled={p.confirmed || nums[i] >= 2000}
                        onClick={() =>
                          setInputs(
                            inputs.map((x, j) =>
                              i === j
                                ? String(
                                    Math.min(2000, Math.floor(Number(x)) + 1),
                                  )
                                : x,
                            ),
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="action-bar">
          <strong>Total · {valid ? sum(nums) : "—"} portions</strong>
          {!p.confirmed && (
            <div className="actions">
              <button
                disabled={!valid}
                className="secondary"
                onClick={() => save(false)}
              >
                Save draft
              </button>
              <button disabled={!valid} onClick={() => setReview(true)}>
                Review plan
              </button>
            </div>
          )}
        </div>
        {!valid && (
          <p className="error-text">
            Enter 0–2,000 whole portions per dish and plan at least one portion.
          </p>
        )}
      </section>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Ingredient requirements</h2>
            <p>Calculated from planned portions and standard recipes.</p>
          </div>
        </div>
        <div className="ingredient-grid">
          {ingredients.map((d, i) => (
            <div key={d.name}>
              <span>{d.name}</span>
              <strong>{valid ? kg(need[i]) : "—"} kg</strong>
            </div>
          ))}
        </div>
        {p.confirmed && (
          <button className="card-link" onClick={() => go("Inventory")}>
            Check inventory <ChevronRight size={16} />
          </button>
        )}
      </section>
      <details className="card disclosure">
        <summary>Demand history and forecast factors</summary>{" "}
        <div className="equal-grid">
          <DemandChart date={s.date} />
          <section className="card">
            <div className="card-head">
              <div>
                <h2>Forecast factors</h2>
                <p>Illustrative inputs for the demand scenario</p>
              </div>
            </div>
            {[
              [
                CloudSun,
                "Weather outlook",
                "Warm conditions favour on-campus lunch service.",
              ],
              [
                CalendarDays,
                "Academic schedule",
                new Date(next + "T12:00Z").getUTCDay() % 6 === 0
                  ? "Weekend service has lower expected footfall."
                  : "Weekday classes support a steady lunch rush.",
              ],
              [
                Users,
                "Campus activity",
                "Student events contribute to lunchtime demand.",
              ],
            ].map(([Ic, t, desc]) => {
              const Icon = Ic as typeof CloudSun;
              return (
                <div key={String(t)} className="factor">
                  <span className="metric-icon green">
                    <Icon size={18} />
                  </span>
                  <div>
                    <strong>{String(t)}</strong>
                    <p>{String(desc)}</p>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </details>
      {review && (
        <Modal title="Review preparation plan" onClose={() => setReview(false)}>
          <p>
            Confirm {sum(nums)} portions for {fmt(next)}. Kitchen staff will see
            this plan on its scheduled date.
          </p>
          {dishes.map((d, i) => (
            <div className="info-row" key={d.name}>
              <span>{d.name}</span>
              <strong>{nums[i]} portions</strong>
            </div>
          ))}
          <div className="modal-actions">
            <button className="secondary" onClick={() => setReview(false)}>
              Edit quantities
            </button>
            <button onClick={() => save(true)}>
              <Check size={16} />
              Confirm plan and send to kitchen
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Inventory() {
  const { s, act } = useApp(),
    next = offset(s.date, 1),
    need = requirements(getPlan(s, next).quantities);
  const [requestId, setRequestId] = useState("");
  const [item, setItem] = useState<number | null>(null),
    [amount, setAmount] = useState(""),
    [source, setSource] = useState("Supplier · Pasar Segar"),
    [review, setReview] = useState(false),
    [filter, setFilter] = useState("All ingredients");
  const pending = (i: number) =>
    sum(
      s.orders
        .filter((o) => !o.received && o.ingredient === i)
        .map((o) => o.kg),
    );
  function open(i: number) {
    setRequestId(crypto.randomUUID());
    setItem(i);
    setAmount(
      String(
        Math.max(
          0.001,
          Math.ceil((need[i] - s.stock[i] - pending(i)) * 1000) / 1000,
          need[i] <= s.stock[i] + pending(i) ? 1 : 0,
        ),
      ),
    );
    setReview(false);
  }
  const valid =
    Number(amount) > 0 &&
    Number(amount) <= 1000 &&
    /^\d*(\.\d{1,3})?$/.test(amount);
  return (
    <>
      <PageTitle
        title="Inventory"
        sub={"Compare current stock with the meal plan for " + fmt(next) + "."}
      />
      <div className="kpi-grid three">
        <Kpi
          label="Tracked ingredients"
          value={ingredients.length}
          note="Current stock on hand"
          icon={Boxes}
        />
        <Kpi
          label="Stock shortages"
          value={need.filter((n, i) => n > s.stock[i]).length}
          note="Against tomorrow’s plan"
          icon={TriangleAlert}
          tone="amber"
        />
        <Kpi
          label="Pending requests"
          value={s.orders.filter((o) => !o.received).length}
          note="Awaiting receipt"
          icon={PackageCheck}
          tone="blue"
        />
      </div>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Stock availability</h2>
            <p>
              Quantities in kilograms. Pending deliveries are shown separately.
            </p>
          </div>
          <select
            aria-label="Stock filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All ingredients</option>
            <option>Shortages only</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Ingredient",
                  "Required",
                  "In stock",
                  "Pending",
                  "Status",
                  "Action",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ingredients.map(
                (d, i) =>
                  (filter === "All ingredients" || s.stock[i] < need[i]) && (
                    <tr key={d.name}>
                      <td>
                        <strong>{d.name}</strong>
                      </td>
                      <td>{kg(need[i])}</td>
                      <td>{kg(s.stock[i])}</td>
                      <td>{kg(pending(i))}</td>
                      <td>
                        <Pill tone={s.stock[i] < need[i] ? "amber" : "green"}>
                          {s.stock[i] < need[i]
                            ? kg(need[i] - s.stock[i]) + " kg short"
                            : "Available"}
                        </Pill>
                      </td>
                      <td>
                        <button
                          className="secondary small"
                          aria-label={"Replenish " + d.name}
                          onClick={() => open(i)}
                        >
                          Replenish
                        </button>
                      </td>
                    </tr>
                  ),
              )}
            </tbody>
          </table>
        </div>
        {filter !== "All ingredients" &&
          need.every((n, i) => s.stock[i] >= n) && (
            <Empty>All ingredients are available.</Empty>
          )}
      </section>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Replenishment requests</h2>
            <p>Receive a delivery to add it to available stock.</p>
          </div>
        </div>
        {!s.orders.length ? (
          <Empty>No requests yet. Select an ingredient to replenish it.</Empty>
        ) : (
          s.orders.map((o) => (
            <div className="queue-row" key={o.id}>
              <div>
                <strong>
                  {ingredients[o.ingredient].name} · {kg(o.kg)} kg
                </strong>
                <p>
                  {o.source} · {fmt(o.date)}
                </p>
              </div>
              {o.received ? (
                <Pill>Received</Pill>
              ) : (
                <div className="actions">
                  <Pill tone="amber">Pending</Pill>
                  <button
                    className="small"
                    disabled={o.date > s.date}
                    onClick={() =>
                      act(
                        { type: "receive", id: o.id },
                        "Delivery received. Stock updated.",
                      )
                    }
                  >
                    Receive stock
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </section>
      {item !== null && (
        <Modal
          title={
            review
              ? "Confirm replenishment"
              : "Replenish " + ingredients[item].name
          }
          onClose={() => setItem(null)}
        >
          {review ? (
            <>
              <p>
                Request{" "}
                <strong>
                  {kg(+amount)} kg of {ingredients[item].name.toLowerCase()}
                </strong>{" "}
                from {source}. This simulated request stays pending until
                received.
              </p>
              <div className="modal-actions">
                <button className="secondary" onClick={() => setReview(false)}>
                  Edit request
                </button>
                <button
                  onClick={() => {
                    if (
                      act(
                        {
                          type: "order",
                          id: requestId,
                          ingredient: item,
                          kg: +amount,
                          source,
                        },
                        "Replenishment request recorded.",
                      )
                    )
                      setItem(null);
                  }}
                >
                  Confirm request
                </button>
              </div>
            </>
          ) : (
            <>
              <Field label="Source">
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option>Supplier · Pasar Segar</option>
                  <option>Vendor transfer · Kolej Kitchen</option>
                  <option>Vendor transfer · Warisan Corner</option>
                </select>
              </Field>
              <Field label="Quantity (kg)">
                <input
                  type="number"
                  min=".001"
                  max="1000"
                  step=".001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <div className="modal-actions">
                <button disabled={!valid} onClick={() => setReview(true)}>
                  Review request
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
export function Kitchen() {
  const { s, act } = useApp(),
    p = getPlan(s, s.date),
    [batch, setBatch] = useState<number | null>(null),
    [q, setQ] = useState(""),
    [issue, setIssue] = useState<number | null>(null),
    [reason, setReason] = useState("Ingredient shortage"),
    [issueId, setIssueId] = useState("");
  const total = sum(p.quantities),
    done = sum(p.prepared);
  return (
    <>
      <PageTitle
        title="Kitchen board"
        sub={
          "Preparation and cooking progress for " +
          fmt(s.date, { weekday: "long", day: "numeric", month: "long" }) +
          "."
        }
      />
      {!p.confirmed ? (
        <section className="card">
          <CookingPot size={30} />
          <h2>No confirmed plan for this date</h2>
          <p>
            A vendor manager can confirm this plan from the previous demo date.
          </p>
        </section>
      ) : (
        <>
          <div className="kpi-grid three">
            <Kpi
              label="Planned portions"
              value={total}
              note="Confirmed for service"
              icon={Utensils}
            />
            <Kpi
              label="Prepared"
              value={done}
              note="Completed portions"
              icon={CircleCheck}
            />
            <Kpi
              label="Remaining"
              value={total - done}
              note={sum(p.active) + " portions cooking"}
              icon={Activity}
              tone="amber"
            />
          </div>
          {done === total && (
            <div className="success">
              <CircleCheck />
              Preparation complete · All {total} planned portions are ready.
            </div>
          )}
          <div className="equal-grid kitchen-grid">
            {dishes.map((d, i) => (
              <section className="card" key={d.name}>
                <div className="card-head">
                  <div className="name-cell">
                    <DishIcon i={i} />
                    <h2>{d.name}</h2>
                  </div>
                  <Pill tone={p.active[i] ? "amber" : "green"}>
                    {p.active[i]
                      ? "Cooking"
                      : p.prepared[i] === p.quantities[i]
                        ? "Complete"
                        : "Ready"}
                  </Pill>
                </div>
                <div className="progress-num">
                  <strong>{p.prepared[i]}</strong> / {p.quantities[i]} portions
                  prepared
                </div>
                <div className="track large">
                  <i
                    style={{
                      width:
                        (100 * p.prepared[i]) / (p.quantities[i] || 1) + "%",
                    }}
                  />
                </div>
                <p>
                  {p.quantities[i] - p.prepared[i]} remaining · {p.active[i]}{" "}
                  cooking
                </p>
                <div className="actions">
                  <button
                    disabled={p.prepared[i] === p.quantities[i]}
                    onClick={() => {
                      if (p.active[i])
                        act(
                          { type: "complete", dish: i },
                          d.name + " batch completed. Inventory updated.",
                        );
                      else {
                        setBatch(i);
                        setQ(
                          String(Math.min(25, p.quantities[i] - p.prepared[i])),
                        );
                      }
                    }}
                  >
                    <CookingPot size={17} />
                    {p.active[i] ? "Complete batch" : "Start batch"}
                  </button>
                  <button
                    className="secondary"
                    onClick={() => {
                      setIssueId(crypto.randomUUID());
                      setIssue(i);
                      setReason("Ingredient shortage");
                    }}
                  >
                    Report issue
                  </button>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
      {batch !== null && (
        <Modal
          title={"Start " + dishes[batch].name + " batch"}
          onClose={() => setBatch(null)}
        >
          <Field label="Batch size (portions)">
            <input
              type="number"
              min="1"
              max={p.quantities[batch] - p.prepared[batch]}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </Field>
          <p>
            Ingredients are reserved while cooking and deducted when the batch
            is complete.
          </p>
          <div className="modal-actions">
            <button
              disabled={
                !Number.isInteger(+q) ||
                +q < 1 ||
                +q > p.quantities[batch] - p.prepared[batch]
              }
              onClick={() => {
                if (
                  act(
                    { type: "start", dish: batch, count: +q },
                    "Batch started.",
                  )
                )
                  setBatch(null);
              }}
            >
              Start cooking
            </button>
          </div>
        </Modal>
      )}
      {issue !== null && (
        <Modal title="Report preparation issue" onClose={() => setIssue(null)}>
          <p>{dishes[issue].name} · Visible to the vendor manager.</p>
          <Field label="Issue">
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {[
                "Ingredient shortage",
                "Equipment problem",
                "Service delay",
                "Quality concern",
              ].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <div className="modal-actions">
            <button
              onClick={() => {
                if (
                  act(
                    {
                      type: "issue",
                      issue: { id: issueId, date: s.date, dish: issue, reason },
                    },
                    "Issue shared with the vendor manager.",
                  )
                )
                  setIssue(null);
              }}
            >
              Send issue
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
