const cloud = require("wx-server-sdk");
const { ReadableStream } = require("web-streams-polyfill");
const markdownIt = require("markdown-it")();
const puppeteer = require("puppeteer");

global.ReadableStream = ReadableStream;

cloud.init();

exports.main = async (event, context) => {
  const { markdownContent } = event;
  const screenshot = await markdownToImage(markdownContent);
  console.log(screenshot);
  return {
    screenshot,
    code: 0,
    message: "转换成功",
  };
};

async function markdownToImage(markdown) {
  // 将Markdown转换为HTML
  const htmlContent = markdownIt.render(markdown);

  // 启动浏览器
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.setViewport({
    width: 640,
    height: 480,
    deviceScaleFactor: 1,
  });

  // 设置HTML内容
  await page.setContent(
    `
    <html>
      <head>
        <style>
          @font-face {
            font-family: "阿里妈妈方圆体 VF Regular";src: url("//at.alicdn.com/wf/webfont/tSpNvAJbO72E/bZNvtsQihpL2.woff2") format("woff2"),
            url("//at.alicdn.com/wf/webfont/tSpNvAJbO72E/7Y6ffKWiXkco.woff") format("woff");
            font-display: swap;
          }
          body {
            font-family: '阿里妈妈方圆体 VF Regular', sans-serif;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `,
    {
      waitUntil: "networkidle0", // 等待网络空闲
    },
  );

  // 确保字体加载完成
  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  // 截图并保存为图片
  const screenshot = await page.screenshot({
    fullPage: true,
    encoding: "base64",
  });
  // 关闭浏览器
  await browser.close();

  return screenshot;
}
