let _ = require('lodash')
let puppeteer = require('puppeteer');
let config = require('./config.js');
let fs = require('fs');
let page = null
let btn_position = null
let times = 0 // 执行重新滑动的次数
let distanceError = [-10, 2, 3, 5] // 距离误差
let browser = null
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
  browser = await (puppeteer.launch({
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
  let loginTypeBtn = await page.$('.login-type-ewm .login-type')
  await loginTypeBtn.click()
  // 输入账号
  let mobile = await page.$('#mobile')
  mobile.focus()
  await page.keyboard.type(config.loginInfo.mobile)
  // 输入密码
  let password = await page.$('#passwordHint')
  password.focus()
  await page.keyboard.type(config.loginInfo.password)
  // 获取验证
  await timeout(5000)
  let sliderBtn = await page.$('.gt_slider_knob')
  let abc = await page.$('.gt_cut_fullbg')
  sliderBtn.hover({ delay: 5000 })
  await timeout(5000)
  await abc.screenshot({ path: 'fullBg.png', type: 'png' })
  await timeout(5000)
  sliderBtn.click({ delay: 5000 })
  await abc.screenshot({ path: 'gapBg.png', type: 'png' })
  // 获取滑块位置
  btn_position = await getBtnPosition('.gt_slider_knob');
  drag(null)
}

/**
 * 计算滑块位置
*/
async function getBtnPosition (id) {
  let btn_position = await page.evaluate((id) => {
    let fuck = document.querySelector(id)
    let fuckRect = fuck.getBoundingClientRect()
    return { btn_left: fuckRect.left + 22, btn_top: fuckRect.top + 22 }
  }, id)
  return btn_position;
}

/**
 * 尝试滑动按钮
 * @param distance 滑动距离
 * */
async function tryValidation (distance) {
  let reduce = [].reduce
  let count = 30 // 小编分成30步进行滑动
  let distance1 = distance - 10
  let distance2 = 10
  let steps = slide_list(distance)

  function slide_list (total_length) {
    // '''
    // 拿到移动轨迹，模仿人的滑动行为，先匀加速后匀减速
    // 匀变速运动基本公式：
    // ①v=v0+at
    // ②s=v0t+½at²
    // ③v²-v0²=2as
    // :param total_length: 需要移动的距离
    // :return: 每段移动的距离列表
    // '''
    // #初速度
    let v = 0
    // #单位时间为0.3s来统计轨迹，轨迹即0.3内的位移
    let t = 1
    // #位移/轨迹列表，列表内的一个元素代表一个T时间单位的位移,t越大，每次移动的距离越大
    let slide_result = []
    // #当前的位移
    let current = 0
    // #到达mid值开始减速
    let mid = total_length * 4 / 5

    while (current < total_length) {
      if (current < mid) {
        // # 加速度越小，单位时间的位移越小,模拟的轨迹就越多越详细
        a = 2
      }
      else {
        a = -3
      }
      // #初速度
      v0 = v
      // #0.2秒时间内的位移
      s = v0 * t + 0.5 * a * (t ** 2)
      // #当前的位置
      current += s
      // #添加到轨迹列表
      slide_result.push(Math.round(s - 1))

      // #速度已经达到v,该速度作为下次的初速度
      v = v0 + a * t
    }
    return slide_result
  }
  page.mouse.click(btn_position.btn_left, btn_position.btn_top, { delay: 2000 })
  console.log('click')
  page.mouse.down(btn_position.btn_left, btn_position.btn_top)
  console.log('down')
  let path = 0;
  page.mouse.move(btn_position.btn_left + path, btn_position.btn_top, { steps: 30 })
  function PromiseFactory (path) {
    return new Promise(async (resolve, reject) => {
      await page.mouse.move(btn_position.btn_left + path + Math.random(-5, 5), btn_position.btn_top, { steps: 30 })
      timeout(3000)
      resolve()
    })
  }
  let path2 = 0
  let stepPromiseList = steps.map(step => {
    path2 += step
    return PromiseFactory(path2)
  })
  let sequence = Promise.resolve()
  stepPromiseList.forEach(step => {
    sequence = sequence.then(step)
  })

  page.mouse.up()
  await timeout(4000);

  // 判断是否验证成功
  let isSuccess = await page.evaluate(() => {
    return document.querySelector('.gt_info_type') && document.querySelector('.gt_info_type').innerHTML
  })
  await timeout(1000);
  // 判断是否需要重新计算距离
  let reDistance = await page.evaluate(() => {
    return document.querySelector('.gt_info_content') && document.querySelector('.gt_info_content').innerHTML
  })
  console.log(reDistance, 'fuck you')
  await timeout(1000);
  return { isSuccess: isSuccess === '验证成功', reDistance: reDistance.includes('怪物吃了拼图') }
}

/**
 * 拖动滑块
 * @param distance 滑动距离
 * */
async function drag (distance) {
  distance = distance || await calculateDistance()
  let result = await tryValidation(distance.min)
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
      browser.close();
      run()
    }
  }
}
/**
 * 计算按钮需要滑动的距离 
 * */
async function calculateDistance () {
  let fullBgBuff = Buffer.from(fs.readFileSync('./fullBg.png'), 'binary').toString('base64')
  let gapBgBuff = Buffer.from(fs.readFileSync('./gapBg.png'), 'binary').toString('base64')

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
    let fullBgImage = new Image()
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
    let ctx1 = document.querySelector('#fullBg') // 完成图片
    let ctx2 = document.querySelector('#gapBg')  // 带缺口图片
    console.log(ctx1, 'fuck-ctx1')
    let pixelDifference = 30; // 像素差
    let res = []; // 保存像素差较大的x坐标

    // 对比像素
    for (let i = 57; i < 260; i++) {
      for (let j = 1; j < 160; j++) {
        let imgData1 = ctx1.getContext("2d").getImageData(1 * i, 1 * j, 1, 1)
        let imgData2 = ctx2.getContext("2d").getImageData(1 * i, 1 * j, 1, 1)
        let data1 = imgData1.data
        let data2 = imgData2.data
        let res1 = Math.abs(data1[0] - data2[0])
        let res2 = Math.abs(data1[1] - data2[1])
        let res3 = Math.abs(data1[2] - data2[2])

        if (!(res1 < pixelDifference)) {
          // 恒定j值
          if (!res.includes(i)) {
            res.push(i)
          }
        }
      }
    }
    return { min: res[0] - 7, max: res[res.length - 1] - 54 }
  }, { fullBgBuff, gapBgBuff })
}
run()