import * as yup from "yup";

// 폼마다 발생되는 오류들을 reduce를 이용해 한번에 모아주는 역할
// 한번에 오류가 난 폼들을 표시할 수 있기 때문에 사용
export const extractErrors = error => {
    return error.inner.reduce((acc, error) => {
        return { ...acc, [error.path]: error.message };
    }, {});
}

export const contentValidate = yup.object().shape({
    formContent: yup.string().required("내용을 입력해 주세요.").label("내용"),
});

export const loginValidate = yup.object().shape({
    formEmail: yup.string().required("이메일을 입력해 주세요.").email("이메일 형식이 잘못되었습니다.").label("이메일"),
    formPassword: yup.string().required("패스워드를 입력해주세요.").label("패스워드"),
});

export const registerValidate = yup.object().shape({
    formEmail: yup.string().required("이메일을 입력해 주세요.").email("이메일 형식이 잘못되었습니다.").label("이메일"),
    formPassword: yup.string().required("패스워드를 입력해주세요.").label("패스워드"),
    formPasswordConfirm: yup.string().required("패스워드를 입력해주세요.").oneOf([yup.ref("formPassword"), null], "패스워드와 패스워드 확인이 일치하지 않습니다.").label("패스워드 확인"),
});