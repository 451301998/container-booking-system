const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const { join } = require("node:path");

const source = readFileSync(join(__dirname, "app-v2.js"), "utf8");
function declaration(name) {
  const line = source.split(/\r?\n/).find((item) => item.startsWith(`  function ${name}(`));
  assert.ok(line, `missing ${name}`);
  return line;
}

test("a pending booking renders its actual review fields and action", () => {
  const booking = {
    id: "BK-example",
    containerId: "container-1",
    slotId: "slot-1",
    status: "pending",
    pendingReason: "该 Slot 已满",
  };
  const container = { id: "container-1", number: "TEMU7700017", size: 40, customer: "F61A", warehouse: "DE06" };
  const slot = { id: "slot-1", date: "2026-12-09", time: "08:30", capacity: 2 };
  const context = {
    booking,
    isContainerVisible: () => true,
    container: () => container,
    slot: () => slot,
    warehouse: () => ({ name: "DE06" }),
    bookingCount: () => 2,
    cnDate: () => "12月9日",
    esc: (value) => String(value ?? ""),
    paginateRows: (_, rows) => ({ rows, footer: "" }),
  };
  runInNewContext(`${declaration("reviewTable")}; result = reviewTable([booking], "audit")`, context);
  assert.match(context.result, /TEMU7700017/);
  assert.match(context.result, /BK-example/);
  assert.match(context.result, /12月9日 08:30/);
  assert.match(context.result, /该 Slot 已满/);
  assert.match(context.result, /App\.openReview\('BK-example'\)/);
  assert.doesNotMatch(context.result, /德国时间/);
});

test("review pages call the review renderer and logs retain their renderer", () => {
  assert.match(declaration("renderAudit"), /reviewTable\(/);
  assert.match(declaration("renderOpsDashboard"), /renderOperationsCenter\("ops"\)/);
  assert.match(source.slice(source.indexOf("  function renderOperationsCenter("), source.indexOf("  function renderDashboard(")), /reviewTable\(/);
  assert.match(declaration("renderAuditLogs"), /auditTable\(audit\.rows\)/);
  assert.match(declaration("auditTable"), /德国时间/);
});

