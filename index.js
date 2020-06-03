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
  // 验证码
  for (i = 0; i < 100000000; i++) {
    a = i
  }
  const sliderBtn = await page.$('.gt_slider_knob')
  sliderBtn.click()
  const captchaDom = await page.$eval('.gt_cut_fullbg_slice', function (el) {
    return el.getAttribute('style')
  })
  await page.evaluate(captchaDom => {

    let fullBgDom = document.createElement('img')
    let canvasDom = document.createElement('canvas')
    fullBgDom.setAttribute('id', 'img')
    //width="200" height="200"
    //background-image: url("http://static.geetest.com/pictures/gt/1c255d166/1c255d166.webp"); background-position: -157px -80px;
    fullBgDom.setAttribute('src', captchaDom.match(/http:\/\/static.geetest.com\/pictures\/gt\/[a-zA-z0-9]+\/[a-zA-z0-9]+.webp/))
    canvasDom.setAttribute('id', 'imageC')
    document.body.appendChild(fullBgDom)
    document.body.appendChild(canvasDom)
    var canvas = document.getElementById('imageC')
    fullBgDom = document.getElementById('img')
    fullBgDom.onload = function (options) {
      console.log(options, 'options')
      var ctx = canvas.getContext('2d')
      ctx.drawImage(fullBgDom, 0, 0, 260, 180)
      setTimeout(() => {
        clickCropImage()
      }, 3000)
    }
    function clickCropImage () {
      const numberX = 26
      const numberY = 2
      const splaceX = 10
      const splaceY = 80
      var canvas = document.getElementById('imageC');
      //  获取画布大小，判断画布大小
      var canvasH = canvas.clientHeight;
      var canvasW = canvas.clientWidth;
      //  将图片等分
      for (var x = 0; x < numberX; x++) {
        for (var y = 0; y < numberY; y++) {
          var location = {
            'x': x * canvasW / numberX - splaceX,
            'y': y * canvasH / numberY - splaceY,
            'Dx': x * canvasW / numberX + canvasW / numberX,
            'Dy': y * canvasH / numberY + canvasH / numberY,
            'locationOption': (x + 1).toString() + (y + 1).toString(),
          };
          // locationArr.push(location);
          cropImage(canvas, (x * canvasW / numberX) - splaceX, (y * canvasH / numberY) - splaceY, canvasW / numberX, canvasH / numberY);
        };
      };
      canvasComimgCreated = false;
      divComimgCreated = false;
    }

    function cropImage (targetCanvas, x, y, width, height) {
      var targetctx = targetCanvas.getContext('2d');
      var targetctxImageData = targetctx.getImageData(x, y, width, height);
      // sx, sy, sWidth, sHeight
      var c = document.createElement('canvas');
      var ctx = c.getContext('2d');
      c.width = width;
      c.height = height;
      ctx.rect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.putImageData(targetctxImageData, 0, 0);
      // imageData, dx, dy
      // 创建img 块
      var img = document.createElement('img');
      img.src = c.toDataURL('image/jpeg', 0.92);
      document.body.appendChild(img);
    }
  }, captchaDom)
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


