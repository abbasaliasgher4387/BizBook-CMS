// The arithmetic that decides what a customer is asked to pay.
//
//     npm run check:money
//
// No database, server or browser — just the pure functions in src/lib/format.ts
// that both the bill form and the save path call.
import assert from "node:assert/strict";
import { chargeLine, chargeValue, money, round2, trimPercent } from "../src/lib/format.ts";

/* ------------------------------------------------------ a percentage charge */

// GST 18% on the subtotal from the client's own bill format.
assert.equal(chargeValue(18, 0, 151950), 27351);
// The typed amount is ignored entirely once a percentage is given — the
// percentage is the instruction, not the figure beside it.
assert.equal(chargeValue(18, 999999, 151950), 27351);
// Fractional rates round to paisa, never to the rupee.
assert.equal(chargeValue(17.5, 0, 1000.55), 175.1);
assert.equal(chargeValue(17, 0, 33.33), 5.67);

/* ------------------------------------------------------------ a flat charge */

assert.equal(chargeValue(null, 4500, 151950), 4500);
// A discount is a negative charge. Nothing special, which is the point.
assert.equal(chargeValue(null, -2500, 151950), -2500);
// A charge of zero stays zero rather than picking up the subtotal.
assert.equal(chargeValue(null, 0, 151950), 0);

/* ------------------------------------------------- a whole bill, end to end */

const subtotal = round2([40 * 4200, 25 * 3100, 50 * 460].reduce((a, b) => a + b, 0));
assert.equal(subtotal, 268500);

const charges = [
  { label: "GST", percent: 18, amount: 0 },
  { label: "Cartage", percent: null, amount: 4500 },
  { label: "Discount", percent: null, amount: -3000 },
];
const amounts = charges.map((c) => chargeValue(c.percent, c.amount, subtotal));
assert.deepEqual(amounts, [48330, 4500, -3000]);

const chargesTotal = round2(amounts.reduce((a, b) => a + b, 0));
assert.equal(chargesTotal, 49830);
assert.equal(round2(subtotal + chargesTotal), 318330);

/* ----------------------------------------------------- how it reads on paper */

assert.equal(chargeLine("GST", 18), "GST 18%");
assert.equal(chargeLine("GST", 17.5), "GST 17.5%");
assert.equal(chargeLine("Cartage", null), "Cartage");
assert.equal(trimPercent(18), "18");
assert.equal(money(318330), "318,330.00");
assert.equal(money(-3000), "-3,000.00");

/* --------------------------------------- paisa that a float would have lost */

// 0.1 + 0.2 is 0.30000000000000004 in binary floating point. round2 is why
// every stored figure is exact to the paisa.
assert.equal(round2(0.1 + 0.2), 0.3);
assert.equal(round2(1.005), 1.01);

console.log("All money checks passed.");
