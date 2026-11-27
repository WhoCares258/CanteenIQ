import { useState } from "react";
import {
  Banknote,
  ChartNoAxesCombined,
  Check,
  CircleCheck,
  Download,
  FileBarChart,
  Leaf,
  Printer,
  Scale,
  Undo2,
  Utensils,
  Wheat,
} from "lucide-react";
import {
  aggregate,
  dishes,
  fmt,
  getPlan,
  ingredients,
  kg,
  metrics,
  money,
  offset,
  staff,
  sum,
  vendors,
  wasteValue,
  type Waste,
} from "./model";
import {
  DownloadCsv,
  Empty,
  Field,
  Modal,
  PageTitle,
  Pill,
  useApp,
} from "./ui";
import { Kpi } from "./Operations";
import { WasteChart } from "./Charts";
export function WasteLog() {
  const { s, act } = useApp(),
    [person, setPerson] = useState(staff[0]),
    [kind, setKind] = useState<Waste["kind"]>("Meal"),
    [item, setItem] = useState(0),
    [quantity, setQuantity] = useState("1"),
    [reason, setReason] = useState("Overproduction"),
    [draft, setDraft] = useState<Waste | null>(null),
    [last, setLast] = useState("");
  const meal = kind === "Meal",
    unit = meal ? "portions" : "kg",
    items = meal ? dishes : ingredients,
    entry = { kind, item, quantity: +quantity },
    value = wasteValue(entry),
    logs = s.waste.filter((w) => w.date === s.date);
  const available = meal
    ? getPlan(s, s.date).prepared[item] -
      sum(
        logs
          .filter((w) => w.kind === kind && w.item === item)
          .map((w) => w.quantity),
      )
    : s.stock[item];
  const valid =
    +quantity > 0 &&
    +quantity <= available &&
    (meal ? Number.isInteger(+quantity) : /^\d*(\.\d{1,3})?$/.test(quantity));
  function toggle(k: Waste["kind"]) {
    setKind(k);
    setItem(0);
    setQuantity("1");
    setReason(k === "Meal" ? "Overproduction" : "Spoilage");
  }
  return (
    <>
      <PageTitle
        title="Food waste log"
        sub="Record unsold portions and spoiled ingredients for today’s service."
      />
      <div className="waste-layout">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>New waste entry</h2>
              <p>
                {vendors[0]} · {fmt(s.date)}
              </p>
            </div>
            <Leaf size={22} />
          </div>
          <Field label="Staff profile">
            <select value={person} onChange={(e) => setPerson(e.target.value)}>
              {staff.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <div className="field">
            <span>Waste type</span>
            <div className="segmented">
              {(["Meal", "Ingredient"] as const).map((k) => (
                <button
                  key={k}
                  aria-pressed={kind === k}
                  className={k === kind ? "selected" : ""}
                  onClick={() => toggle(k)}
                >
                  {k === "Meal" ? <Utensils size={17} /> : <Wheat size={17} />}{" "}
                  {k === "Meal" ? "Unsold meals" : "Spoiled ingredients"}
                </button>
              ))}
            </div>
          </div>
          <Field label={meal ? "Dish" : "Ingredient"}>
            <select value={item} onChange={(e) => setItem(+e.target.value)}>
              {items.map((v, i) => (
                <option key={v.name} value={i}>
                  {v.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={"Quantity (" + unit + ")"}>
            <input
              type="number"
              step={meal ? "1" : ".001"}
              min={meal ? "1" : ".001"}
              max={available}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <small className={!valid ? "error-text" : "muted"}>
            {kg(available)} {unit}{" "}
            {meal
              ? "prepared and available to log"
              : "in stock, including any reserved stock"}
            .
          </small>
          <Field label="Reason">
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {(meal
                ? ["Overproduction", "Lower demand", "Quality concern"]
                : ["Spoilage", "Storage issue", "Damaged delivery"]
              ).map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <div className="estimate">
            <div>
              <small>Estimated waste</small>
              <strong>{valid ? kg(value.weight) : "—"} kg</strong>
            </div>
            <div>
              <small>Estimated cost</small>
              <strong>{valid ? money(value.cost) : "—"}</strong>
            </div>
          </div>
          <button
            className="full"
            disabled={!valid}
            onClick={() =>
              setDraft({
                id: crypto.randomUUID(),
                date: s.date,
                staff: person,
                kind,
                item,
                quantity: +quantity,
                reason,
              })
            }
          >
            Review entry
          </button>
        </section>
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Today’s entries</h2>
              <p>
                {logs.length} recorded ·{" "}
                {kg(sum(logs.map((w) => wasteValue(w).weight)))} kg total
              </p>
            </div>
          </div>
          {!logs.length ? (
            <Empty>No waste entries for this date.</Empty>
          ) : (
            logs.map((w) => (
              <div className="log-entry" key={w.id}>
                <div className="info-row">
                  <strong>
                    {(w.kind === "Meal" ? dishes : ingredients)[w.item].name}
                  </strong>
                  <Pill>
                    {kg(w.quantity)} {w.kind === "Meal" ? "portions" : "kg"}
                  </Pill>
                </div>
                <p>
                  {w.reason} · {w.staff}
                </p>
                <div className="info-row">
                  <small>{money(wasteValue(w).cost)}</small>
                  <button
                    className="text-btn"
                    onClick={() => {
                      act(
                        { type: "undo", id: w.id },
                        "Waste entry undone. Totals updated.",
                      );
                      if (last === w.id) setLast("");
                    }}
                  >
                    <Undo2 size={15} />
                    Undo entry
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
      {last && logs.some((w) => w.id === last) && (
        <div className="success">
          <CircleCheck size={19} />
          Waste recorded. Analytics updated.
        </div>
      )}
      {draft && (
        <Modal title="Review waste entry" onClose={() => setDraft(null)}>
          <p>
            {draft.staff} · {fmt(draft.date)}
          </p>
          {[
            ["Item", items[item].name],
            ["Quantity", quantity + " " + unit],
            ["Reason", reason],
            ["Estimated waste", kg(value.weight) + " kg"],
            ["Estimated cost", money(value.cost)],
          ].map(([k, v]) => (
            <div className="info-row" key={k}>
              <span>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
          <div className="modal-actions">
            <button className="secondary" onClick={() => setDraft(null)}>
              Edit entry
            </button>
            <button
              onClick={() => {
                if (
                  act({ type: "waste", entry: draft }, "Waste entry saved.")
                ) {
                  setLast(draft.id);
                  setDraft(null);
                  setQuantity("1");
                }
              }}
            >
              <Check size={16} />
              Submit entry
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Analytics({ report = false }: { report?: boolean }) {
  const { s } = useApp(),
    admin = s.role === "Campus Administrator";
  const [days, setDays] = useState(7),
    [vendor, setVendor] = useState(admin ? "All vendors" : vendors[0]),
    [selected, setSelected] = useState(""),
    [daily, setDaily] = useState(false),
    [show, setShow] = useState(false);
  const rows = metrics(s, days, vendor),
    a = aggregate(rows),
    list = vendors.filter((v) => vendor === "All vendors" || v === vendor),
    byVendor = list.map((v) => ({
      v,
      ...aggregate(rows.filter((r) => r.vendor === v)),
    })),
    range = fmt(offset(s.date, 1 - days)) + " – " + fmt(s.date),
    dates = [...new Set(rows.map((r) => r.date))],
    dailyRows = dates.map((date) => ({
      date,
      ...aggregate(rows.filter((r) => r.date === date)),
    }));
  function download() {
    const headings = [
      "Vendor",
      "From",
      "To",
      "Waste (kg)",
      "Estimated cost (RM)",
      "Waste rate (%)",
      "Forecast accuracy (%)",
    ];
    const csv: (string | number)[][] = [
      headings,
      ...byVendor.map((b) => [
        b.v,
        offset(s.date, 1 - days),
        s.date,
        b.weight.toFixed(3),
        b.cost.toFixed(2),
        b.rate.toFixed(2),
        b.accuracy?.toFixed(2) ?? "N/A",
      ]),
    ];
    if (daily)
      csv.push(
        [],
        ["Date", "Waste (kg)", "Estimated cost (RM)"],
        ...dailyRows.map((r) => [
          r.date,
          r.weight.toFixed(3),
          r.cost.toFixed(2),
        ]),
      );
    DownloadCsv("canteeniq-report-" + s.date + ".csv", csv);
  }
  function table(interactive: boolean) {
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {[
                "Vendor",
                "Food waste",
                "Est. cost",
                "Waste rate",
                "Target status",
              ].map((k) => (
                <th key={k}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byVendor.map((b) => (
              <tr key={b.v}>
                <td>
                  {interactive ? (
                    <button
                      className="text-btn"
                      onClick={() => setSelected(b.v)}
                    >
                      {b.v}
                    </button>
                  ) : (
                    b.v
                  )}
                </td>
                <td>{kg(b.weight)} kg</td>
                <td>{money(b.cost)}</td>
                <td>{b.rate.toFixed(1)}%</td>
                <td>
                  <Pill tone={b.rate > 6 ? "amber" : "green"}>
                    {b.rate > 6 ? "Above target" : "Within target"}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  const details = byVendor.find((b) => b.v === selected);
  return (
    <>
      <PageTitle
        title={report ? "Reports" : "Waste analytics"}
        sub={
          report
            ? "Configure, preview and export a campus waste report."
            : (admin ? "Campus-wide" : "Vendor") +
              " food waste and forecast performance."
        }
      />
      <section className="card filters">
        <Field label="Reporting period">
          <select
            value={days}
            onChange={(e) => {
              setDays(+e.target.value);
              setShow(false);
            }}
          >
            <option value={1}>Selected date</option>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </Field>
        <Field label="Vendor">
          <select
            value={vendor}
            onChange={(e) => {
              setVendor(e.target.value);
              setShow(false);
            }}
          >
            {(admin ? ["All vendors", ...vendors] : [vendors[0]]).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <small>{range}</small>
      </section>
      {report ? (
        <>
          <section className="card">
            <div className="card-head">
              <div>
                <h2>Report configuration</h2>
                <p>
                  Includes vendor totals, estimated costs, target status and
                  forecast accuracy.
                </p>
              </div>
              <FileBarChart size={22} />
            </div>
            <label className="check-field">
              <input
                type="checkbox"
                checked={daily}
                onChange={(e) => {
                  setDaily(e.target.checked);
                  setShow(false);
                }}
              />{" "}
              Include daily waste breakdown
            </label>
            <button onClick={() => setShow(true)}>Preview report</button>
          </section>
          {show && (
            <section className="card print-report">
              <div className="report-brand">
                <img src="/mark.svg" alt="" /> CanteenIQ
              </div>
              <h2>Food waste performance report</h2>
              <p>
                {vendor} · {range} · Simulated data
              </p>
              <div className="info-row">
                <strong>Total waste</strong>
                <span>
                  {kg(a.weight)} kg · {money(a.cost)}
                </span>
              </div>
              <div className="info-row">
                <strong>Waste rate / target</strong>
                <span>{a.rate.toFixed(1)}% / 6%</span>
              </div>
              <div className="info-row">
                <strong>Forecast accuracy</strong>
                <span>{a.accuracy?.toFixed(1) ?? "—"}%</span>
              </div>
              {table(false)}
              {daily && (
                <>
                  <h3>Daily waste breakdown</h3>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Waste</th>
                          <th>Estimated cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyRows.map((r) => (
                          <tr key={r.date}>
                            <td>{fmt(r.date)}</td>
                            <td>{kg(r.weight)} kg</td>
                            <td>{money(r.cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <div className="actions no-print">
                <button onClick={download}>
                  <Download size={16} />
                  Download CSV
                </button>
                <button className="secondary" onClick={() => window.print()}>
                  <Printer size={16} />
                  Print / Save PDF
                </button>
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <section className="card">
            <div className="card-head">
              <div>
                <h2>Vendor performance</h2>
                <p>
                  {byVendor
                    .filter((b) => b.rate > 6)
                    .map((b) => b.v)
                    .join(", ") || "No vendors"}{" "}
                  above the 6% waste target.
                </p>
              </div>
            </div>
            {table(true)}
          </section>
          <div className="kpi-grid">
            <Kpi
              label="Food waste"
              value={a.weight.toFixed(1)}
              unit="kg"
              note="Meals and ingredients"
              icon={Scale}
            />
            <Kpi
              label="Estimated cost"
              value={money(a.cost)}
              note="Value of recorded waste"
              icon={Banknote}
              tone="blue"
            />
            <Kpi
              label="Waste rate"
              value={a.rate.toFixed(1) + "%"}
              note="Illustrative target ≤ 6%"
              icon={Leaf}
              tone="sage"
            />
            <Kpi
              label="Forecast accuracy"
              value={a.accuracy === null ? "—" : a.accuracy.toFixed(1) + "%"}
              note="Based on closed service days"
              icon={ChartNoAxesCombined}
              tone="amber"
            />
          </div>

          <details className="card disclosure">
            <summary>View waste trend</summary>
            <WasteChart rows={rows} />
          </details>
        </>
      )}
      {details && (
        <Modal title={details.v} onClose={() => setSelected("")}>
          <p>Vendor performance · {range}</p>
          {[
            ["Food waste", kg(details.weight) + " kg"],
            ["Estimated cost", money(details.cost)],
            ["Waste rate", details.rate.toFixed(1) + "%"],
            [
              "Forecast accuracy",
              details.accuracy === null
                ? "No closed service days"
                : details.accuracy.toFixed(1) + "%",
            ],
            [
              "Target",
              details.rate > 6 ? "Exceeds 6% target" : "Within 6% target",
            ],
          ].map(([k, v]) => (
            <div key={k} className="info-row">
              <span>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </Modal>
      )}
    </>
  );
}
