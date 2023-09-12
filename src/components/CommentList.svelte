<script>
  import Comment from "./Comment.svelte";
  import { onMount } from "svelte";
  import { router, meta } from "tinro";
  import { articleContent, comments, isLogin } from "../stores";
  import { contentValidate, extractErrors } from "../utils/validates";
  import dateView from "../utils/date";

  let errors = {};

  const route = meta();
  const articleId = Number(route.params.id);

  let values = {
    formContent: "",
  };

  onMount(() => {
    // 필요한 정보 load. 정보는 스토어에 저장됨
    articleContent.getArticle(articleId);
    comments.fetchComments(articleId);
  });

  const goArticles = () => router.goto(`/articles`);

  const onAddComment = async () => {
    try {
      await contentValidate.validate(values, { abortEarly: false });
      await comments.addComment(articleId, values.formContent);
      values.formContent = "";
    } catch (error) {
      errors = extractErrors(error);
      if (errors.formContent) alert(errors.formContent);
    }
  };
</script>

<div class="slog-comment-wrap">
  <div class="slog-comment-box">
    <div class="comment-box-header">
      <div class="content-box-header-inner-left">
        <p class="p-user">{$articleContent.userEmail}</p>
        <p class="p-date">{dateView($articleContent.createdAt)}</p>
      </div>
    </div>

    <div class="comment-box-main">
      <p class="whitespace-pre-line">
        {$articleContent.content}
      </p>
      <div class="inner-button-box">
        <button class="button-base" on:click={goArticles}>글 목록 보기</button>
      </div>
    </div>

    <div class="commnet-list-box">
      <h1 class="comment-title">Comments</h1>
      <ul class="my-5">
        {#each $comments as comment, index}
          <Comment {comment} {articleId} />
        {/each}
      </ul>
    </div>

    {#if $isLogin}
      <div class="comment-box-bottom">
        <textarea
          id="message"
          rows="5"
          class="slog-content-textarea"
          placeholder="내용을 입력해 주세요."
          bind:value={values.formContent}
        />
        <div class="button-box-full">
          <button class="button-base" on:click={onAddComment}>입력</button>
        </div>
      </div>
    {/if}
  </div>
</div>
