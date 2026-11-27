import {
  cloneElement,
  type ReactElement,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X, Utensils, Sprout, Soup, CookingPot } from "lucide-react";
import { type Action, type State, dishes } from "./model";
export type Page =
  | "Overview"
  | "Demand forecast"
  | "Inventory"
  | "Kitchen board"
  | "Waste log"
  | "Waste analytics"
  | "Reports";
export type Controls = {
  s: State;
  act: (a: Action, message?: string) => boolean;
  go: (p: Page) => void;
  notice: (message: string) => void;
};
export const Store = createContext<Controls | null>(null);
export function useApp() {
  const ctx = useContext(Store);
  if (!ctx) throw Error("Missing app context");
  return ctx;
}
export function Pill({
  children,
  tone = "green",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={"pill " + tone}>{children}</span>;
}
export function PageTitle({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {children}
    </header>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId(),
    [error, setError] = useState("");
  useEffect(() => {
    const report = (e: Event) => setError((e as CustomEvent<string>).detail);
    window.addEventListener("demo-error", report);
    return () => window.removeEventListener("demo-error", report);
  }, []);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current!.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="dialog-head">
        <h2 id={id}>{title}</h2>
        <button
          className="icon-btn"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </dialog>
  );
}
export function DishIcon({ i }: { i: number }) {
  const Icon = [Utensils, CookingPot, Soup, Sprout][i];
  return (
    <span
      className="dish-icon"
      style={{ background: dishes[i].tint, color: dishes[i].color }}
    >
      <Icon size={21} />
    </span>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children as ReactElement<{ id: string }>, { id })}
    </div>
  );
}
export function DownloadCsv(filename: string, rows: (string | number)[][]) {
  const data = rows
    .map((r) =>
      r.map((x) => '"' + String(x).replaceAll('"', '""') + '"').join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", data], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
