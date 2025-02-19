import { createApp } from "@vue-mini/core";

createApp(() => {
  console.log("App Launched!");
  const updateManager = wx.getUpdateManager();
  updateManager.onUpdateReady(function () {
    wx.showModal({
      title: "更新提示",
      content: "新版本已经准备好，是否重启应用？",
      confirmText: "立即重启",
      cancelText: "稍后再说",
      confirmColor: "#0052d9",
      success(res) {
        if (res.confirm) {
          updateManager.applyUpdate();
        }
      },
    });
  });
});
