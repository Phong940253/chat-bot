const formatAMPM = (date) => {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = hours + ":" + minutes + " " + ampm;
    return strTime;
};

exports.sleepCounter = () => {
    let date = new Date();
    let now = date.getTime();
    let time = [];

    let res =
        "Bây giờ là " +
        formatAMPM(date) +
        ". Nếu bây giờ đi ngủ thì bạn nên dậy lúc ";

    for (i = 3; i <= 6; ++i) {
        let t = new Date(now + (14 + 90 * i) * 60000);
        time.push(formatAMPM(t));
        if (i != 6) res += time[i - 3] + ", ";
    }
    res +=
        "và cả " +
        time[3] +
        " để cảm thấy tỉnh táo, minh mẫn (đã tính thời gian để chìm vào giấc ngủ)";
    return res;
};

exports.wakeCounter = (match) => {
    let date = new Date(
        2021,
        6,
        22,
        match[1],
        match[2] == undefined ? 0 : match[2]
    );
    let time = [];
    let now = date.getTime();
    let res =
        "Nếu bạn muốn dậy lúc " +
        formatAMPM(date) +
        " thì bạn nên ngủ vào những giờ sau: ";

    for (i = 6; i >= 3; --i) {
        let t = new Date(now - (14 + 90 * i) * 60000);
        // console.log(t.getTime());
        time.push(formatAMPM(t));
        if (i != 3) res += time[6 - i] + ", ";
    }

    res +=
        "và cả " +
        time[3] +
        " để cảm thấy tỉnh táo, minh mẫn (đã tính thời gian để chìm vào giấc ngủ)";
    return res;
};
