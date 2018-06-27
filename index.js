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
    page = await browser.newPage()

    // ブラウザ操作
    await page.goto(`https://www.google.co.jp/search?q=${event.searchWord}`, { waitUntil: 'domcontentloaded' })

    const siteRanking = await page.evaluate((siteDomain) => {
      let ranking = 1
      let ret = 0
      const nodeList = document.querySelectorAll("div#search h3")

      nodeList.forEach(node => {
        const link = node.getElementsByTagName('a')[0]
        if (ret === 0 && link['href'].includes(siteDomain)) {
          ret = ranking
        }
        ranking += 1
      })

      return ret
    }, event.siteDomain)

    return callback(null, JSON.stringify({ result: 'OK', siteRanking: siteRanking }))
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
