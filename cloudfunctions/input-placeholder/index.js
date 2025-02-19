// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init(); // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  return {
    data: {
      issuePlaceholder: "在此粘贴内容...",
      answerPlaceholder: "在此粘贴内容...",
    },
    code: 0,
    message: "获取成功",
  };
};
