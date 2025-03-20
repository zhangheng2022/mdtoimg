import { definePage, onShareAppMessage, ref } from "@vue-mini/core";

definePage(() => {
  const activeCollapse = ref(["encrypt"]);

  function collapseChange(e: WechatMiniprogram.CustomEvent) {
    activeCollapse.value = e.detail.value;
  }

  return {
    activeCollapse,
    collapseChange,
  };
});
