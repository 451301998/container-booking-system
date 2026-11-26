const { test } = require("node:test");
const assert = require("node:assert/strict");
const policy = require("./sync-policy.js");

test("temporary failures have bounded exponential retries", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((attempt) => policy.nextDelay(attempt, 503)),
    [2000, 4000, 8000, 16000, 32000, null]);
});
test("permission and version conflicts never retry automatically", () => {
  for (const status of [401, 403, 409]) assert.equal(policy.nextDelay(1, status), null);
});
test("unchanged version does not trigger a full state download", () => {
  assert.equal(policy.changed("v1", "v1"), false);
  assert.equal(policy.changed("v2", "v1"), true);
});

