<script>
  import { onMount } from "svelte";
  import { auth, isRefresh } from "./stores";
  import Router from "./router.svelte";

  const refrest_time = 1000 * 60 * 14;

  // refresh 요청 반복적으로 보내는 작업
  // 해당 컴포넌트가 mount되기 전에 실행되는 함수
  onMount(() => {
    const onRefresh = setInterval(() => {
      if ($isRefresh) {
        auth.refresh();
      } else {
        clearInterval(onRefresh);
      }
    }, refrest_time);
  });
</script>

<div class="main-container">
  <!-- 마크업 영역에서 비동기를 처리하기 위한 방법 -->
  <!-- auth.refresh()가 완료돼야 Router가 보여짐 -->
  <!-- 또는, main.js에서 해주는 방법도 있음 -->
  <!-- {#await auth.refresh() then} -->
  <Router />
  <!-- {/await} -->
</div>
