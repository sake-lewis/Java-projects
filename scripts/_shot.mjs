import puppeteer from 'puppeteer'
const b = await puppeteer.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] })
const p = await b.newPage()
await p.setViewport({ width: 420, height: 860, deviceScaleFactor: 1 })
await p.goto('http://localhost:3111/login', { waitUntil: 'networkidle0' })
await p.screenshot({ path: '/tmp/ui-login.png' })
// connexion
await p.type('input[type=password]', 'test1234')
await Promise.all([p.click('button'), p.waitForNavigation({ waitUntil: 'load', timeout: 20000 }).catch(()=>{})])
await new Promise(r => setTimeout(r, 2500))
await p.goto('http://localhost:3111/creation', { waitUntil: 'networkidle0' })
await p.screenshot({ path: '/tmp/ui-creation.png' })
await b.close()
console.log('ok')
