/**
 * Drives the real game in headless Chromium: shapes spawn, the magnetic cursor
 * moves them, four drags reveal the button, targets spawn and explode, victory,
 * restart, close, unmount. Exits non-zero on the first failed expectation.
 *
 *   npm install && npm test
 *
 * Set CHROMIUM_PATH to use a Chromium you already have; otherwise run
 * `npx playwright install chromium` once.
 */
import { chromium } from "playwright"

const failures = []
const check = (label, actual, ok) => {
    const passed = ok(actual)
    console.log(`${passed ? "ok  " : "FAIL"} ${label}: ${actual}`)
    if (!passed) failures.push(label)
}

const launch = () =>
    chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })

const url = `file://${import.meta.dirname}/index.html`
const errors = []

const browser = await launch()

/* ---------------- desktop playthrough ---------------- */

const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
await page.goto(url)
await page.waitForTimeout(500)

const shapes = () => page.locator(".float-shape").count()
const targets = () => page.locator(".float-target").count()
const transforms = () =>
    page.$$eval(".float-shape", (els) => els.map((e) => e.style.transform))
const expandButton = page.locator("button", { hasText: "Play more" })
const jets = page.locator('button[aria-label$="water jet"]')

check("shapes created", await shapes(), (n) => n > 0)

// magnetic cursor
const stage = await page.locator("#root > div > div").boundingBox()
const before = await transforms()
for (let i = 0; i < 20; i++) {
    await page.mouse.move(stage.x + 200 + i * 10, stage.y + 200 + i * 5)
    await page.waitForTimeout(16)
}
await page.waitForTimeout(300)
const after = await transforms()
check(
    "shapes pulled by the cursor",
    before.filter((t, i) => t !== after[i]).length,
    (n) => n > 0
)

async function drag(index) {
    const box = await page.locator(".float-shape").nth(index).boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    for (let step = 1; step <= 8; step++) {
        await page.mouse.move(x + step * 12, y + step * 6)
        await page.waitForTimeout(16)
    }
    await page.mouse.up()
    await page.waitForTimeout(100)
}

for (let i = 0; i < 3; i++) await drag(i)
check("button hidden after 3 drags", await expandButton.isVisible(), (v) => v === false)
await drag(3)
await page.waitForTimeout(200)
check("button shown after 4 drags", await expandButton.isVisible(), (v) => v === true)

await expandButton.click()
await page.waitForTimeout(3000)
check("targets spawned at 2.5s", await targets(), (n) => n === 10)
check(
    "counter matches",
    await page.locator("#root >> text=/^\\d+$/").first().textContent(),
    (t) => t === "10"
)
await page.waitForTimeout(2500)
check("targets survive activation", await targets(), (n) => n === 10)


/**
 * Clear the board the way a player does. Hammering the jets pins the whole
 * field to the ceiling, which never reaches the low circles; letting it rain
 * back down is what clears the high ones. Alternate the two.
 */
async function clearBoard() {
    for (let round = 0; round < 12 && (await targets()) > 0; round++) {
        if (round % 2 === 0) {
            for (let burst = 0; burst < 10 && (await targets()) > 0; burst++) {
                for (let j = 0; j < 3; j++)
                    await jets.nth(j).dispatchEvent("pointerdown")
                await page.waitForTimeout(150)
            }
        } else {
            for (let t = 0; t < 10 && (await targets()) > 0; t++) {
                await page.waitForTimeout(250)
            }
        }
    }
    return targets()
}

check("board cleared by the jets", await clearBoard(), (n) => n === 0)

await page.waitForTimeout(1400)
check("victory card", await page.locator("text=zen achieved").isVisible(), (v) => v)

const dancingA = await transforms()
await page.waitForTimeout(400)
const dancingB = await transforms()
check(
    "celebration animates",
    dancingA.filter((t, i) => t !== dancingB[i]).length,
    (n) => n > 0
)

