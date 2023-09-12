<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import ArticleLoading from "./ArticleLoading.svelte";

  export let totalPageCount;
  export let currentPage;
  export let pageLock;
  export let loading;
  export let domTarget;

  let component;
  let element;

  const dispatch = createEventDispatcher();

  onMount(() => {
    // 해당 컴포넌트의 부모 돔의 정보(스크롤 정보를 가져오기 위해)
    component = document.querySelector(domTarget);
    element = component.parentNode;
  });

  // 화면에서 사라질 때 실행되는 API
  // 더이상 필요없어진 onScroll을 메모리에서 해제하기 위해 설정
  onDestroy(() => {
    if (element) {
      element.removeEventListener("scroll", onScroll);
      element.removeEventListener("resize", onScroll);
    }
  });

  $: {
    if (element) {
      element.addEventListener("scroll", onScroll);
      element.addEventListener("resize", onScroll);
    }
  }

  const onScroll = (e) => {
    // 브라우저 스크롤 높이
    const scrollHeight = e.target.scrollHeight;
    // 화면 높이
    const clientHeight = e.target.clientHeight;
    // 현재 스크롤 위치
    const scrollTop = e.target.scrollTop;
    // 실제 스크롤 사이즈
    const realHeight = scrollHeight - clientHeight;
    // 다음 페이지가 호출 될 스크롤 높이
    const triggerHeight = realHeight * 0.7;

    const triggerComputed = () => {
      return scrollTop > triggerHeight;
    };

    // 현재 페이지가 전체 페이지보다 작거나 같으면 true 리턴
    const countCheck = () => {
      const check = totalPageCount <= currentPage;
      return check;
    };

    // countCheck을 이용해 현재 페이지가 페이지 마지막일 경우 articlePageLock을 true
    // 이를 통해 더 이상 페이지 로딩을 막음
    if (countCheck()) {
      // articlePageLock.set(true);
      dispatch("onPageLock");
    }

    const scrollTrigger = () => {
      return triggerComputed() && !countCheck() && !pageLock;
    };

    if (scrollTrigger()) {
      // currentArticlesPage.increPage();
      dispatch("increPage");
    }
  };
</script>

{#if loading}
  <ArticleLoading />
{/if}
