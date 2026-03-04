import { useState, useMemo, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN CONFIG (in production: stored in DB, served via API)
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_CONFIG = {
  prices: {
    tint: {
      full_vehicle: 199,
      front_two: 149,
      any_four: 179,
      front_windshield: 149,
      rear_windshield: 129,
    },
    detailing: {
      hatchback: 200,
      sedan: 220,
      suv: 250,
      large_suv_truck: 300,
    },
    detailing_addon: 249,
    deposit: 50,
  },
  films: [
    { id: "carbon", name: "Carbon", active: true, priceModifier: 0 },
    { id: "ceramic", name: "Ceramic", active: true, priceModifier: 30 },
  ],
  interac: {
    phone: "437-818-4457",
    email: "beratgultekin34@gmail.com",
    instructions: "Include your order number in the transfer message.",
  },
  business: {
    address: "20 Radison Lane, Hamilton, ON L8H 0B5",
    hours: { start: 9, end: 16 },
    slotDuration: 2,
  },
};

// Mock booked slots for demo
const MOCK_BOOKED = {
  "2026-03-10": [9, 10, 13, 14],
  "2026-03-12": [11, 12],
};

// ─────────────────────────────────────────────────────────────────────────────
// TINT WINDOW PACKAGES (groups determine which tint % questions are asked)
// ─────────────────────────────────────────────────────────────────────────────
const TINT_PACKAGES = [
  {
    id: "full_vehicle",
    label: "Full Vehicle",
    icon: "🚗",
    groups: ["front_windows", "rear_windows", "rear_windshield"],
    groupLabels: {
      front_windows: "Front Windows",
      rear_windows: "Rear Windows",
      rear_windshield: "Rear Windshield",
    },
  },
  {
    id: "front_two",
    label: "Front Two Windows",
    icon: "🪟",
    groups: ["front_windows"],
    groupLabels: { front_windows: "Front Windows" },
  },
  {
    id: "any_four",
    label: "Any 4 Windows",
    icon: "⬜",
    groups: ["front_windows", "rear_windows"],
    groupLabels: { front_windows: "Front Windows", rear_windows: "Rear Windows" },
  },
  {
    id: "front_windshield",
    label: "Front Windshield Only",
    icon: "🔲",
    groups: ["front_windshield"],
    groupLabels: { front_windshield: "Front Windshield" },
  },
  {
    id: "rear_windshield",
    label: "Rear Windshield Only",
    icon: "🔳",
    groups: ["rear_windshield"],
    groupLabels: { rear_windshield: "Rear Windshield" },
  },
];

const TINT_OPTIONS = [
  { value: "35", label: "35%", desc: "Light — Maximum visibility" },
  { value: "20", label: "20%", desc: "Dark — Popular choice" },
  { value: "5", label: "5%", desc: "Limo — Maximum privacy" },
];

const VEHICLE_TYPES = [
  { id: "hatchback", label: "Hatchback", icon: "🚙" },
  { id: "sedan", label: "Sedan", icon: "🚗" },
  { id: "suv", label: "SUV", icon: "🛻" },
  { id: "large_suv_truck", label: "Large SUV / Truck", icon: "🚚" },
];

let orderSeed = 124;
function genOrderNumber(type) {
  orderSeed++;
  const prefix = type === "tint" ? "TINT" : "DETL";
  return `${prefix}-${new Date().getFullYear()}-${String(orderSeed).padStart(6, "0")}`;
}

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function formatHour(h) {
  const s = h >= 12 ? "PM" : "AM";
  const d = h > 12 ? h - 12 : h === 12 ? 12 : h;
  return `${d}:00 ${s}`;
}

function generateSlots(dateStr, config) {
  if (!dateStr) return [];
  const booked = MOCK_BOOKED[dateStr] || [];
  const { start, end, slotDuration } = config.business.hours
    ? { start: config.business.hours.start, end: config.business.hours.end, slotDuration: config.business.slotDuration }
    : { start: 9, end: 16, slotDuration: 2 };

  const slots = [];
  for (let h = start; h <= end - slotDuration; h++) {
    const blocked = Array.from({ length: slotDuration }, (_, i) => h + i).some((hr) =>
      booked.includes(hr)
    );
    slots.push({ hour: h, label: formatHour(h), endLabel: formatHour(h + slotDuration), available: !blocked });
  }
  return slots;
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const G = {
  gold: "#D4A843",
  goldDim: "rgba(212,168,67,0.12)",
  goldBorder: "rgba(212,168,67,0.35)",
  bg: "#080808",
  card: "#0d0d0d",
  surface: "#111111",
  border: "#1c1c1c",
  borderDim: "#141414",
  text: "#e8e8e8",
  muted: "#666",
  faint: "#2a2a2a",
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI ATOMS
// ─────────────────────────────────────────────────────────────────────────────
const css = {
  heading: {
    fontFamily: "'Bebas Neue', sans-serif",
    letterSpacing: "0.06em",
    color: "#fff",
  },
  label: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 11,
    letterSpacing: "0.18em",
    color: G.muted,
    textTransform: "uppercase",
    display: "block",
    marginBottom: 8,
  },
};

function Heading({ children, size = 24 }) {
  return (
    <h2 style={{ ...css.heading, fontSize: size, marginBottom: 4 }}>{children}</h2>
  );
}

function Sub({ children }) {
  return (
    <p style={{ color: G.muted, fontSize: 13, marginBottom: 22, lineHeight: 1.6 }}>
      {children}
    </p>
  );
}

function FieldLabel({ children }) {
  return <span style={css.label}>{children}</span>;
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: G.surface,
          border: `1px solid ${focused ? G.gold : G.border}`,
          borderRadius: 8,
          padding: "11px 14px",
          color: G.text,
          fontSize: 14,
          boxSizing: "border-box",
          outline: "none",
          transition: "border-color 0.2s",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

function SelectCard({ active, onClick, disabled, children, gold }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: active ? G.goldDim : G.surface,
        border: `1.5px solid ${active ? G.gold : disabled ? G.borderDim : G.border}`,
        borderRadius: 10,
        padding: "14px 16px",
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        width: "100%",
        transition: "all 0.18s",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

function PrimaryBtn({ children, onClick, disabled, full = true }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: full ? "100%" : "auto",
        background: disabled ? G.faint : G.gold,
        color: disabled ? G.muted : "#080808",
        border: "none",
        borderRadius: 10,
        padding: "14px 24px",
        fontSize: 15,
        fontWeight: 700,
        fontFamily: "'Bebas Neue', sans-serif",
        letterSpacing: "0.1em",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        boxShadow: disabled ? "none" : "0 4px 24px rgba(212,168,67,0.3)",
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: `1px solid ${G.border}`,
        color: G.muted,
        borderRadius: 10,
        padding: "14px 20px",
        cursor: "pointer",
        fontSize: 14,
        fontFamily: "'Bebas Neue', sans-serif",
        letterSpacing: "0.08em",
        transition: "all 0.2s",
        minWidth: 90,
      }}
    >
      {children}
    </button>
  );
}

function PriceBox({ rows, deposit, total }) {
  return (
    <div
      style={{
        background: "#080808",
        border: `1px solid ${G.borderDim}`,
        borderRadius: 10,
        padding: "14px 18px",
        marginBottom: 22,
      }}
    >
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 7,
            fontSize: 13,
          }}
        >
          <span style={{ color: G.muted }}>{r.label}</span>
          <span style={{ color: "#ccc" }}>{r.value}</span>
        </div>
      ))}
      <div
        style={{
          borderTop: `1px solid ${G.border}`,
          paddingTop: 10,
          marginTop: 4,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 700, color: "#fff" }}>Total</span>
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 22,
            color: G.gold,
            letterSpacing: "0.04em",
          }}
        >
          ${total}
        </span>
      </div>
      {deposit != null && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12 }}>
            <span style={{ color: G.gold }}>Deposit Required Now</span>
            <span style={{ color: G.gold, fontWeight: 600 }}>${deposit}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 12 }}>
            <span style={{ color: G.muted }}>Due at Drop-Off</span>
            <span style={{ color: G.muted }}>${total - deposit}</span>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "8px 0",
        borderBottom: `1px solid ${G.borderDim}`,
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 11,
          letterSpacing: "0.12em",
          color: G.muted,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, color: "#ccc", textAlign: "right", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP BAR
