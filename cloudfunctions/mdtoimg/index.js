const cloud = require("wx-server-sdk");
const { ReadableStream } = require("web-streams-polyfill");
const markdownIt = require("markdown-it");
const puppeteer = require("puppeteer");
const hljs = require("highlight.js");

global.ReadableStream = ReadableStream;

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
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.setViewport({
    width: 800,
    height: 800,
    deviceScaleFactor: 1,
  });

  const template = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/monokai-sublime.min.css">
        <style>
          @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100..900&display=swap");
          body {
            font-family: "Noto Sans SC", serif;
            padding: 10px;
            box-sizing: border-box;
            border: 1px solid #ccc;
            border-radius: 10px;
          }
          .issue {
            width: 100%;
            display: flex;
            justify-content: flex-end;
            margin-bottom: 20px;
          }
          .issue .content {
            border: 1px solid #ccc;
            border-radius: 10px;
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
            border: 1px solid #ccc;
            border-radius: 10px;
            padding: 0 10px;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        <div class="issue">
          <div class="content">${htmlIssueContent}</div>
        </div>
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
