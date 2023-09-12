import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime"; // 상대 시간
import utc from "dayjs/plugin/utc"; // utc 포멧 형태
import "dayjs/locale/ko"; // 언어 설정

function dateView(date) {
    dayjs.extend(utc);
    dayjs.locale("ko");
    dayjs.extend(relativeTime);

    return dayjs().to(dayjs(date).utc().format("YYYY-MM-DD HH:mm:ss"));
}

export default dateView;
