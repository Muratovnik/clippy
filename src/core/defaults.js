export default {
    multi: false,
    accept: null,
    input: {
        el: ".js-clippy-input",
    },
    filesList: {
        classes: ["clippy-list"],
        items: {
            classes: ["clippy-list-item"],
            remover: {
                classes: ["clippy-list-item-remove"],
                content: null,
            },
        },
        insert: {
            functionType: "append",
        },
    },
    messages: {
        classes: ["message"],
        tagType: "div",
        insert: {
            el: null,
            functionType: "appendChild",
        },
        types: {
            error: {
                classes: ["error"],
            },
        },
    },
    dropArea: false,
};
