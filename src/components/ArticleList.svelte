<script>
  import { onMount } from "svelte";
  import {
    articles,
    currentArticlesPage,
    loadingArticle,
    articlePageLock,
  } from "../stores";
  import Article from "./Article.svelte";
  import ArticleLoading from "./ArticleLoading.svelte";

  let component;
  let element;

  onMount(() => {
    articles.resetArticles();
    articles.fetchArticles();
  });

  $: {
    if (component) {
      // 해당 컴포넌트의 부모 돔의 정보(스크롤 정보를 가져오기 위해)
      element = component.parentNode;
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
      const check = $articles.totalPageCount <= $currentArticlesPage;
      return check;
    };

    // countCheck을 이용해 현재 페이지가 페이지 마지막일 경우 articlePageLock을 true
    // 이를 통해 더 이상 페이지 로딩을 막음
    if (countCheck()) {
      articlePageLock.set(true);
    }

    const scrollTrigger = () => {
      return triggerComputed() && !countCheck() && !$articlePageLock;
    };

    if (scrollTrigger()) {
      currentArticlesPage.increPage();
    }
  };
</script>

<div class="slog-list-wrap" bind:this={component}>
  <ul class="slog-ul">
    {#each $articles.articleList as article, index}
      <li class="mb-5">
        <Article {article} />
      </li>
    {/each}
  </ul>
  <!-- 로딩 시, 로딩 화면 출력 -->
  {#if $loadingArticle}
    <ArticleLoading />
  {/if}
</div>
