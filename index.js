const puppeteer = require('puppeteer');
const config = require('./config.js');
const fs = require('fs');
let page = null
let btn_position = null
let times = 0 // 执行重新滑动的次数
const distanceError = [-10, 2, 3, 5] // 距离误差
let timeout = function (delay) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(1)
      } catch (e) {
        reject(0)
      }
    }, delay);
  })
}

async function run () {
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
  page = await browser.newPage();
  await page.goto('http://www.ah12320.com/jsp/login.jsp')
  page.on('load', () => {

  })
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
  // 获取验证
  await timeout(5000)
  const sliderBtn = await page.$('.gt_slider_knob')
  const abc = await page.$('.gt_cut_fullbg')
  sliderBtn.hover({ delay: 5000 })
  await timeout(5000)
  await abc.screenshot({ path: 'fullBg.png', type: 'png' })
  await timeout(5000)
  sliderBtn.click({ delay: 5000 })
  await abc.screenshot({ path: 'gapBg.png', type: 'png' })
  // 获取滑块位置
  btn_position = await getBtnPosition('.gt_slider_knob');
  drag(null)
  // browser.close();
}

/**
 * 计算滑块位置
*/
async function getBtnPosition (id) {
  const btn_position = await page.evaluate((id) => {
    const fuck = document.querySelector(id)
    const fuckRect = fuck.getBoundingClientRect()
    return { btn_left: fuckRect.left + 22, btn_top: fuckRect.top + 22 }
  }, id)
  return btn_position;
}

/**
 * 尝试滑动按钮
 * @param distance 滑动距离
 * */
async function tryValidation (distance) {
  //将距离拆分成两段，模拟正常人的行为
  const distance1 = distance - 10
  const distance2 = 10

  page.mouse.click(btn_position.btn_left, btn_position.btn_top, { delay: 2000 })
  console.log('click')
  page.mouse.down(btn_position.btn_left, btn_position.btn_top)
  console.log('down')
  page.mouse.move(btn_position.btn_left + distance1, btn_position.btn_top, { steps: 30 })
  console.log('move')
  await timeout(800);
  page.mouse.move(btn_position.btn_left + distance1 + distance2, btn_position.btn_top, { steps: 20 })
  await timeout(800);
  page.mouse.up()
  await timeout(4000);

  // 判断是否验证成功
  const isSuccess = await page.evaluate(() => {
    return document.querySelector('.gt_info_type') && document.querySelector('.gt_info_type').innerHTML
  })
  await timeout(1000);
  // 判断是否需要重新计算距离
  const reDistance = await page.evaluate(() => {
    return document.querySelector('.gt_info_content') && document.querySelector('.gt_info_content').innerHTML
  })
  await timeout(1000);
  return { isSuccess: isSuccess === '验证成功', reDistance: reDistance.includes('怪物吃了拼图') }
}

/**
 * 拖动滑块
 * @param distance 滑动距离
 * */
async function drag (distance) {
  distance = distance || await calculateDistance()
  console.log(distance, 'distance')
  const result = await tryValidation(distance.max - distance.min)
  console.log(result, 'result')
  if (result.isSuccess) {
    await timeout(1000);
    //登录
    console.log('验证成功')
    page.click('#modal-member-login button')
  } else if (result.reDistance) {
    console.log('重新计算滑距离录，重新滑动')
    times = 0
    await drag(null)
  } else {
    if (distanceError[times]) {
      times++
      console.log('重新滑动')
      await drag({ min: distance.max, max: distance.max + distanceError[times] })
    } else {
      console.log('滑动失败')
      times = 0
      run()
    }
  }
}
/**
 * 计算按钮需要滑动的距离 
 * */
