// @ts-nocheck
import { writable, get, derived } from "svelte/store";
import { getApi, postApi, putApi, delApi } from "../service/api";
import { router } from "tinro";
import { ALL, MY, LIKE } from "../utils/constant";

// 무한 스크롤 기반 페이지네이션
function setCurrentArticlesPage() {
    // 초기 페이지 값을 1로 설정
    const { subscribe, update, set } = writable(1);

    const resetPage = () => set(1);

    // 페이지가 1 증가할 때 마다, 데이터도 불러온다.
    const increPage = () => {
        update(data => data = data + 1);
        articles.fetchArticles();
    };

    return {
        subscribe,
        resetPage,
        increPage,
    }
}

// 글 목록 가져오는 기능
function setArticles() {
    let initValues = {
        articleList: [],
        totalPageCount: 0,
        menuPopup: "", // 메뉴창을 띄울 하나의 articleId를 저장
        editMode: "", // 수정 모드를 띄울 하나의 articleId를 저장
    };

    const { subscribe, update, set } = writable({ ...initValues });

    const fetchArticles = async () => {
        // 페이지 로딩 시, 추가 로딩을 잠금
        loadingArticle.turnOnLoading();

        // get(): 다른 스토어 또는 일반 js 파일에서 스벨트의 스토어값을 가져오는 함수
        // $ 기호는 js 파일에선 사용하지 못한다.
        const currentPage = get(currentArticlesPage);
        // let path = `/articles/?pageNumber=${currentPage}`;
        let path = "";
        const mode = get(articlesMode);

        switch (mode) {
            case ALL:
                path = `/articles/?pageNumber=${currentPage}`;
                break;
            case LIKE:
                path = `/likes/?pageNumber=${currentPage}`;
                break;
            case MY:
                path = `/articles/?pageNumber=${currentPage}&mode=${mode}`;
                break;
            default:
                path = `/articles/${currentPage}`;
                break;
        }

        try {
            // $ 기호는 js 파일에선 사용하지 못한다. 그래서 get을 통해 가져온다.
            const access_token = get(auth).Authorization;

            const options = {
                path: path,
                access_token: access_token,
            };

            const getDatas = await getApi(options);

            const newData = {
                articleList: getDatas.articleList,
                totalPageCount: getDatas.totalPageCount,
            };

            update(datas => {
                // 첫 페이지라면 받아온 데이터를 그대로 대입한다.
                if (currentPage === 1) {
                    datas.articleList = newData.articleList;
                    datas.totalPageCount = newData.totalPageCount;
                } else { // 첫 페이지가 아니라면, 스프레드를 시켜 이전 데이터에 연결시킨다.
                    const newArticles = [...datas.articleList, ...newData.articleList];
                    datas.articleList = newArticles;
                    datas.totalPageCount = newData.totalPageCount;
                }

                return datas;
            })

            // 페이지 로딩이 다 됐을 시, 추가 로딩 잠금 해제
            loadingArticle.turnOffLoading();
        } catch (error) {
            // 오류 발생 시에도, 더 이상 나타나지 않게 함
            loadingArticle.turnOffLoading();
            throw error;
        }
    };
    const resetArticles = () => {
        set({ ...initValues });
        currentArticlesPage.resetPage();
        // 페이지 초기화 시, 잠금 해제
        articlePageLock.set(false);
    };

    const addArticle = async (content) => {
        // 로그인한 사람만 보낼 수 있도록
        const access_token = get(auth).Authorization;

        try {
            const options = {
                path: "/articles",
                data: {
                    content: content,
                },
                access_token: access_token,
            };

            const newArticle = await postApi(options);

            // 기존 목록 앞에 새 글 추가
            // 추가된 부분만을 스토어에 적용 시, 전체가 아닌 변화가 있는 부분만을 수정할 수 있음
            update(datas => {
                datas.articleList = [newArticle, ...datas.articleList];
                return datas;
            })
        } catch (error) {
            throw error;
        }
    }

    const openMenuPopup = (id) => {
        update(datas => {
            datas.menuPopup = id;
            return datas;
        })
    }

    const closeMenuPopup = () => {
        update(datas => {
            datas.menuPopup = "";
            return datas;
        })
    }

    const openEditModeArticle = (id) => {
        // 열려있는 팝업 메뉴 닫기
        articles.closeMenuPopup();

        update(datas => {
            datas.editMode = id;
            return datas;
        })
    }

    const closeEditModeArticle = () => {
        update(datas => {
            datas.editMode = "";
            return datas;
        })
    }

    const updateArticle = async (article) => {
        const access_token = get(auth).Authorization;

        try {
            const updateData = {
                articleId: article.id,
                content: article.content,
            };

            const options = {
                path: "/articles",
                data: updateData,
                access_token: access_token,
            };

            const updateArticle = await putApi(options);

            update(datas => {
                // 수정한 article을 찾아서 내용을 바꾸는 작업
                const newArticleList = datas.articleList.map(article => {
                    if (article.id === updateArticle.id) {
                        article = updateArticle;
                    }
                    return article;
                })
                datas.articleList = newArticleList;
                return datas;
            });

            articles.closeEditModeArticle();
            alert("수정이 완료되었습니다.");
        } catch (error) {
            alert("수정에 오류가 발생했습니다. 다시 시도해 주세요.");
        }
    }

    const deleteArticle = async (id) => {
        const access_token = get(auth).Authorization;

        try {
            const options = {
                path: `/articles/${id}`,
                access_token: access_token,
            };

            await delApi(options);

            update(datas => {
                // 삭제한 article의 id와 같지 않은 것만 선별
                const newArticleList = datas.articleList.filter(article => article.id !== id);
                datas.articleList = newArticleList;
                return datas;
            });
            alert("삭제가 완료되었습니다.");
        } catch (error) {
            alert("삭제 중 오류가 발생했습니다.");
        }
    }

    // 댓글 작성 시, 댓글 개수 추가
    const increArticleCommentCount = (articleId) => {
        update(datas => {
            const newArticleList = datas.articleList.map(article => {
                if (article.id === articleId) {
                    article.commentCount = article.commentCount + 1;
                }
                return article;
            })
            datas.articleList = newArticleList;
            return datas;
        })
    };

    // 댓글 작성 시, 댓글 개수 감소
    const decreArticleCommentCount = (articleId) => {
        update(datas => {
            const newArticleList = datas.articleList.map(article => {
                if (article.id === articleId) {
                    article.commentCount = article.commentCount - 1;
                }
                return article;
            })
            datas.articleList = newArticleList;
            return datas;
        })
    };

    const likeArticle = async (articleId) => {
        const access_token = get(auth).Authorization;

        try {
            const options = {
                path: `/likes/add/${articleId}`,
                access_token: access_token,
            };

            await postApi(options);

            update(datas => {
                const newArticles = datas.articleList.map(article => {
                    if (article.id === articleId) {
                        article.likeCount = article.likeCount + 1;
                        article.likeMe = true;
                    }

                    return article;
                })

                datas.articleList = newArticles;
                return datas;
            });
        } catch (error) {
            alert("오류가 발생했습니다.");
        }
    }

    const cancelLikeArticle = async (articleId) => {
        const access_token = get(auth).Authorization;

        try {
            const options = {
                path: `/likes/cancel/${articleId}`,
                access_token: access_token,
            };

            await postApi(options);

            update(datas => {
                const newArticles = datas.articleList.map(article => {
                    if (article.id === articleId) {
                        article.likeCount = article.likeCount - 1;
                        article.likeMe = false;
                    }

                    return article;
                })

                datas.articleList = newArticles;
                return datas;
            });
        } catch (error) {
            alert("오류가 발생했습니다.");
        }
    }

    return {
        subscribe,
        fetchArticles,
        resetArticles,
        addArticle,
        openMenuPopup,
        closeMenuPopup,
        openEditModeArticle,
        closeEditModeArticle,
        updateArticle,
        deleteArticle,
        increArticleCommentCount,
        decreArticleCommentCount,
        likeArticle,
        cancelLikeArticle
    };
}
function setLoadingArticle() {
    const { subscribe, set } = writable(false);

    // 데이터를 가져올 때, 잠금
    const turnOnLoading = () => {
        set(true);
        articlePageLock.set(true);
    }

    // 데이터를 가져왔을 때, 잠금 해제
    const turnOffLoading = () => {
        set(false);
        articlePageLock.set(false);
    }

    return {
        subscribe,
        turnOnLoading,
        turnOffLoading,
    }
}
function setAtricleContent() {
    let initValues = {
        id: "",
        userId: "",
        userEmail: "",
        content: "",
        createdAt: "",
        commentCount: 0,
        likeCount: 0,
        likeUsers: [],
    };

    const { subscribe, set } = writable({ ...initValues });

    const getArticle = async (id) => {
        try {
            const options = {
                path: `/articles/${id}`,
            }

            const getData = await getApi(options);
            set(getData);
        } catch (error) {
            alert("오류가 발생했습니다. 다시 시도해 주세요.");
        }
    }

    return {
        subscribe,
        getArticle,
    }
}
function setComments() {
    const { subscribe, update, set } = writable([]);

    const fetchComments = async (articleId) => {
        try {
            const options = {
                path: `/comments/${articleId}`
            };

            const getDatas = await getApi(options);
            set(getDatas.comments);
        } catch (error) {
            alert("오류가 발생했습니다. 다시 시도해 주세요.");
        }
    };
    const addComment = async (articleId, commentContent) => {
        const access_token = get(auth).Authorization;

        try {
            const options = {
                path: '/comments',
                data: {
                    articleId: articleId,
                    content: commentContent,
                },
                access_token: access_token,
            };

            const newData = await postApi(options);
            update(datas => [...datas, newData]);
            articles.increArticleCommentCount(articleId);
        } catch (error) {
            alert("오류가 발생했습니다. 다시 시도해 주세요.");
        }
    };
    const deleteComment = async (commentId, articleId) => {
        const access_token = get(auth).Authorization;

        try {
            const options = {
                path: "/comments",
                data: {
                    commentId: commentId,
                    articleId: articleId,
                },
                access_token: access_token,
            };

            await delApi(options);
            update(datas => datas.filter(comment => comment.id !== commentId));
            articles.decreArticleCommentCount(articleId);
            alert("댓글이 삭제되었습니다.");
        } catch (error) {
            alert("오류가 발생했습니다. 다시 시도해 주세요.");
        }
    };

    return {
        subscribe,
        fetchComments,
        addComment,
        deleteComment,
    }
}
function setAuth() {
    let initValues = {
        id: "",
        email: "",
        Authorization: "", // access_token
    }

    // ...initValues : 자바스크립트 스프레드
    // 참조가 아닌 복제 -> 나중에 초기화시킬 일 있을 때를 위해 복제
    const { subscribe, set, update } = writable({ ...initValues });

    // 서버 호출 메소드는 기본적으로 비동기 호출을 사용
    // refresh 토큰을 이용해 access_token을 요청하는 메소드
    // 코드상으론 보이지 않지만, 클라이언트의 브라우저에 refresh_token이 저장되어 있음
    // 서버는 이를 읽어들여 처리
    const refresh = async () => {
        try {
            const authenticationUser = await postApi({ path: "/auth/refresh" });
            set(authenticationUser);
            isRefresh.set(true);
        } catch (error) {
            auth.resetUserInfo();
            // 리프레시 토큰이 비정상 -> 더 이상 refresh 호출 x
            isRefresh.set(false);
        }
    }
    const resetUserInfo = () => set({ ...initValues });
    const login = async (email, password) => {
        try {
            const options = {
                path: "/auth/login",
                data: {
                    email: email,
                    pwd: password,
                }
            };
            const result = await postApi(options);
            set(result);
            isRefresh.set(true);
            router.goto('/');
        }
        catch (error) {
            alert('오류가 발생했습니다. 로그인을 다시시도해 주세요.')
        }
    }
    const logout = async () => {
        try {
            const options = {
                path: "/auth/logout",
            }

            await delApi(options);
            set({ ...initValues });
            isRefresh.set(false);
            // router.goto("/");
            articlesMode.changeMode(ALL);
        } catch (error) {
            alert("오류가 발생했습니다. 다시 시도해주세요");
        }
    }
    const register = async (email, pwd) => {
        try {
            const options = {
                path: "/auth/register",
                data: {
                    email: email,
                    pwd: pwd,
                }
            }

            await postApi(options);
            alert("가입이 완료되었습니다.");
            router.goto("/login");
        } catch (error) {
            alert("오류가 발생했습니다. 다시 시도해주세요");
        }
    }

    return {
        subscribe,
        refresh,
        resetUserInfo,
        login,
        logout,
        register,
    }
}
function setArticlesMode() {
    const { subscribe, update, set } = writable(ALL);

    // 모드가 바뀌면 상황에 맞는 글을 불러옴
    const changeMode = async (mode) => {
        set(mode);
        articles.resetArticles();
        await articles.fetchArticles();
    }

    return {
        subscribe,
        changeMode,
    }
}
function setIsLogin() {
    const checkLogin = derived(auth, $auth => $auth.Authorization ? true : false);
    return checkLogin;
}

export const currentArticlesPage = setCurrentArticlesPage();
export const articles = setArticles();
export const articlePageLock = writable(false);
export const loadingArticle = setLoadingArticle();
export const articleContent = setAtricleContent();
export const comments = setComments();
export const auth = setAuth();
export const articlesMode = setArticlesMode();
export const isLogin = setIsLogin();
// refresh 요청을 보낼 필요가 있는지를 나타내는 상태값
// 로그아웃하거나, 만료 시 리프래시를 보낼 필요가 없기 때문
export const isRefresh = writable(false);