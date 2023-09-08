import axios from "axios";

const send = async ({ method = "", path = "", data = {}, access_token = "" } = {}) => {
    const commonUrl = "http://localhost:3000";
    const url = commonUrl + path;

    const headers = {
        "Access-Control-Allow-Origin": commonUrl,
        "Access-Control-Allow-Credentials": true,
        "content-type": "application/json;charset=UTF-8",
        "accept": "application/json",
        "SameSite": "None", // 쿠키를 사용하기 위해
        "Authorization": access_token,
    }

    const options = {
        method,
        url,
        headers,
        data,
        // 포트가 달라 프론트와 백엔드가 도메인이 다름
        // 이런 경우, 꼭 밑의 옵션을 true로 설정해야 서버에서 쿠키를 작성할 수 있음
        withCredentials: true,
    }

    try {
        const response = await axios(options);
        return response;
    } catch (error) {
        throw error;
    }
}

const getApi = ({ path = "", access_token = "" } = {}) => {
    return send({ method: "GET", path, access_token });
}

const postApi = ({ path = "", data = {}, access_token = "" } = {}) => {
    return send({ method: "POST", path, data, access_token });
}

const putApi = ({ path = "", data = {}, access_token = "" } = {}) => {
    return send({ method: "PUT", path, data, access_token });
}

const deleteApi = ({ path = "", data = {}, access_token = "" } = {}) => {
    return send({ method: "DELETE", path, data, access_token });
}

export {
    getApi,
    postApi,
    putApi,
    deleteApi
}