async function calculateDistance () {
  const fullBgBuff = Buffer.from(fs.readFileSync('./fullBg.png'), 'binary').toString('base64')
  const gapBgBuff = Buffer.from(fs.readFileSync('./gapBg.png'), 'binary').toString('base64')

  //
  return await page.evaluate(async ({ fullBgBuff, gapBgBuff }) => {
    let timeout = function (delay) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            resolve(1)
          } catch (e) {
            reject(0)
          }
        }, delay);
      })
    }
    let fullBgDom = document.createElement('canvas')
    let fullBgCtx = fullBgDom.getContext('2d')
    const fullBgImage = new Image()
    fullBgDom.setAttribute('id', 'fullBg')
    fullBgImage.src = `data:image/png;base64,${fullBgBuff}`
    fullBgImage.onload = () => {
      fullBgCtx.drawImage(fullBgImage, 0, 0)
    }
    document.body.appendChild(fullBgDom)

    // 创建canvas
    let gapBgDom = document.createElement('canvas')
    let gapBgCtx = gapBgDom.getContext('2d')
    let gapImage = new Image()
    gapImage.src = `data:image/png;base64,${gapBgBuff}`
    gapImage.onload = () => {
      gapBgCtx.drawImage(gapImage, 0, 0)
    }
    gapBgDom.setAttribute('id', 'gapBg')
    document.body.appendChild(gapBgDom)
    await timeout(3000)
    // abc
    const ctx1 = document.querySelector('#fullBg') // 完成图片
    const ctx2 = document.querySelector('#gapBg')  // 带缺口图片
    console.log(ctx1, 'fuck-ctx1')
    const pixelDifference = 80; // 像素差
    let res = []; // 保存像素差较大的x坐标
    let temp = 0
    const getPixelInfo = (imageData, x, y) => {

      let R = y * imageData.width * 4 + 4 * x;
      let G = R + 1;
      let B = R + 2;
      let A = R + 3;

      let orderArr = [R, G, B, A];
      let pixelInfo = {
        R,
        G,
        B,
        A,
        orderArr
      };

      return pixelInfo;
    }

    // 对比像素
    for (let i = 57; i < 260; i++) {
      for (let j = 1; j < 160; j++) {
        const imgData1 = ctx1.getContext("2d").getImageData(1 * i, 1 * j, 1, 1)
        const imgData2 = ctx2.getContext("2d").getImageData(1 * i, 1 * j, 1, 1)
        const data1 = imgData1.data;
        const data2 = imgData2.data;
        let pixelArr = getPixelInfo(imgData1, i, j).orderArr;
        // const res1 = Math.abs(data1[0] - data2[0]);
        // const res2 = Math.abs(data1[1] - data2[1]);
        // const res3 = Math.abs(data1[2] - data2[2]);

        // if (!(res1 < pixelDifference && res2 < pixelDifference && res3 < pixelDifference)) {
        //   // 恒定j值
        //   if (!res.includes(i)) {
        //     res.push({ i, j });
        //   }
        //   break
        // }
        pixelArr.map(order => {
          let disPixel = imgData1.data[order] - imgData2.data[order];
          console.log(disPixel, 'fuck res')
          if (disPixel ** 2 > 100) {
            res.push({ i, j })
            console.log(res, 'fuck res')
          }
        });
      }
    }
    return { min: 1, max: 22 }
    const dis = []
    for (let i = res[0].i; i < 260; i++) {
      const imgData1 = ctx1.getContext("2d").getImageData(1 * i, 1 * res[0].j + 5, 1, 1)
      const imgData2 = ctx2.getContext("2d").getImageData(1 * i, 1 * res[0].j + 5, 1, 1)
      const data1 = imgData1.data;
      const data2 = imgData2.data;
      const res1 = Math.abs(data1[0] - data2[0]);
      const res2 = Math.abs(data1[1] - data2[1]);
      const res3 = Math.abs(data1[2] - data2[2]);
      orderArr.map(order => {
        let disPixel = imgData1.data[order] - imgData2.data[order];
        if (disPixel ** 2 > 100) {
          dis.push(i)
        }
      });
      if (!(res1 < pixelDifference && res2 < pixelDifference && res3 < pixelDifference)) {
        dis.push(i)
      }
    }
    console.log
    // 断档的
    let min = 0
    let max = 0
    console.log(dis, 'dis')
    for (let k = 0; k < dis.length - 1; k++) {
      if (dis[k + 1] - dis[k] > 10) {
        min = dis[k]
        max = dis[k + 1]
        break
      }
    }
    // 返回像素差最大值跟最小值，经过调试最小值往左小7像素，最大值往左54像素
    return { min, max }
  }, { fullBgBuff, gapBgBuff })
}
run()