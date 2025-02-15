import { definePage, ref } from "@vue-mini/core";

definePage(() => {
  const issue = ref("12312312");
  const answer = ref("12312312");
  const nodes = ref("");

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

  async function handleConvert() {
    // popupShow.value = true;
    wx.cloud.init();
    const res = await wx.cloud.callFunction({
      name: "mdtoimg", // 替换为你的云函数名称
      data: {
        markdownContent: issue.value,
      },
    });
    console.log(res);
    // nodes.value = issue.value;
  }

  function popupChange(visible: boolean) {
    popupShow.value = visible;
  }

  return {
    issue,
    answer,
    nodes,
    popupShow,
    handleConvert,
    popupChange,
    handleIssueChange,
    handleAnswerChange,
    handleClear,
  };
});
