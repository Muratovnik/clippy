/* eslint-disable no-restricted-properties */
function isObject(o) {
    return (
        typeof o === "object" &&
        o !== null &&
        o.constructor &&
        Object.prototype.toString.call(o).slice(8, -1) === "Object"
    );
}

function isNode(node) {
    if (typeof window !== "undefined" && typeof window.HTMLElement !== "undefined") {
        return node instanceof HTMLElement;
    }
    return node && (node.nodeType === 1 || node.nodeType === 11);
}

// Расширяет целевой объект. Не переписывает уже существующие свойства
function extend(...args) {
    const to = Object(args[0]);
    const noExtend = ["__proto__", "constructor", "prototype"];
    for (let i = 1; i < args.length; i += 1) {
        const nextSource = args[i];
        if (nextSource !== undefined && nextSource !== null && !isNode(nextSource)) {
            const keysArray = Object.keys(Object(nextSource)).filter(
                (key) => noExtend.indexOf(key) < 0,
            );
            for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
                const nextKey = keysArray[nextIndex];
                const desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                if (desc !== undefined && desc.enumerable) {
                    if (isObject(to[nextKey]) && isObject(nextSource[nextKey])) {
                        if (nextSource[nextKey].__swiper__) {
                            to[nextKey] = nextSource[nextKey];
                        } else {
                            extend(to[nextKey], nextSource[nextKey]);
                        }
                    } else if (!isObject(to[nextKey]) && isObject(nextSource[nextKey])) {
                        to[nextKey] = {};
                        if (nextSource[nextKey].__swiper__) {
                            to[nextKey] = nextSource[nextKey];
                        } else {
                            extend(to[nextKey], nextSource[nextKey]);
                        }
                    } else {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
    }
    return to;
}

/**
 * @params {File[]} массив файлов для создания нового FilesList
 * @return {FileList}
 */
function filesListFrom(files) {
    const filesList = new ClipboardEvent("").clipboardData || new DataTransfer();

    for (let i = 0; i < files.length; i++) {
        filesList.items.add(files[i]);
    }

    return filesList.files;
}

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */

function htmlToElement(html) {
    const template = document.createElement("template");
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

/**
 * @param {String} HTML representing any number of sibling elements
 * @return {NodeList}
 */
function htmlToElements(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    return template.content.childNodes;
}

/**
 * @params {Number(bytes)} Принимает число байтов
 * @return {String}
 */

function bytesToSize(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const c = decimals < 0 ? 0 : decimals;

    const indexOfUnit = Math.floor(Math.log(bytes) / Math.log(1024));
    const numberOfSize = parseFloat((bytes / Math.pow(1024, indexOfUnit)).toFixed(c));
    const units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const result = `${numberOfSize} ${units[indexOfUnit]}`;
    return result;
}

export { extend, isNode, isObject, filesListFrom, htmlToElement, htmlToElements, bytesToSize };