// ─────────────────────────────────────────────────────────────────────────────
function StepBar({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 32, overflowX: "auto" }}>
      {steps.map((s, i) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: done || active ? G.gold : G.surface,
                  border: `2px solid ${done || active ? G.gold : G.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: done || active ? "#080808" : G.faint,
                  fontFamily: "'Bebas Neue', sans-serif",
                  transition: "all 0.35s",
                  boxShadow: active ? `0 0 18px rgba(212,168,67,0.45)` : "none",
                  flexShrink: 0,
                }}
              >
                {done ? "✓" : s.n}
              </div>
              <span
                style={{
                  fontSize: 9,
                  marginTop: 4,
                  color: active ? G.gold : done ? "#555" : "#333",
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  height: 1,
                  flex: 1,
                  background: done ? G.gold : G.border,
                  marginBottom: 18,
                  minWidth: 10,
                  transition: "background 0.35s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TINT FLOW STEPS
// ─────────────────────────────────────────────────────────────────────────────
const TINT_STEPS = [
  { n: 1, label: "Service" },
  { n: 2, label: "Windows" },
  { n: 3, label: "Shade" },
  { n: 4, label: "Film" },
  { n: 5, label: "Schedule" },
  { n: 6, label: "Payment" },
];

function TintStep2({ booking, setBooking, config, onNext, onBack }) {
  const { prices } = config;
  const pkg = booking.tintPackage;

  const total = useMemo(() => {
    if (!pkg) return null;
    const film = config.films.find((f) => f.id === booking.filmType);
    return prices.tint[pkg] + (film?.priceModifier || 0) + (booking.detailingAddon ? prices.detailing_addon : 0);
  }, [pkg, booking.filmType, booking.detailingAddon, prices]);

  return (
    <div>
      <Heading>Select Windows to Tint</Heading>
      <Sub>Choose the window package for your vehicle</Sub>

      <div style={{ display: "grid", gap: 8, marginBottom: 24 }}>
        {TINT_PACKAGES.map((p) => {
          const active = pkg === p.id;
          return (
            <SelectCard key={p.id} active={active} onClick={() => setBooking((b) => ({ ...b, tintPackage: p.id, tintShades: {} }))}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <span
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 15,
                      letterSpacing: "0.05em",
                      color: active ? G.gold : G.text,
                    }}
                  >
                    {p.label}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 17,
                    color: active ? G.gold : G.muted,
                  }}
                >
                  ${prices.tint[p.id]}
                </span>
              </div>
            </SelectCard>
          );
        })}
      </div>

      {total !== null && (
        <div
          style={{
            background: G.goldDim,
            border: `1px solid ${G.goldBorder}`,
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 20,
            fontSize: 13,
            color: G.gold,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Estimated starting price</span>
          <strong>${prices.tint[pkg]}</strong>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <GhostBtn onClick={onBack}>← BACK</GhostBtn>
        <div style={{ flex: 1 }}>
          <PrimaryBtn disabled={!pkg} onClick={onNext}>SELECT SHADE →</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

function TintStep3({ booking, setBooking, onNext, onBack }) {
  const pkg = TINT_PACKAGES.find((p) => p.id === booking.tintPackage);
  if (!pkg) return null;

  function setShade(group, val) {
    setBooking((b) => ({ ...b, tintShades: { ...b.tintShades, [group]: val } }));
  }

  const allSet = pkg.groups.every((g) => booking.tintShades?.[g]);

  return (
    <div>
      <Heading>Select Tint Percentage</Heading>
      <Sub>Choose shade per window group. You can mix percentages.</Sub>

      <div style={{ display: "grid", gap: 14, marginBottom: 28 }}>
        {pkg.groups.map((group) => {
          const selected = booking.tintShades?.[group];
          return (
            <div
              key={group}
              style={{
                background: G.surface,
                border: `1px solid ${selected ? G.gold : G.border}`,
                borderRadius: 10,
                padding: "14px 16px",
                transition: "border-color 0.2s",
              }}
            >
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 13,
                  letterSpacing: "0.12em",
                  color: selected ? G.gold : G.muted,
                  marginBottom: 10,
                  textTransform: "uppercase",
                }}
              >
                {pkg.groupLabels[group]}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {TINT_OPTIONS.map((opt) => {
                  const active = selected === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setShade(group, opt.value)}
                      style={{
                        background: active ? G.gold : "#0c0c0c",
                        border: `1.5px solid ${active ? G.gold : G.border}`,
                        borderRadius: 8,
                        padding: "10px 6px",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: 18,
                          color: active ? "#080808" : G.text,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 9, color: active ? "#333" : G.muted, marginTop: 2, lineHeight: 1.3 }}>
                        {opt.desc.split("—")[0].trim()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <GhostBtn onClick={onBack}>← BACK</GhostBtn>
        <div style={{ flex: 1 }}>
          <PrimaryBtn disabled={!allSet} onClick={onNext}>SELECT FILM →</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

function TintStep4({ booking, setBooking, config, onNext, onBack }) {
  const activeFilms = config.films.filter((f) => f.active);
  const pkg = TINT_PACKAGES.find((p) => p.id === booking.tintPackage);
  const pkgPrice = config.prices.tint[booking.tintPackage] || 0;
  const filmMod = config.films.find((f) => f.id === booking.filmType)?.priceModifier || 0;
  const detailPrice = booking.detailingAddon ? config.prices.detailing_addon : 0;
  const total = pkgPrice + filmMod + detailPrice;

  return (
    <div>
      <Heading>Film Type</Heading>
      <Sub>Choose your window film technology</Sub>

      <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
        {activeFilms.map((film) => {
          const active = booking.filmType === film.id;
          return (
            <SelectCard key={film.id} active={active} onClick={() => setBooking((b) => ({ ...b, filmType: film.id }))}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 16,
                      letterSpacing: "0.08em",
                      color: active ? G.gold : G.text,
                    }}
                  >
                    {film.name}
                  </div>
                  {film.priceModifier > 0 && (
                    <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>
                      +${film.priceModifier} upgrade
                    </div>
                  )}
                </div>
                {active && (
                  <span style={{ fontSize: 18, color: G.gold }}>✓</span>
                )}
              </div>
            </SelectCard>
          );
        })}
      </div>

      <div style={{ marginBottom: 24 }}>
        <FieldLabel>Detailing Add-On</FieldLabel>
        <SelectCard
          active={booking.detailingAddon}
          onClick={() => setBooking((b) => ({ ...b, detailingAddon: !b.detailingAddon }))}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 18 }}>✨</span>
              <div>
                <div
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 14,
                    letterSpacing: "0.06em",
                    color: booking.detailingAddon ? G.gold : G.text,
                  }}
                >
                  Full Detailing
                </div>
                <div style={{ fontSize: 11, color: G.muted }}>Interior & exterior deep clean</div>
              </div>
            </div>
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 16,
                color: booking.detailingAddon ? G.gold : G.muted,
              }}
            >
              +${config.prices.detailing_addon}
            </span>
          </div>
        </SelectCard>
      </div>

      {booking.filmType && (
        <PriceBox
          rows={[
            { label: `Windows — ${pkg?.label}`, value: `$${pkgPrice}` },
            ...(filmMod > 0 ? [{ label: `${config.films.find((f) => f.id === booking.filmType)?.name} Film`, value: `+$${filmMod}` }] : []),
            ...(booking.detailingAddon ? [{ label: "Full Detailing", value: `+$${detailPrice}` }] : []),
          ]}
          deposit={config.prices.deposit}
          total={total}
        />
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <GhostBtn onClick={onBack}>← BACK</GhostBtn>
        <div style={{ flex: 1 }}>
          <PrimaryBtn disabled={!booking.filmType} onClick={onNext}>SCHEDULE →</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAILING FLOW STEPS
// ─────────────────────────────────────────────────────────────────────────────
const DETAIL_STEPS = [
  { n: 1, label: "Service" },
  { n: 2, label: "Vehicle" },
  { n: 3, label: "Schedule" },
  { n: 4, label: "Payment" },
];

function DetailStep2({ booking, setBooking, config, onNext, onBack }) {
  const { detailing } = config.prices;
  const vt = booking.vehicleType;

  function upd(k, v) { setBooking((b) => ({ ...b, [k]: v })); }

  const vehicleInfoOk = booking.vehicleMake?.trim() && booking.vehicleModel?.trim() && booking.vehicleYear?.trim();
  const canProceed = vehicleInfoOk && !!vt;

  return (
    <div>
      <Heading>Vehicle Information</Heading>
      <Sub>Tell us about your vehicle so we can prepare accordingly</Sub>

      <div style={{ display: "grid", gap: 10, marginBottom: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input label="Make" placeholder="Toyota, BMW…" value={booking.vehicleMake || ""} onChange={(v) => upd("vehicleMake", v)} />
          <Input label="Model" placeholder="Camry, M3…" value={booking.vehicleModel || ""} onChange={(v) => upd("vehicleModel", v)} />
        </div>
        <Input label="Year" placeholder={`${new Date().getFullYear()}`} value={booking.vehicleYear || ""} onChange={(v) => upd("vehicleYear", v)} type="number" />
      </div>

      <FieldLabel>Vehicle Type</FieldLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
        {VEHICLE_TYPES.map((veh) => {
          const active = vt === veh.id;
          return (
            <SelectCard key={veh.id} active={active} onClick={() => upd("vehicleType", veh.id)}>
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{veh.icon}</div>
                <div
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 13,
                    letterSpacing: "0.06em",
                    color: active ? G.gold : G.text,
                  }}
                >
                  {veh.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 16,
                    color: active ? G.gold : G.muted,
                    marginTop: 2,
                  }}
                >
                  ${detailing[veh.id]}
                </div>
              </div>
            </SelectCard>
          );
        })}
      </div>

      {vt && (
        <PriceBox
          rows={[{ label: `Detailing — ${VEHICLE_TYPES.find((v) => v.id === vt)?.label}`, value: `$${detailing[vt]}` }]}
          deposit={config.prices.deposit}
          total={detailing[vt]}
        />
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <GhostBtn onClick={onBack}>← BACK</GhostBtn>
        <div style={{ flex: 1 }}>
          <PrimaryBtn disabled={!canProceed} onClick={onNext}>SCHEDULE →</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: CUSTOMER INFO STEP (used by both flows before payment)
// ─────────────────────────────────────────────────────────────────────────────
function CustomerInfoStep({ booking, setBooking, onNext, onBack }) {
  function upd(k, v) { setBooking((b) => ({ ...b, [k]: v })); }
  const valid =
    booking.customerName?.trim() &&
    booking.customerPhone?.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.customerEmail || "");

  return (
    <div>
      <Heading>Your Details</Heading>
      <Sub>We'll use this to confirm your appointment</Sub>

      <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
        <Input label="Full Name" placeholder="John Smith" value={booking.customerName || ""} onChange={(v) => upd("customerName", v)} />
        <Input label="Phone Number" placeholder="(416) 555-0100" value={booking.customerPhone || ""} onChange={(v) => upd("customerPhone", v)} />
        <Input label="Email Address" placeholder="you@email.com" value={booking.customerEmail || ""} onChange={(v) => upd("customerEmail", v)} type="email" />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <GhostBtn onClick={onBack}>← BACK</GhostBtn>
        <div style={{ flex: 1 }}>
          <PrimaryBtn disabled={!valid} onClick={onNext}>REVIEW & PAY →</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: SCHEDULE STEP — FIXED with clearly visible time slots
// ─────────────────────────────────────────────────────────────────────────────
function ScheduleStep({ booking, setBooking, config, onNext, onBack }) {
  const slots = useMemo(() => generateSlots(booking.scheduleDate, config), [booking.scheduleDate, config]);
  const availableCount = slots.filter((s) => s.available).length;
  const valid = booking.scheduleDate && booking.scheduleTime != null;

  return (
    <div>
      <Heading>Schedule Appointment</Heading>
      <Sub>Select a date and 2-hour drop-off window</Sub>

      <FieldLabel>Select Date</FieldLabel>
      <input
        type="date"
        min={getMinDate()}
        value={booking.scheduleDate || ""}
        onChange={(e) =>
          setBooking((b) => ({ ...b, scheduleDate: e.target.value, scheduleTime: null }))
        }
        style={{
          width: "100%",
          background: G.surface,
          border: `1px solid ${booking.scheduleDate ? G.gold : G.border}`,
          borderRadius: 8,
          padding: "12px 14px",
          color: G.text,
          fontSize: 14,
          boxSizing: "border-box",
          marginBottom: 20,
          colorScheme: "dark",
          fontFamily: "'Bebas Neue', sans-serif",
          letterSpacing: "0.05em",
          outline: "none",
        }}
      />

      {booking.scheduleDate && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <FieldLabel>Available Time Slots</FieldLabel>
            <span
              style={{
                fontSize: 11,
                color: availableCount > 0 ? "#4ade80" : "#f87171",
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.1em",
              }}
            >
              {availableCount} SLOT{availableCount !== 1 ? "S" : ""} AVAILABLE
            </span>
          </div>

          {slots.length === 0 ? (
            <div
              style={{
                background: G.surface,
                border: `1px solid ${G.border}`,
                borderRadius: 10,
                padding: 20,
                textAlign: "center",
                color: G.muted,
                fontSize: 13,
              }}
            >
              No slots for this date. Please try another day.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 20 }}>
              {slots.map((slot) => {
                const active = booking.scheduleTime === slot.hour;
                return (
                  <button
                    key={slot.hour}
                    disabled={!slot.available}
                    onClick={() => setBooking((b) => ({ ...b, scheduleTime: slot.hour }))}
                    style={{
                      background: active
                        ? G.gold
                        : slot.available
                        ? G.surface
                        : "#090909",
                      border: `1.5px solid ${
                        active ? G.gold : slot.available ? G.border : "#151515"
                      }`,
                      borderRadius: 10,
                      padding: "14px 10px",
                      cursor: slot.available ? "pointer" : "not-allowed",
                      transition: "all 0.18s",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 16,
                        letterSpacing: "0.06em",
                        color: active ? "#080808" : slot.available ? G.text : "#252525",
                      }}
                    >
                      {slot.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: active ? "#333" : slot.available ? G.muted : "#1e1e1e",
                        marginTop: 3,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {slot.available ? `until ${slot.endLabel}` : "BOOKED"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {booking.scheduleTime != null && (
            <div
              style={{
                background: G.goldDim,
                border: `1px solid ${G.goldBorder}`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: G.gold,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>📅</span>
              <span>
                {new Date(booking.scheduleDate + "T12:00:00").toLocaleDateString("en-CA", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
                · {formatHour(booking.scheduleTime)} – {formatHour(booking.scheduleTime + 2)}
              </span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <GhostBtn onClick={onBack}>← BACK</GhostBtn>
        <div style={{ flex: 1 }}>
          <PrimaryBtn disabled={!valid} onClick={onNext}>ENTER DETAILS →</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRMATION PAGE — standalone, full detail + navigation buttons
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmationPage({ booking, config, serviceType, orderNumber, total, onGoHome, onBookAgain }) {
  const deposit = config.prices.deposit;
  const balance = total - deposit;
  const pkg = TINT_PACKAGES.find((p) => p.id === booking.tintPackage);
  const vehicleType = VEHICLE_TYPES.find((v) => v.id === booking.vehicleType);
  const film = config.films.find((f) => f.id === booking.filmType);

  const dateStr = booking.scheduleDate
    ? new Date(booking.scheduleDate + "T12:00:00").toLocaleDateString("en-CA", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      })
    : "";

  return (
    <div style={{ animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
      {/* ── Success header ── */}
      <div style={{ textAlign: "center", paddingBottom: 24, borderBottom: `1px solid ${G.borderDim}`, marginBottom: 22 }}>
        {/* Animated checkmark ring */}
        <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 18px" }}>
          <div style={{
            position: "absolute", inset: 0,
            borderRadius: "50%",
            background: G.goldDim,
            border: `2px solid ${G.gold}`,
            animation: "pulseRing 2s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", inset: 6,
            borderRadius: "50%",
            background: "rgba(212,168,67,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, color: G.gold,
          }}>✓</div>
        </div>

        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 28,
          color: G.gold,
          letterSpacing: "0.07em",
          marginBottom: 6,
        }}>
          Booking Confirmed!
        </div>
        <p style={{ color: G.muted, fontSize: 13, lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>
          Your appointment has been successfully created. A confirmation has been sent to{" "}
          <span style={{ color: "#aaa" }}>{booking.customerEmail}</span>.
        </p>
      </div>

      {/* ── Order number badge ── */}
      <div style={{
        background: G.goldDim,
        border: `1px solid ${G.goldBorder}`,
        borderRadius: 10,
        padding: "12px 18px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 10,
          letterSpacing: "0.2em",
          color: G.gold,
          textTransform: "uppercase",
        }}>Order Number</span>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 18,
          color: G.gold,
          letterSpacing: "0.08em",
        }}>{orderNumber}</span>
      </div>

      {/* ── Service details ── */}
      <div style={{
        background: G.surface,
        border: `1px solid ${G.border}`,
        borderRadius: 12,
        padding: "16px 18px",
        marginBottom: 12,
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 10,
          letterSpacing: "0.2em",
          color: G.muted,
          marginBottom: 12,
          textTransform: "uppercase",
        }}>Service Details</div>

        <SummaryRow
          label="Service"
          value={serviceType === "tint" ? `Window Tint — ${pkg?.label}` : `Auto Detailing — ${vehicleType?.label}`}
        />
        {serviceType === "tint" && pkg && (
          <SummaryRow
            label="Tint Shades"
            value={pkg.groups.map((g) => `${pkg.groupLabels[g]}: ${booking.tintShades?.[g]}%`).join(" · ")}
          />
        )}
        {serviceType === "tint" && film && <SummaryRow label="Film Type" value={film.name} />}
        {booking.detailingAddon && <SummaryRow label="Add-On" value="Full Detailing" />}
        <SummaryRow label="Vehicle" value={`${booking.vehicleYear} ${booking.vehicleMake} ${booking.vehicleModel}`} />
        <SummaryRow label="Customer" value={booking.customerName} />
      </div>

      {/* ── Scheduled date & time ── */}
      <div style={{
        background: G.surface,
        border: `1px solid ${G.border}`,
        borderRadius: 12,
        padding: "14px 18px",
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}>
        <div style={{
          width: 42, height: 42,
          background: G.goldDim,
          border: `1px solid ${G.goldBorder}`,
          borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>📅</div>
        <div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 10,
            letterSpacing: "0.18em",
            color: G.muted,
            marginBottom: 3,
            textTransform: "uppercase",
          }}>Scheduled Appointment</div>
          <div style={{ fontSize: 14, color: G.text, fontWeight: 600, lineHeight: 1.4 }}>{dateStr}</div>
          <div style={{ fontSize: 13, color: G.muted }}>
            {formatHour(booking.scheduleTime)} – {formatHour(booking.scheduleTime + 2)}
            <span style={{ color: G.faint, marginLeft: 6 }}>· 2 hours</span>
          </div>
        </div>
      </div>

      {/* ── Price breakdown ── */}
      <div style={{
        background: G.surface,
        border: `1px solid ${G.border}`,
        borderRadius: 12,
        padding: "14px 18px",
        marginBottom: 12,
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 10,
          letterSpacing: "0.2em",
          color: G.muted,
          marginBottom: 12,
          textTransform: "uppercase",
        }}>Price Breakdown</div>

        {serviceType === "tint" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: G.muted }}>Windows — {pkg?.label}</span>
              <span style={{ color: "#ccc" }}>${config.prices.tint[booking.tintPackage]}</span>
            </div>
            {film?.priceModifier > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: G.muted }}>{film.name} Film</span>
                <span style={{ color: "#ccc" }}>+${film.priceModifier}</span>
              </div>
            )}
            {booking.detailingAddon && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: G.muted }}>Full Detailing</span>
                <span style={{ color: "#ccc" }}>+${config.prices.detailing_addon}</span>
              </div>
            )}
          </>
        )}
        {serviceType === "detailing" && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
            <span style={{ color: G.muted }}>Detailing — {vehicleType?.label}</span>
            <span style={{ color: "#ccc" }}>${config.prices.detailing[booking.vehicleType]}</span>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 10, marginTop: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: "#fff" }}>Total</span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: G.gold, letterSpacing: "0.04em" }}>
              ${total}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: "#4ade80" }}>✓ Deposit Paid</span>
            <span style={{ color: "#4ade80", fontWeight: 600 }}>${deposit}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: G.muted }}>Remaining Balance at Drop-Off</span>
            <span style={{ color: G.muted, fontWeight: 600 }}>${balance}</span>
          </div>
        </div>
      </div>

      {/* ── Drop-off address ── */}
      <div style={{
        background: G.goldDim,
        border: `1px solid ${G.goldBorder}`,
        borderRadius: 12,
        padding: "14px 18px",
        marginBottom: 28,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}>
        <div style={{
          width: 38, height: 38,
          background: "rgba(212,168,67,0.15)",
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0, marginTop: 2,
        }}>📍</div>
        <div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 10,
            letterSpacing: "0.2em",
            color: G.gold,
            marginBottom: 5,
            textTransform: "uppercase",
          }}>Drop-Off Address</div>
          <div style={{ fontSize: 14, color: G.text, fontWeight: 600, lineHeight: 1.5 }}>
            {config.business.address}
          </div>
          <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>
            Please arrive on time. Remaining balance due at drop-off.
          </div>
        </div>
      </div>

      {/* ── Navigation Buttons ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* Back to Home */}
        <button
          onClick={onGoHome}
          style={{
            background: G.surface,
            border: `1.5px solid ${G.border}`,
            borderRadius: 12,
            padding: "14px 12px",
            cursor: "pointer",
            textAlign: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = G.muted; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = G.border; }}
        >
          <div style={{ fontSize: 20, marginBottom: 5 }}>🏠</div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 13,
            letterSpacing: "0.1em",
            color: G.text,
            marginBottom: 2,
          }}>Back to Home</div>
          <div style={{ fontSize: 10, color: G.muted }}>Return to main site</div>
        </button>

        {/* Book Another Appointment */}
        <button
          onClick={onBookAgain}
          style={{
            background: G.goldDim,
            border: `1.5px solid ${G.gold}`,
            borderRadius: 12,
            padding: "14px 12px",
            cursor: "pointer",
            textAlign: "center",
            transition: "all 0.2s",
            boxShadow: "0 4px 20px rgba(212,168,67,0.15)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,168,67,0.2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = G.goldDim; }}
        >
          <div style={{ fontSize: 20, marginBottom: 5 }}>➕</div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 13,
            letterSpacing: "0.1em",
            color: G.gold,
            marginBottom: 2,
          }}>Book Another</div>
          <div style={{ fontSize: 10, color: "rgba(212,168,67,0.6)" }}>Start a new appointment</div>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: PAYMENT STEP
// ─────────────────────────────────────────────────────────────────────────────
function PaymentStep({ booking, config, serviceType, onConfirmed }) {
  const [payMethod, setPayMethod] = useState(null);
  const [interacChecked, setInteracChecked] = useState(false);

  const orderNumber = useMemo(() => genOrderNumber(serviceType), []);

  // Calculate total
  const total = useMemo(() => {
    if (serviceType === "tint") {
      const base = config.prices.tint[booking.tintPackage] || 0;
      const film = config.films.find((f) => f.id === booking.filmType)?.priceModifier || 0;
      const detail = booking.detailingAddon ? config.prices.detailing_addon : 0;
      return base + film + detail;
    } else {
      return config.prices.detailing[booking.vehicleType] || 0;
    }
  }, [booking, config, serviceType]);

  const deposit = config.prices.deposit;
  const balance = total - deposit;

  const pkg = TINT_PACKAGES.find((p) => p.id === booking.tintPackage);
  const vehicleType = VEHICLE_TYPES.find((v) => v.id === booking.vehicleType);
  const film = config.films.find((f) => f.id === booking.filmType);
  const dateStr = booking.scheduleDate
    ? new Date(booking.scheduleDate + "T12:00:00").toLocaleDateString("en-CA", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      })
    : "";

  return (
    <div>
      <Heading>Review & Payment</Heading>

      {/* Summary */}
      <div
        style={{
          background: G.surface,
          border: `1px solid ${G.border}`,
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 10,
            letterSpacing: "0.2em",
            color: G.muted,
            marginBottom: 12,
          }}
        >
          BOOKING SUMMARY
        </div>
        <SummaryRow label="Service" value={serviceType === "tint" ? `Window Tint — ${pkg?.label}` : `Detailing — ${vehicleType?.label}`} />
        {serviceType === "tint" && pkg && (
          <SummaryRow
            label="Shades"
            value={pkg.groups.map((g) => `${pkg.groupLabels[g]}: ${booking.tintShades?.[g]}%`).join(" · ")}
          />
        )}
        {serviceType === "tint" && film && <SummaryRow label="Film Type" value={film.name} />}
        {booking.detailingAddon && <SummaryRow label="Detailing Add-On" value="Included" />}
        <SummaryRow label="Vehicle" value={`${booking.vehicleYear} ${booking.vehicleMake} ${booking.vehicleModel}`} />
        <SummaryRow label="Date" value={dateStr} />
        <SummaryRow label="Time" value={`${formatHour(booking.scheduleTime)} – ${formatHour(booking.scheduleTime + 2)}`} />
      </div>

      <PriceBox
        rows={[
          serviceType === "tint"
            ? { label: `Windows — ${pkg?.label}`, value: `$${config.prices.tint[booking.tintPackage]}` }
            : { label: `Detailing — ${vehicleType?.label}`, value: `$${config.prices.detailing[booking.vehicleType]}` },
          ...(film?.priceModifier > 0 ? [{ label: `${film.name} Film`, value: `+$${film.priceModifier}` }] : []),
          ...(booking.detailingAddon ? [{ label: "Full Detailing Add-On", value: `+$${config.prices.detailing_addon}` }] : []),
        ]}
        deposit={deposit}
        total={total}
      />

      {/* Payment Method */}
      <FieldLabel>Payment Method — $50 Deposit</FieldLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { id: "interac", label: "Interac e-Transfer", icon: "🏦", sub: "Instant · No fees" },
          { id: "stripe", label: "Credit / Debit", icon: "💳", sub: "Powered by Stripe" },
        ].map((m) => (
          <SelectCard key={m.id} active={payMethod === m.id} onClick={() => setPayMethod(m.id)}>
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 12,
                  letterSpacing: "0.07em",
                  color: payMethod === m.id ? G.gold : G.text,
                }}
              >
                {m.label}
              </div>
              <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{m.sub}</div>
            </div>
          </SelectCard>
        ))}
      </div>

      {/* Interac Panel */}
      {payMethod === "interac" && (
        <div
          style={{
            background: G.goldDim,
            border: `1px solid ${G.goldBorder}`,
            borderRadius: 12,
            padding: "18px 20px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 11,
              letterSpacing: "0.18em",
              color: G.gold,
              marginBottom: 14,
            }}
          >
            Send $50 via Interac e-Transfer
          </div>
          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            {[
              { icon: "📱", label: "Phone", val: config.interac.phone },
              { icon: "✉️", label: "Email", val: config.interac.email },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>{r.icon}</span>
                <div>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 10,
                      letterSpacing: "0.14em",
                      color: G.muted,
                    }}
                  >
                    {r.label}
                  </div>
                  <div style={{ fontSize: 14, color: G.text, fontWeight: 600 }}>{r.val}</div>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              background: "#080808",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 11,
              color: G.muted,
              marginBottom: 14,
              lineHeight: 1.6,
            }}
          >
            <span style={{ color: "#aaa", fontWeight: 600 }}>Message: </span>
            {orderNumber} — {booking.vehicleYear} {booking.vehicleMake} {booking.vehicleModel}
          </div>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 14 }}>{config.interac.instructions}</div>
          <label style={{ display: "flex", gap: 10, cursor: "pointer", alignItems: "flex-start" }}>
            <input
              type="checkbox"
              checked={interacChecked}
              onChange={(e) => setInteracChecked(e.target.checked)}
              style={{ width: 16, height: 16, marginTop: 2, accentColor: G.gold }}
            />
            <span style={{ fontSize: 13, color: "#999", lineHeight: 1.5 }}>
              I have sent the $50 deposit. I understand ${balance} is due at vehicle drop-off.
            </span>
          </label>
          <div style={{ marginTop: 16 }}>
            <PrimaryBtn disabled={!interacChecked} onClick={() => onConfirmed({ orderNumber, total })}>
              CONFIRM BOOKING →
            </PrimaryBtn>
          </div>
        </div>
      )}

      {/* Stripe Panel */}
      {payMethod === "stripe" && (
        <div
          style={{
            background: G.surface,
            border: `1px solid ${G.border}`,
            borderRadius: 12,
            padding: "18px 20px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 11,
              letterSpacing: "0.18em",
              color: G.muted,
              marginBottom: 14,
            }}
          >
            Card Payment — $50 Deposit
          </div>
          {["Card Number", "Expiry / CVC"].map((label) => (
            <div
              key={label}
              style={{
                background: "#080808",
                border: `1px solid ${G.border}`,
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: "#333", letterSpacing: "0.2em" }}>
                {label === "Card Number" ? "•••• •••• •••• ••••" : "MM / YY  ···"}
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "#444", textAlign: "center", marginBottom: 14 }}>
            🔒 Payments are secured by Stripe. We never store card data.
          </div>
          <PrimaryBtn onClick={() => onConfirmed({ orderNumber, total })}>
            PAY $50 & CONFIRM →
          </PrimaryBtn>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PANEL
// ─────────────────────────────────────────────────────────────────────────────
function AdminPanel({ config, setConfig, onClose }) {
  const [tab, setTab] = useState("prices");
  const [newFilmName, setNewFilmName] = useState("");

  function upPrice(path, val) {
    const parts = path.split(".");
    setConfig((c) => {
      const next = { ...c, prices: { ...c.prices } };
      if (parts.length === 2) {
        next.prices[parts[0]] = { ...next.prices[parts[0]], [parts[1]]: Number(val) };
      } else {
        next.prices[parts[0]] = Number(val);
      }
      return next;
    });
  }

  function upInterac(key, val) {
    setConfig((c) => ({ ...c, interac: { ...c.interac, [key]: val } }));
  }

  function upBusiness(key, val) {
    setConfig((c) => ({ ...c, business: { ...c.business, [key]: val } }));
  }

  function toggleFilm(id) {
    setConfig((c) => ({
      ...c,
      films: c.films.map((f) => (f.id === id ? { ...f, active: !f.active } : f)),
    }));
  }

  function addFilm() {
    if (!newFilmName.trim()) return;
    const id = newFilmName.toLowerCase().replace(/\s+/g, "_");
    setConfig((c) => ({
      ...c,
      films: [...c.films, { id, name: newFilmName.trim(), active: true, priceModifier: 0 }],
    }));
    setNewFilmName("");
  }

  const tabs = [
    { id: "prices", label: "💰 Prices" },
    { id: "films", label: "🎞 Films" },
    { id: "payment", label: "💳 Payment" },
    { id: "business", label: "🏢 Business" },
  ];

  const AField = ({ label, value, onChange, prefix = "", type = "text", multiline }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", fontFamily: "'Bebas Neue',sans-serif", marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", background: "#070707", border: `1px solid ${G.border}`, borderRadius: 7, overflow: "hidden" }}>
        {prefix && <span style={{ padding: "0 8px 0 12px", color: G.muted, fontSize: 14 }}>{prefix}</span>}
        {multiline ? (
          <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} style={{ flex: 1, background: "transparent", border: "none", padding: "10px 12px", color: "#ccc", fontSize: 12, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
        ) : (
          <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", padding: "10px 12px", color: "#ccc", fontSize: 13, outline: "none", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "0.03em" }} />
        )}
      </div>
    </div>
  );

  const ASection = ({ label, children }) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 10, letterSpacing: "0.2em", color: G.gold, marginBottom: 12 }}>{label}</div>
      {children}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.94)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#0c0c0c", border: `1px solid ${G.border}`, borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${G.borderDim}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: G.gold, letterSpacing: "0.1em" }}>ADMIN PANEL</div>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.1em" }}>Auto Tint Studio</div>
          </div>
          <button onClick={onClose} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 7, padding: "5px 14px", color: G.muted, cursor: "pointer", fontSize: 12 }}>✕ Close</button>
        </div>

        <div style={{ display: "flex", padding: "10px 20px 0", gap: 4, borderBottom: `1px solid ${G.borderDim}` }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? G.surface : "transparent",
                border: `1px solid ${tab === t.id ? G.border : "transparent"}`,
                borderBottom: tab === t.id ? `1px solid ${G.card}` : "none",
                borderRadius: "6px 6px 0 0",
                padding: "6px 12px",
                cursor: "pointer",
                color: tab === t.id ? G.gold : "#444",
                fontSize: 11,
                fontFamily: "'Bebas Neue',sans-serif",
                letterSpacing: "0.08em",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ overflowY: "auto", padding: 20, flex: 1 }}>
          {tab === "prices" && (
            <>
              <ASection label="Window Tint Prices">
                {[
                  ["full_vehicle", "Full Vehicle"],
                  ["front_two", "Front Two Windows"],
                  ["any_four", "Any 4 Windows"],
                  ["front_windshield", "Front Windshield"],
                  ["rear_windshield", "Rear Windshield"],
                ].map(([k, l]) => (
                  <AField key={k} label={l} value={config.prices.tint[k]} onChange={(v) => upPrice(`tint.${k}`, v)} prefix="$" type="number" />
                ))}
              </ASection>
              <ASection label="Detailing Prices (by vehicle type)">
                {VEHICLE_TYPES.map((vt) => (
                  <AField key={vt.id} label={vt.label} value={config.prices.detailing[vt.id]} onChange={(v) => upPrice(`detailing.${vt.id}`, v)} prefix="$" type="number" />
                ))}
              </ASection>
              <ASection label="Add-Ons & Deposit">
                <AField label="Detailing Add-On" value={config.prices.detailing_addon} onChange={(v) => upPrice("detailing_addon", v)} prefix="$" type="number" />
                <AField label="Deposit Amount" value={config.prices.deposit} onChange={(v) => upPrice("deposit", v)} prefix="$" type="number" />
              </ASection>
            </>
          )}

          {tab === "films" && (
            <>
              <ASection label="Film Types">
                {config.films.map((f) => (
                  <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#080808", border: `1px solid ${G.borderDim}`, borderRadius: 8, marginBottom: 8 }}>
                    <span style={{ color: f.active ? "#ccc" : "#333", fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: "0.06em" }}>{f.name}</span>
                    <button
                      onClick={() => toggleFilm(f.id)}
                      style={{
                        background: f.active ? G.goldDim : "#0e0e0e",
                        border: `1px solid ${f.active ? G.goldBorder : G.border}`,
                        borderRadius: 20,
                        padding: "3px 12px",
                        cursor: "pointer",
                        color: f.active ? G.gold : "#444",
                        fontSize: 10,
                        fontFamily: "'Bebas Neue',sans-serif",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {f.active ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>
                ))}
              </ASection>
              <ASection label="Add New Film Type">
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={newFilmName} onChange={(e) => setNewFilmName(e.target.value)} placeholder="e.g. Nano Ceramic Pro" onKeyDown={(e) => e.key === "Enter" && addFilm()} style={{ flex: 1, background: "#080808", border: `1px solid ${G.border}`, borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none" }} />
                  <button onClick={addFilm} style={{ background: G.gold, color: "#080808", border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Bebas Neue',sans-serif" }}>ADD</button>
                </div>
              </ASection>
            </>
          )}

          {tab === "payment" && (
            <>
              <ASection label="Interac e-Transfer">
                <AField label="Phone Number" value={config.interac.phone} onChange={(v) => upInterac("phone", v)} />
                <AField label="Email Address" value={config.interac.email} onChange={(v) => upInterac("email", v)} />
                <AField label="Payment Instructions" value={config.interac.instructions} onChange={(v) => upInterac("instructions", v)} multiline />
              </ASection>
              <ASection label="Stripe">
                <div style={{ background: "#080808", border: `1px solid ${G.borderDim}`, borderRadius: 8, padding: 14, fontSize: 12, color: G.muted, lineHeight: 1.7 }}>
                  Stripe keys are configured via server environment variables for security.<br />
                  <code style={{ color: G.gold, fontSize: 11 }}>STRIPE_SECRET_KEY=sk_live_…<br />NEXT_PUBLIC_STRIPE_PK=pk_live_…</code>
                </div>
              </ASection>
            </>
          )}

          {tab === "business" && (
            <ASection label="Business Settings">
              <AField label="Shop Address" value={config.business.address} onChange={(v) => upBusiness("address", v)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <AField label="Open Hour (24h)" value={config.business.hours.start} onChange={(v) => setConfig((c) => ({ ...c, business: { ...c.business, hours: { ...c.business.hours, start: Number(v) } } }))} type="number" />
                <AField label="Close Hour (24h)" value={config.business.hours.end} onChange={(v) => setConfig((c) => ({ ...c, business: { ...c.business, hours: { ...c.business.hours, end: Number(v) } } }))} type="number" />
                <AField label="Slot Duration (hrs)" value={config.business.slotDuration} onChange={(v) => upBusiness("slotDuration", Number(v))} type="number" />
              </div>
            </ASection>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BLANK BOOKING STATE — exported so resets are consistent
// ─────────────────────────────────────────────────────────────────────────────
const BLANK_BOOKING = {
  tintPackage: null,
  tintShades: {},
  filmType: null,
  detailingAddon: false,
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  vehicleType: null,
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  scheduleDate: "",
  scheduleTime: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP CONFIGS
// ─────────────────────────────────────────────────────────────────────────────
const TINT_STEPS_FULL = [
  { n: 1, label: "Service" },
  { n: 2, label: "Windows" },
  { n: 3, label: "Shade" },
  { n: 4, label: "Film" },
  { n: 5, label: "Schedule" },
  { n: 6, label: "Details" },
  { n: 7, label: "Payment" },
];

const DETAIL_STEPS_FULL = [
  { n: 1, label: "Service" },
  { n: 2, label: "Vehicle" },
  { n: 3, label: "Schedule" },
  { n: 4, label: "Details" },
  { n: 5, label: "Payment" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP — Dual-flow router with confirmation page & navigation
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [showAdmin, setShowAdmin] = useState(false);

  // "screen" controls which top-level view is shown:
  // "home" | "tint" | "detailing" | "confirmed"
  const [screen, setScreen] = useState("home");
  const [tintStep, setTintStep] = useState(2);
  const [detailStep, setDetailStep] = useState(2);
  const [booking, setBooking] = useState(BLANK_BOOKING);
  const [confirmedData, setConfirmedData] = useState(null); // { orderNumber, total, serviceType, booking }

  // ── Full reset helper ──
  const resetAll = useCallback(() => {
    setBooking(BLANK_BOOKING);
    setTintStep(2);
    setDetailStep(2);
    setConfirmedData(null);
  }, []);

  // ── Go to service selection (Step 1) ──
  const goHome = useCallback(() => {
    resetAll();
    setScreen("home");
    // In a real Next.js app this would be: router.push('/')
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [resetAll]);

  // ── Start a fresh new booking ──
  const bookAgain = useCallback(() => {
    resetAll();
    setScreen("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [resetAll]);

  // ── Browser history management — push a state on each screen/step change ──
  // This prevents the back button from leaving the booking flow unexpectedly
  useEffect(() => {
    // Push an entry so the user can press Back and get to the previous step
    window.history.pushState({ screen, tintStep, detailStep }, "");
  }, [screen, tintStep, detailStep]);

  useEffect(() => {
    function handlePopState(e) {
      const state = e.state;
      if (!state) {
        // Reached the very beginning — go to home
        goHome();
        return;
      }

      // Navigate backwards through the flow
      if (state.screen === "home") {
        resetAll();
        setScreen("home");
      } else if (state.screen === "confirmed") {
        // Can't go back from confirmation — stay on it
      } else if (state.screen === "tint") {
        setScreen("tint");
        const prevStep = Math.max(2, (state.tintStep || 2) - 1);
        setTintStep(prevStep);
      } else if (state.screen === "detailing") {
        setScreen("detailing");
        const prevStep = Math.max(2, (state.detailStep || 2) - 1);
        setDetailStep(prevStep);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [goHome, resetAll]);

  // ── Handle booking confirmed ──
  function handleConfirmed({ orderNumber, total }) {
    setConfirmedData({
      orderNumber,
      total,
      serviceType: screen,
      booking: { ...booking },
    });
    setScreen("confirmed");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Navigate to a service flow ──
  function selectService(svc) {
    resetAll();
    setScreen(svc);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Mulish:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; font-family: 'Mulish', sans-serif; color: #e8e8e8; min-height: 100vh; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.35) sepia(1) saturate(3) hue-rotate(15deg); opacity: 0.7; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes pulseRing { 0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,67,0.3); } 50% { box-shadow: 0 0 0 10px rgba(212,168,67,0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
      `}</style>

      {showAdmin && <AdminPanel config={config} setConfig={setConfig} onClose={() => setShowAdmin(false)} />}

      {/* Background glow */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(212,168,67,0.05) 0%, transparent 55%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", padding: "16px 16px 60px" }}>
        {/* ── Header ── */}
        <div style={{ maxWidth: 580, margin: "0 auto 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Logo — always clickable to go home */}
          <button
            onClick={screen !== "confirmed" ? goHome : undefined}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "transparent", border: "none",
              cursor: screen !== "confirmed" ? "pointer" : "default",
              padding: 0,
            }}
          >
            <div style={{ width: 38, height: 38, background: G.gold, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🚗</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: "0.1em", lineHeight: 1, color: "#fff" }}>AUTO TINT STUDIO</div>
              <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.15em", marginTop: 1 }}>HAMILTON · ONTARIO</div>
            </div>
          </button>
          <button
            onClick={() => setShowAdmin(true)}
            style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "5px 14px", color: G.muted, cursor: "pointer", fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "0.12em" }}
          >⚙ ADMIN</button>
        </div>

        {/* ── Main card ── */}
        <div
          key={screen}
          style={{
            maxWidth: 580,
            margin: "0 auto",
            background: G.card,
            border: `1px solid ${G.border}`,
            borderRadius: 18,
            padding: "24px 20px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.015)",
            animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* ── SCREEN: Home / Service Selection ── */}
          {screen === "home" && (
            <div style={{ animation: "fadeUp 0.3s" }}>
              <Heading size={26}>Which service do you need?</Heading>
              <Sub>Choose a service to get started with your booking</Sub>
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  { id: "tint", label: "Window Tint", icon: "🪟", desc: "Professional film installation. Multiple shade & film options." },
                  { id: "detailing", label: "Auto Detailing", icon: "✨", desc: "Interior & exterior deep clean. Priced by vehicle type." },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectService(s.id)}
                    style={{
                      background: G.surface,
                      border: `1.5px solid ${G.border}`,
                      borderRadius: 12,
                      padding: "20px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      textAlign: "left",
                      transition: "all 0.2s",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.background = G.goldDim; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.background = G.surface; }}
                  >
                    <div style={{ width: 52, height: 52, background: G.goldDim, border: `1px solid ${G.goldBorder}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: "0.06em", color: "#fff", marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 13, color: G.muted, lineHeight: 1.4 }}>{s.desc}</div>
                    </div>
                    <div style={{ marginLeft: "auto", color: G.muted, fontSize: 18 }}>›</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── SCREEN: Tint flow ── */}
          {screen === "tint" && (
            <div key={`tint-${tintStep}`} style={{ animation: "fadeUp 0.3s" }}>
              <StepBar steps={TINT_STEPS_FULL} current={tintStep} />
              {tintStep === 2 && <TintStep2 booking={booking} setBooking={setBooking} config={config} onNext={() => setTintStep(3)} onBack={() => { resetAll(); setScreen("home"); }} />}
              {tintStep === 3 && <TintStep3 booking={booking} setBooking={setBooking} onNext={() => setTintStep(4)} onBack={() => setTintStep(2)} />}
              {tintStep === 4 && <TintStep4 booking={booking} setBooking={setBooking} config={config} onNext={() => setTintStep(5)} onBack={() => setTintStep(3)} />}
              {tintStep === 5 && <ScheduleStep booking={booking} setBooking={setBooking} config={config} onNext={() => setTintStep(6)} onBack={() => setTintStep(4)} />}
              {tintStep === 6 && <CustomerInfoStep booking={booking} setBooking={setBooking} onNext={() => setTintStep(7)} onBack={() => setTintStep(5)} />}
              {tintStep === 7 && <PaymentStep booking={booking} config={config} serviceType="tint" onConfirmed={handleConfirmed} />}
            </div>
          )}

          {/* ── SCREEN: Detailing flow ── */}
          {screen === "detailing" && (
            <div key={`detail-${detailStep}`} style={{ animation: "fadeUp 0.3s" }}>
              <StepBar steps={DETAIL_STEPS_FULL} current={detailStep} />
              {detailStep === 2 && <DetailStep2 booking={booking} setBooking={setBooking} config={config} onNext={() => setDetailStep(3)} onBack={() => { resetAll(); setScreen("home"); }} />}
              {detailStep === 3 && <ScheduleStep booking={booking} setBooking={setBooking} config={config} onNext={() => setDetailStep(4)} onBack={() => setDetailStep(2)} />}
              {detailStep === 4 && <CustomerInfoStep booking={booking} setBooking={setBooking} onNext={() => setDetailStep(5)} onBack={() => setDetailStep(3)} />}
              {detailStep === 5 && <PaymentStep booking={booking} config={config} serviceType="detailing" onConfirmed={handleConfirmed} />}
            </div>
          )}

          {/* ── SCREEN: Confirmation ── */}
          {screen === "confirmed" && confirmedData && (
            <ConfirmationPage
              booking={confirmedData.booking}
              config={config}
              serviceType={confirmedData.serviceType}
              orderNumber={confirmedData.orderNumber}
              total={confirmedData.total}
              onGoHome={goHome}
              onBookAgain={bookAgain}
            />
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "#222", letterSpacing: "0.12em" }}>
          AUTO TINT STUDIO · HAMILTON ON · BOOK ONLINE 24/7
        </div>
      </div>
    </>
  );
}
