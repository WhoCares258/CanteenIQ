import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  Boxes,
  CalendarDays,
  ChartColumnIncreasing,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  ClipboardList,
  CookingPot,
  FileBarChart2,
  FlaskConical,
  LayoutDashboard,
  Leaf,
  MapPin,
  Menu,
  PanelLeftClose,
  RotateCcw,
  SlidersHorizontal,
  Store as StoreIcon,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  fmt,
  getPlan,
  newState,
  offset,
  update,
  validDate,
  dishes,
  type Role,
  type State,
} from "./model";
import {
  Empty,
  Field,
  Modal,
  Pill,
  Store,
  type Controls,
  type Page,
} from "./ui";
import { Forecast, Inventory, Kitchen, Overview } from "./Operations";
import { Analytics, WasteLog } from "./Sustainability";
const KEY = "canteeniq.demo.v1";
const roles: Role[] = [
  "Vendor Manager",
  "Kitchen Staff",
  "Campus Administrator",
];
const nav: Record<Role, Page[]> = {
  "Vendor Manager": [
    "Overview",
    "Demand forecast",
    "Inventory",
    "Waste analytics",
  ],
  "Kitchen Staff": ["Kitchen board", "Waste log"],
  "Campus Administrator": ["Waste analytics", "Reports"],
};
const icons = {
  Overview: LayoutDashboard,
  "Demand forecast": TrendingUp,
  Inventory: Boxes,
  "Kitchen board": CookingPot,
  "Waste log": ClipboardList,
  "Waste analytics": ChartColumnIncreasing,
  Reports: FileBarChart2,
};
const people: Record<Role, string> = {
  "Vendor Manager": "Amir Hakim",
  "Kitchen Staff": "Aina Rahman",
  "Campus Administrator": "Mei Lin",
};
function loadDemo() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as State | null;
    if (
      s?.version === 1 &&
      validDate(s.date) &&
      roles.includes(s.role) &&
      s.stock?.length === 6 &&
      s.plans &&
      Array.isArray(s.waste) &&
      Array.isArray(s.orders) &&
      Array.isArray(s.issues)
    )
      return s;
  } catch {
    /* Start a fresh demo if browser storage is unavailable. */
  }
  return newState();
}
export default function App() {
  const [s, setState] = useState(loadDemo),
    current = useRef(s),
    [page, setPage] = useState<Page>(nav[s.role][0]),
    [dialog, setDialog] = useState(""),
    [sidebar, setSidebar] = useState(false),
    [date, setDate] = useState(s.date),
    [message, setMessage] = useState(""),
    [revision, setRevision] = useState(0),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notice = useCallback((msg: string) => {
    setMessage(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 5200);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const act: Controls["act"] = (action, msg) => {
    try {
      const result = update(current.current, action);
      localStorage.setItem(KEY, JSON.stringify(result));
      current.current = result;
      setState(result);
      if (msg) notice(msg);
      return true;
    } catch (e) {
      const m =
        e instanceof Error ? e.message : "This change could not be saved.";
      notice(m);
      window.dispatchEvent(new CustomEvent("demo-error", { detail: m }));
      return false;
    }
  };
  const go = (p: Page) => {
    setPage(p);
    setSidebar(false);
    setDialog("");
    window.scrollTo(0, 0);
  };
  function role(r: Role) {
    if (act({ type: "role", role: r }, "Switched to " + r + ".")) go(nav[r][0]);
  }
  function open(d: string) {
    setDialog(d);
    setSidebar(false);
    if (d === "date") setDate(s.date);
  }
  useEffect(() => {
    document.title = page + " · CanteenIQ";
  }, [page]);
  useEffect(() => {
    if (!sidebar) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebar(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [sidebar]);
  const tomorrow = getPlan(s, offset(s.date, 1)),
    notifications = s.issues.filter((i) => i.date <= s.date);
  return (
    <Store.Provider value={{ s, act, go, notice }}>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <div className="app-shell">
        {sidebar && (
          <button
            className="scrim"
            aria-label="Close navigation"
            onClick={() => setSidebar(false)}
          />
        )}
        <aside className={"sidebar " + (sidebar ? "open" : "")}>
          <div className="brand">
            <img src="./mark.svg" alt="" />
            <span>
              Canteen<span>IQ</span>
            </span>
            <button
              className="mobile-close icon-btn"
              aria-label="Close sidebar"
              onClick={() => setSidebar(false)}
            >
              <PanelLeftClose size={20} />
            </button>
          </div>
          <div className="workspace">
            <span className="workspace-icon">
              <StoreIcon size={20} />
            </span>
            <div>
              <strong>
                {s.role === "Campus Administrator"
                  ? "Campus operations"
                  : "Seri Rasa Café"}
              </strong>
              <small>Campus workspace</small>
            </div>
          </div>
          <nav aria-label="Main navigation">
            <div className="nav-label">WORKSPACE</div>
            {nav[s.role].map((p) => {
              const Icon = icons[p];
              return (
                <button
                  key={p}
                  aria-current={page === p ? "page" : undefined}
                  className={"nav-btn " + (p === page ? "active" : "")}
                  onClick={() => go(p)}
                >
                  <Icon size={19} />
                  {p}
                </button>
              );
            })}
            <div className="nav-label tools-label">DEMO TOOLS</div>
            <button className="nav-btn" onClick={() => open("settings")}>
              <SlidersHorizontal size={18} />
              Demo controls
            </button>
            <button className="nav-btn" onClick={() => open("help")}>
              <CircleHelp size={18} />
              Demo guide
            </button>
          </nav>
          <div className="sidebar-bottom">
            <div className="sustain">
              <span>
                <Leaf size={15} /> SDG 12.3
              </span>
              <p>
                Predict smarter. Prepare better.
                <br />
                Waste less.
              </p>
            </div>
            <button
              className="profile"
              onClick={() => open("roles")}
              aria-label={"Switch role, current role " + s.role}
            >
              <span className="avatar">
                {people[s.role]
                  .split(" ")
                  .map((v) => v[0])
                  .join("")}
              </span>
              <span>
                <strong>{people[s.role]}</strong>
                <small>{s.role}</small>
              </span>
              <ChevronsUpDown size={16} />
            </button>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="crumb">
              <button
                className="icon-btn mobile-menu"
                onClick={() => setSidebar(true)}
                aria-label="Open navigation"
              >
                <Menu size={21} />
              </button>
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>{page}</strong>
            </div>
            <div className="top-actions">
              <button className="demo-badge" onClick={() => open("settings")}>
                <FlaskConical size={14} /> Demo mode
              </button>
              <span className="divider" />
              <button className="date-btn" onClick={() => open("date")}>
                <CalendarDays size={16} />
                <span>
                  {fmt(s.date, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <ChevronDown size={14} />
              </button>
              <button
                aria-label="View activity"
                className="icon-btn bell"
                onClick={() => open("activity")}
              >
                <Bell size={19} />
                {notifications.length > 0 && <i />}
              </button>
            </div>
          </header>
          <main
            id="content"
            tabIndex={-1}
            key={[s.date, s.role, page, revision].join("-")}
          >
            {page === "Overview" ? (
              <Overview />
            ) : page === "Demand forecast" ? (
              <Forecast />
            ) : page === "Inventory" ? (
              <Inventory />
            ) : page === "Kitchen board" ? (
              <Kitchen />
            ) : page === "Waste log" ? (
              <WasteLog />
            ) : (
              <Analytics report={page === "Reports"} />
            )}
          </main>
          <footer>
            <span>
              <Leaf size={13} /> CanteenIQ
            </span>
            <span>Campus food operations</span>
          </footer>
        </div>
      </div>
      {message && (
        <div className="toast" role="status">
          {message}
          <button
            aria-label="Dismiss notification"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {dialog === "roles" && (
        <Modal title="Switch demo role" onClose={() => setDialog("")}>
          <p>
            Continue in another workspace with the same plans, inventory and
            waste records.
          </p>
          {roles.map((r, i) => {
            const Icon = [UserRound, CookingPot, UsersRound][i];
            return (
              <button className="role-option" key={r} onClick={() => role(r)}>
                <span className="metric-icon green">
                  <Icon size={20} />
                </span>
                <span>
                  <strong>{r}</strong>
                  <small>
                    {
                      [
                        "Demand, planning and inventory",
                        "Cooking progress and waste logging",
                        "Campus analytics and reports",
                      ][i]
                    }
                  </small>
                </span>
                {s.role === r ? (
                  <Check size={17} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            );
          })}
        </Modal>
      )}
      {dialog === "date" && (
        <Modal title="Change demo date" onClose={() => setDialog("")}>
          <p>Choose the day to use across all workspaces.</p>
          <div
            className="day-switch"
            role="group"
            aria-label="Service day shortcuts"
          >
            {[0, 1].map((n) => (
              <button
                key={n}
                aria-pressed={date === offset(s.date, n)}
                onClick={() => setDate(offset(s.date, n))}
              >
                <strong>{n ? "Tomorrow" : "Today"}</strong>
                <small>
                  {fmt(offset(s.date, n), {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </small>
              </button>
            ))}
          </div>
          <Field label="Service date">
            <input
              type="date"
              min="2026-11-16"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setDialog("")}>
              Cancel
            </button>
            <button
              disabled={!validDate(date)}
              onClick={() => {
                if (act({ type: "date", date }, "Demo date updated."))
                  setDialog("");
              }}
            >
              Apply date
            </button>
          </div>
        </Modal>
      )}
      {dialog === "settings" && (
        <Modal title="Demo controls" onClose={() => setDialog("")}>
          <p>Simulated operations are saved in this browser.</p>
          {[
            [CalendarDays, "Service date", fmt(s.date), "date"],
            [UsersRound, "Demo role", s.role, "roles"],
            [
              RotateCcw,
              "Reset demo data",
              "Restore the original campus scenario",
              "reset",
            ],
          ].map(([Ic, t, desc, d]) => {
            const Icon = Ic as typeof CalendarDays;
            return (
              <button
                key={String(d)}
                className="role-option"
                onClick={() => open(String(d))}
              >
                <Icon size={20} />
                <span>
                  <strong>{String(t)}</strong>
                  <small>{String(desc)}</small>
                </span>
                <ChevronRight size={16} />
              </button>
            );
          })}
        </Modal>
      )}
      {dialog === "reset" && (
        <Modal title="Reset demo data?" onClose={() => setDialog("")}>
          <p>
            This clears saved plans, deliveries, cooking progress, issues and
            waste entries in this browser. The demo will reopen on 16 November
            2026.
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setDialog("settings")}>
              Keep data
            </button>
            <button
              className="danger-btn"
              onClick={() => {
                if (act({ type: "reset" }, "Demo data restored.")) {
                  setRevision((v) => v + 1);
                  go("Overview");
                }
              }}
            >
              Reset demo
            </button>
          </div>
        </Modal>
      )}
      {dialog === "help" && (
        <Modal title="Demo guide" onClose={() => setDialog("")}>
          <div className="guide-note">
            <BookOpen size={19} /> Follow a service day across three roles.
          </div>
          <ol className="guide">
            <li>
              <strong>Plan tomorrow’s meals.</strong> Use Demand forecast as
              Vendor Manager, adjust portions and confirm the plan.
            </li>
            <li>
              <strong>Check ingredients.</strong> Resolve shortages in
              Inventory, then receive the simulated deliveries. Stock covers one
              plan at a time.
            </li>
            <li>
              <strong>Prepare the meals.</strong> Switch to Kitchen Staff using
              the profile button and advance the service date by one day. Start
              and complete a batch.
            </li>
            <li>
              <strong>Log food waste.</strong> Record unsold meals or spoiled
              ingredients. Review before submitting and undo an entry if needed.
            </li>
            <li>
              <strong>Review campus results.</strong> Switch to Campus
              Administrator, compare vendors, then preview and export a report.
            </li>
          </ol>
        </Modal>
      )}
      {dialog === "activity" && (
        <Modal title="Workspace activity" onClose={() => setDialog("")}>
          <div className="info-row">
            <span>Tomorrow’s meal plan</span>
            <Pill tone={tomorrow.confirmed ? "green" : "amber"}>
              {tomorrow.confirmed ? "Confirmed" : "Draft"}
            </Pill>
          </div>
          <div className="info-row">
            <span>Pending deliveries</span>
            <strong>{s.orders.filter((o) => !o.received).length}</strong>
          </div>
          <h3>Preparation issues</h3>
          {notifications.length ? (
            notifications.map((i) => (
              <div key={i.id} className="info-row">
                <span>
                  {dishes[i.dish].name}
                  <small>{fmt(i.date)}</small>
                </span>
                <strong>{i.reason}</strong>
              </div>
            ))
          ) : (
            <Empty>No preparation issues reported.</Empty>
          )}
          <div className="location">
            <MapPin size={15} />
            Seri Rasa Café
          </div>
        </Modal>
      )}
    </Store.Provider>
  );
}
