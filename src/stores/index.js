// @ts-nocheck
import { writable, get, derived } from "svelte/store";
import { getApi, postApi, putApi, delApi } from "../service/api";
import { router } from "tinro";

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
        menuPopup: "",
        editMode: "",
    };

    const { subscribe, update, set } = writable({ ...initValues });

    const fetchArticles = async () => {
        // 페이지 로딩 시, 추가 로딩을 잠금
        loadingArticle.turnOnLoading();

        // get(): 다른 스토어 또는 일반 js 파일에서 스벨트의 스토어값을 가져오는 함수
        // $ 기호는 js 파일에선 사용하지 못한다.
        const currentPage = get(currentArticlesPage);
        let path = `/articles/?pageNumber=${currentPage}`;

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

    return {
        subscribe,
        fetchArticles,
        resetArticles,
    }
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
function setAtricleContent() { }
function setComments() { }
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
            router.goto("/");
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
function setArticlesMode() { }
function setIsLogin() {
    // const checkLogin = derived(auth, $auth => $auth.Authorization ? true : false)
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