await page.locator("button", { hasText: "play again" }).click()
await page.waitForTimeout(3000)
// v0.1 handed back the whole board here — it typically left 0 or 1 circle.
// The exact number varies with where the pieces ended up.
check("play again keeps a board to play", await targets(), (n) => n >= 3)

// win again so the close button is available
check("second board cleared", await clearBoard(), (n) => n === 0)
await page.waitForTimeout(1400)
await page.locator("button", { hasText: "close" }).click()
await page.waitForTimeout(1000)
check("close clears the targets", await targets(), (n) => n === 0)
check("close keeps the shapes", await shapes(), (n) => n > 0)
check(
    "close hides the card (still visible?)",
    await page.locator("text=zen achieved").isVisible(),
    (v) => !v
)
check(
    "stage collapsed",
    await page.evaluate(() => document.querySelector("#root > div > div").clientHeight),
    (h) => h === 500
)

for (let i = 0; i < 4; i++) await drag(i)
check("button returns for a second round", await expandButton.isVisible(), (v) => v)

await page.evaluate(() => window.__unmount())
await page.waitForTimeout(300)
check("unmount removes every shape", await shapes(), (n) => n === 0)
check(
    "unmount empties the container",
    await page.evaluate(() => document.getElementById("root").children.length),
    (n) => n === 0
)

/* ---------------- the loop pauses when hidden ---------------- */

const pausePage = await browser.newPage({ viewport: { width: 1400, height: 900 } })
pausePage.on("pageerror", (e) => errors.push(String(e)))
await pausePage.goto(url)
await pausePage.waitForTimeout(400)
const pauseStage = await pausePage.locator("#root > div > div").boundingBox()
for (let i = 0; i < 20; i++) {
    await pausePage.mouse.move(pauseStage.x + 150 + i * 12, pauseStage.y + 150 + i * 6)
    await pausePage.waitForTimeout(16)
}
const pauseTransforms = () =>
    pausePage.$$eval(".float-shape", (els) => els.map((e) => e.style.transform))
await pausePage.evaluate(() => {
    Object.defineProperty(document, "hidden", { value: true, configurable: true })
    document.dispatchEvent(new Event("visibilitychange"))
})
await pausePage.waitForTimeout(150)
const hiddenA = await pauseTransforms()
await pausePage.waitForTimeout(500)
const hiddenB = await pauseTransforms()
check(
    "hidden tab stops the loop",
    hiddenA.filter((t, i) => t !== hiddenB[i]).length,
    (n) => n === 0
)

/* ---------------- mobile ---------------- */

const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
})
const small = await mobile.newPage()
small.on("pageerror", (e) => errors.push(String(e)))
await small.goto(url)
await small.waitForTimeout(600)

check(
    // the play and wing shapes render smaller, so compare the base size
    "mobile base shape size",
    await small.$$eval(".float-shape", (els) =>
        Math.max(...els.map((el) => parseFloat(el.style.width)))
    ),
    (w) => w === 38
)
for (let i = 0; i < 4; i++) {
    const box = await small.locator(".float-shape").nth(i).boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await small.mouse.move(x, y)
    await small.mouse.down()
    for (let step = 1; step <= 5; step++) {
        await small.mouse.move(x + step * 8, y + step * 4)
        await small.waitForTimeout(20)
    }
    await small.mouse.up()
    await small.waitForTimeout(80)
}
await small.locator("button", { hasText: "Play more" }).click()
await small.waitForTimeout(3200)
check("mobile targets", await small.locator(".float-target").count(), (n) => n === 5)
check(
    "mobile target radius",
    await small
        .locator(".float-target")
        .first()
        .evaluate((el) => parseFloat(el.style.width) / 2),
    (r) => r === 30
)
check(
    "mobile jet buttons",
    await small.locator('button[aria-label$="water jet"]').count(),
    (n) => n === 3
)

await browser.close()

check("no page errors", errors.length ? errors.join(" | ") : "none", (e) => e === "none")

if (failures.length) {
    console.error(`\n${failures.length} failed: ${failures.join(", ")}`)
    process.exit(1)
}
console.log("\nall checks passed")
