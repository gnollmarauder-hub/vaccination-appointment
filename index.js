const puppeteer = require('puppeteer');
const config = require('./config.js');

(async () => {
  const browser = await (puppeteer.launch({
    //设置超时时间
    timeout: 15000,
    //如果是访问https页面 此属性会忽略https错误
    ignoreHTTPSErrors: true,
    // 打开开发者工具, 当此值为true时, headless总为false
    devtools: false,
    // 关闭headless模式, 不会打开浏览器
    headless: false
  }));
  const page = await browser.newPage();
  await page.goto('http://www.ah12320.com/jsp/login.jsp')
  await page.waitFor('.login-type')
  const loginTypeBtn = await page.$('.login-type-ewm .login-type')
  await loginTypeBtn.click()
  // 输入账号
  const mobile = await page.$('#mobile')
  mobile.focus()
  await page.keyboard.type(config.loginInfo.mobile)
  // 输入密码
  const password = await page.$('#passwordHint')
  password.focus()
  await page.keyboard.type(config.loginInfo.password)
  // 验证码
  const sliderBtn = await page.$('.gt_slider_knob')
  sliderBtn.hover()
  const captchaDom = await page.$('.gt_cut_fullbg_slice', function (el) {
    return el.getAttribute('style')
  })
  console.log(captchaDom, '1234')
  // 登陆

  // 预约
  // await page.goto('http://www.ah12320.com/jsp/vaccination/scheduleInfo.jsp?shopId=3401231301');
  // await page.waitForSelector('.book .sele');
  // await page.screenshot({
  //   path: 'jianshu.png',
  //   type: 'png',
  //   // quality: 100, 只对jpg有效
  //   fullPage: true,
  //   // 指定区域截图，clip和fullPage两者只能设置一个
  //   // clip: {
  //   //   x: 0,
  //   //   y: 0,
  //   //   width: 1000,
  //   //   height: 40
  //   // }
  // });
  // browser.close();
})();
