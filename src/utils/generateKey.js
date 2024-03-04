const key = (name) => {
    let result = "";
    const kata = name.split(/[.,_\-\s]/);
    if (kata.length > 1) {
        kata.forEach((k) => {
            if (k !== "") {
                result += k[0].toUpperCase();
            }
        });
    } else {
        result = kata[0].slice(0, 3).toUpperCase();
    }
    return result;
};

export { key };
