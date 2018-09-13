'use strict'

const launchChrome = require('@serverless-chrome/lambda')
const CDP = require('chrome-remote-interface')
const puppeteer = require('puppeteer')

/**
 * Lambdaハンドラ
 * @param {Object} event Lambdaイベントデータ
 * @param {Object} context Contextオブジェクト
 * @param {function} callback コールバックオプション
 */  
exports.handler = async (event, context, callback) => {
  let slsChrome = null
  let browser = null
  let page = null

  try {
    // 前処理
    // serverless-chromeを起動し、PuppeteerからWebSocketで接続する
    slsChrome = await launchChrome()
    browser = await puppeteer.connect({ 
      browserWSEndpoint: (await CDP.Version()).webSocketDebuggerUrl 
    })
    const context = browser.defaultBrowserContext();

    // 初期設定
    await context.overridePermissions('https://www.google.co.jp', ['geolocation'])
    const page = await context.newPage()
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ja' })
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1')
    await page.goto(`https://www.google.co.jp/`, { waitUntil: 'networkidle0' })
    // ロケーション許可して疑似ロケーションで上書き
    await context.overridePermissions('https://www.google.co.jp', ['geolocation'])
    await page.setGeolocation({ longitude: event.longitude, latitude: event.latitude, accuracy: 50 })

    // 検索操作
    const searchWord = encodeURIComponent(event.searchWord)
    await page.goto(`https://www.google.co.jp/search?q=${searchWord}`, { waitUntil: 'domcontentloaded' })
    try {
        const location = await page.evaluate(() => new Promise(resolve => navigator.geolocation.getCurrentPosition(position => {
            resolve({latitude: position.coords.latitude, longitude: position.coords.longitude});
        })))
        console.log(location)
    } catch (positionError) {
        console.error(positionError)
    }
    // Webフォントを適用して豆腐を回避
    await page.evaluate(() => {
        var style = document.createElement('style')
        style.textContent = `
            @import url('//fonts.googleapis.com/css?family=Source+Code+Pro');
            @import url('//fonts.googleapis.com/earlyaccess/notosansjp.css');
            div, input, a{ font-family: 'Noto Sans JP', sans-serif !important; };`
        document.head.appendChild(style)
    })
    await page.waitFor(1000) // ちょっとダサ
    const screenShot = await page.screenshot({fullPage: true});
    await page.waitFor(1000)
    return callback(null, screenShot.toString('hex'))
  } catch (err) {
    console.error(err)
    return callback(null, JSON.stringify({ result: 'NG' }))
  } finally {
    if (page) {
      await page.close()
    }

    if (browser) {
      await browser.disconnect()
    }

    if (slsChrome) { 
      await slsChrome.kill()
    }
  }
}
