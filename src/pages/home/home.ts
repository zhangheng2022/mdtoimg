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
  }

  const popupShow = ref(false);
  const imageUrl = ref("");

  async function handleConvert() {
    if (!issue.value && !answer.value) {
      wx.showToast({
        title: "请输入内容",
        icon: "none",
      });
      return;
    }
    wx.showLoading({
      title: "请稍候...",
      mask: true,
    });
    try {
      const { result } = (await wx.cloud.callFunction({
        name: "mdtoimg",
        data: {
          issueContent: issue.value,
          answerContent: answer.value,
        },
      })) as unknown as { result: CloudFunctionResult };
      if (!result || !result.image) {
        wx.showToast({
          title: "转换失败",
          icon: "none",
        });
        return;
      }
      const { tempFilePath } = await wx.cloud.downloadFile({
        fileID: result.image,
      });
      console.log("tempFilePath", tempFilePath);
      imageUrl.value = tempFilePath;
      popupShow.value = true;
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
    }
  }

  async function handleSave() {
    try {
      await wx.saveImageToPhotosAlbum({
        filePath: imageUrl.value,
      });
      wx.showToast({
        title: "保存成功",
        icon: "success",
      });
    } catch (error) {
      wx.showToast({
        title: "保存失败",
        icon: "none",
      });
    }
  }

  function handleImagePreview() {
    wx.previewImage({
      current: imageUrl.value,
      urls: [imageUrl.value],
    });
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
    handleIssueChange,
    handleAnswerChange,
    handleClear,
    handleCancel,
    handleSave,
    handleIssuePaste,
    handleAnswerPaste,
    handleImagePreview,
  };
});
