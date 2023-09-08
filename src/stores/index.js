// @ts-nocheck
import { writable, get, derived } from "svelte/store";
import { getApi, postApi, putApi, delApi } from "../service/api";
import { router } from "tinro";

function setCurrentAtriclesPage() { }
function setArticles() { }
function setLoadingArticle() { }
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

export const currentAtriclesPage = setCurrentAtriclesPage();
export const articles = setArticles();
export const loadingArticle = setLoadingArticle();
export const articleContent = setAtricleContent();
export const comments = setComments();
export const auth = setAuth();
export const articlesMode = setArticlesMode();
export const isLogin = setIsLogin();
// refresh 요청을 보낼 필요가 있는지를 나타내는 상태값
// 로그아웃하거나, 만료 시 리프래시를 보낼 필요가 없기 때문
export const isRefresh = writable(false);