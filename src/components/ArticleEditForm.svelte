<script>
  export let article;
  import { articles } from "../stores";

  // 그대로 사용하는게 아니라 복제하는 이유
  // 내용을 수정하다 취소할 시, 수정중인 내용이 사용자 목록에 그대로 적용되기 때문
  let articleValue = {
    id: article.id,
    userEmail: article.userEmail,
    createdAt: article.createdAt,
    content: article.content,
  };

  const onCloseEditModeArticle = () => {
    articles.closeEditModeArticle();
  };

  const onUpdateArticle = () => {
    articles.updateArticle(articleValue);
  };
</script>

<div class="slog-content-box">
  <div class="content-box-header">
    <div class="content-box-header-inner-left">
      <p class="p-user">{articleValue.userEmail}</p>
      <p class="p-date">{articleValue.createdAt}</p>
    </div>
  </div>

  <div class="content-box-main">
    <textarea
      id="message"
      rows="5"
      class="slog-content-textarea"
      placeholder="내용을 입력해 주세요."
      bind:value={articleValue.content}
    />
  </div>

  <div class="content-box-bottom">
    <div class="button-box">
      <button class="button-base" on:click={onUpdateArticle}>완료</button>
      <button class="button-base" on:click={onCloseEditModeArticle}>취소</button
      >
    </div>
  </div>
</div>
