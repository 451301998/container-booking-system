const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, 'app-v2.js'), 'utf8');
const start = source.indexOf('  function saveSlotQuantity(');
const end = source.indexOf('  function toggleSlotActive(', start);
assert.ok(start >= 0 && end > start, 'Slot quantity handler exists');

function attempt(raw, occupied, initialCapacity = 1) {
  const currentSlot = { id: 'S1', warehouse: 'W1', date: '2026-11-27', time: '08:30', capacity: initialCapacity };
  const result = { errors: [], saves: 0, logs: 0 };
  const context = {
    slot: () => currentSlot,
    val: () => raw,
    hasRole: () => true,
    bookingCount: () => occupied,
    fieldError: (_field, message) => result.errors.push(message),
    toast: () => {},
    log: () => { result.logs += 1; },
    save: () => { result.saves += 1; },
    closeModal: () => {},
    render: () => {}
  };
  vm.runInNewContext(`${source.slice(start, end)}\nsaveSlotQuantity('S1');`, context);
  return { ...result, capacity: currentSlot.capacity };
}

test('occupied Slot needs capacity strictly above booked count', () => {
  for (const capacity of ['0', '1']) {
    const result = attempt(capacity, 1);
    assert.equal(result.capacity, 1);
    assert.equal(result.saves, 0);
    assert.match(result.errors[0], /必须大于已占用数量 1/);
  }
  const increased = attempt('2', 1);
  assert.equal(increased.capacity, 2);
  assert.equal(increased.saves, 1);
  assert.equal(increased.logs, 1);
});

test('unoccupied Slot can be set to zero', () => {
  const result = attempt('0', 0, 3);
  assert.equal(result.capacity, 0);
  assert.equal(result.saves, 1);
});

test('blank, negative and fractional quantities never save', () => {
  for (const input of ['', '  ', '-1', '1.5']) {
    const result = attempt(input, 0);
    assert.equal(result.saves, 0);
    assert.equal(result.capacity, 1);
    assert.match(result.errors[0], /整数/);
  }
});

