import { definePage, ref } from "@vue-mini/core";

interface CloudFunctionResult {
  code: number;
  message: string;
  image?: string;
}

definePage(() => {
  wx.cloud.init();

  const issue = ref("");
  const answer = ref("");
  const imageUrl = ref("");

  function handleIssuePaste() {
    wx.getClipboardData({
      success: (res) => {
        issue.value = res.data;
      },
    });
  }

  function handleAnswerPaste() {
    wx.getClipboardData({
      success: (res) => {
        answer.value = res.data;
      },
    });
  }
  function handleIssueChange(e: WechatMiniprogram.CustomEvent) {
    const { value } = e.detail;
    issue.value = value;
  }

  function handleAnswerChange(e: WechatMiniprogram.CustomEvent) {
    const { value } = e.detail;
    answer.value = value;
  }

  function handleClear() {
    issue.value = "";
    answer.value = "";
    imageUrl.value = "";
  }

  const popupShow = ref(false);

  async function handleConvert() {
    if (!issue.value && !answer.value) {
      wx.showToast({
        title: "请输入问题或回答",
        icon: "none",
        duration: 2000,
      });
      return;
    }
    wx.showLoading({
      title: "转换中...",
    });
    const { result } = (await wx.cloud.callFunction({
      name: "mdtoimg",
      data: {
        issueContent: issue.value,
        answerContent: answer.value,
      },
    })) as unknown as { result: CloudFunctionResult };

    wx.hideLoading();

    if (!result || !result.image) {
      wx.showToast({
        title: "转换失败",
        icon: "none",
        duration: 2000,
      });
      return;
    }
    const { tempFilePath } = await wx.cloud.downloadFile({
      fileID: result.image,
    });
    imageUrl.value = tempFilePath;
    popupShow.value = true;
  }

  async function handleSave() {
    await wx.saveImageToPhotosAlbum({
      filePath: imageUrl.value,
    });
    wx.showToast({
      title: "保存成功",
      icon: "success",
      duration: 2000,
    });
  }

  function popupChange(visible: boolean) {
    popupShow.value = visible;
  }

  function handleCancel() {
    popupShow.value = false;
  }

  return {
    issue,
    answer,
    imageUrl,
    popupShow,
    handleConvert,
    popupChange,
    handleIssueChange,
    handleAnswerChange,
    handleClear,
    handleCancel,
    handleSave,
    handleIssuePaste,
    handleAnswerPaste,
  };
});
