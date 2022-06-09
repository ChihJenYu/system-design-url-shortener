const mapShortUrlToCode = (shortUrl) => {
    let sum = 0;
    for (let i = 0; i < shortUrl.length; i++) {
        sum += shortUrl.charCodeAt(i);
    }
    return sum;
};

module.exports = { mapShortUrlToCode };
