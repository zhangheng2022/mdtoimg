const cloud = require("wx-server-sdk");
const markdownIt = require("markdown-it");
const puppeteer = require("puppeteer");
const hljs = require("highlight.js");
const fs = require("fs");
const path = require("path");
// "puppeteer": "^24.2.0",

cloud.init();

exports.main = async (event, context) => {
  const { issueContent, answerContent } = event;
  try {
    const md = markdownIt({
      // 启用代码块高亮
      highlight: function (str, lang) {
        // 如果有语言声明且 highlight.js 支持该语言
        if (lang && hljs.getLanguage(lang)) {
          try {
            // 高亮代码块，返回带样式的 HTML
            return `<pre class="hljs"><code>${
              hljs.highlight(str, {
                language: lang,
                ignoreIllegals: true, // 忽略无法解析的语法
              }).value
            }</code></pre>`;
          } catch (err) {
            // 高亮失败时回退到默认处理
            console.error("高亮失败:", err);
          }
        }
        // 没有语言声明或高亮失败时，转义 HTML 并包裹默认样式
        return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
      },
    });
    const htmlIssueContent = md.render(issueContent);
    const htmlAnswerContent = md.render(answerContent);
    const buffer = await htmlToImage(htmlIssueContent, htmlAnswerContent);
    const result = await cloud.uploadFile({
      cloudPath: `screenshot/${Date.now()}.png`,
      fileContent: Buffer.from(buffer),
    });
    console.log(result);
    return {
      image: result.fileID,
      code: 0,
      message: "转换成功",
    };
  } catch (error) {
    console.log(error);
    return {
      code: 1,
      message: "转换失败",
    };
  }
};

async function htmlToImage(htmlIssueContent, htmlAnswerContent) {
  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--disable-gpu", // 禁用 GPU
      "--disable-dev-shm-usage", // 禁用共享内存
      "--no-sandbox", // 禁用沙箱
      "--disable-setuid-sandbox", // 禁用 setuid 沙箱
      "--disable-accelerated-2d-canvas", // 禁用 2D 画布加速
      "--disable-background-timer-throttling", // 禁用后台计时器限制
    ],
  });
  const page = await browser.newPage();

  await page.setViewport({
    width: 800,
    height: 800,
    deviceScaleFactor: 1,
  });

  // 加载monokai-sublime.min.css
  const monokaiSublimeCss = fs.readFileSync(path.join(__dirname, "./assets/styles/monokai-sublime.min.css"), "utf8");
  // 加载本地字体文件
  const fontBase64 = fs.readFileSync(path.join(__dirname, "./assets/fonts/思源黑体SourceHanSansCN-Medium.ttf"), {
    encoding: "base64",
  });
  const logoBase64 = fs.readFileSync(path.join(__dirname, "./assets/images/weixin_search.png"), {
    encoding: "base64",
  });

  const template = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
        <style>
          ${monokaiSublimeCss}
          @font-face {
            font-family: "思源黑体";
            src: url(data:font/ttf;base64,${fontBase64}) format("truetype");
            font-display: block;
          }
          * {
            font-family: "思源黑体" !important;
          }
          body {
            padding: 10px;
            box-sizing: border-box;
            border: 5px solid #0052d9;
            border-radius: 20px;
          }
          .issue {
            width: 100%;
            display: flex;
            justify-content: center;
          }
          .issue .content {
            padding: 0 10px;
            box-sizing: border-box;
          }
          .answer {
            width: 100%;
            display: flex;
            justify-content: flex-start;
          }
          .answer .content {
            width: 100%;
            padding: 0 10px;
            box-sizing: border-box;
          }
          .divider {
            width: 100%;
            height: 5px;
            background-color: #0052d9;
            margin: 20px 0;
          }
          .title {
            width: 100%;
            display: flex;
            justify-content: flex-end;
            padding: 10px;
            box-sizing: border-box;
          }
          .title .logo {
            max-width: 200px;
            width: 100%;
            height: auto;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="title">
          <img src="data:image/png;base64,${logoBase64}"  class="logo" alt="logo" />
        </div>
        <div class="issue">
          <div class="content">${htmlIssueContent}</div>
        </div>
        <div class="divider"></div>
        <div class="answer">
          <div class="content">${htmlAnswerContent}</div>
        </div>
      </body>
    </html>
  `;

  // 设置HTML内容
  await page.setContent(template, {
    waitUntil: "networkidle0", // 等待网络空闲
  });

  // 确保字体加载完成
  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  // 截图并保存为图片
  const screenshot = await page.screenshot({
    fullPage: true,
  });
  // 关闭浏览器
  await browser.close();

  return screenshot;
}
