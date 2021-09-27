/* eslint-disable no-unused-vars */
import { extend, isNode, filesListFrom, htmlToElement, bytesToSize } from "../shared/utils";
import defaults from "./defaults";

class Clippy {
    constructor(el, params) {
        this.$container = this._getElement(el);
        if (!this.$container) return;

        this.params = extend({}, defaults, params);

        // Хранилище файлов
        this._filesToUpload = new Map();
        this.messageItems = [];

        // Ограничитель срабатывания события. Safari генерирует событие при подмене файлов. Остальные браузеры этого не делают
        this.hasRemoveEvent = false;

        this._initInput();

        this._isFilesListAdded = false;
        this._createFilesList();

        if (this.params.dropArea) {
            this._initDropArea();
        }
    }

    _getElement(el, findTarget = document) {
        const element = isNode(el) ? el : findTarget.querySelector(el);
        return element;
    }

    _initInput() {
        const INPUT_PARAMS = this.params.input;

        const input = {
            $el: this._getElement(INPUT_PARAMS.el, this.$container),
        };

        if (!input.$el) {
            const error = "Инпут не найден";
            console.error(this.$container, new Error(error));
            return;
        }

        if (this.params.multi) {
            input.$el.setAttribute("multiple", "true");
        }

        if (this.params.accept && Array.isArray(this.params.accept)) {
            input.$el.setAttribute("accept", this.params.accept.join(", "));
        }

        this.input = input;

        this._initChangeListener();
    }

    _createFilesList() {
        const FILES_LIST_PARAMS = this.params.filesList;

        const filesList = {
            $el: document.createElement("ul"),
        };

        this._setClasses(filesList.$el, FILES_LIST_PARAMS.classes);

        filesList.$el.addEventListener("click", (evt) => {
            this._removeFile(evt);

            if (filesList.$el.childNodes.length === 0) {
                filesList.$el.remove();
                this._isFilesListAdded = false;
            }
        });

        this.filesList = filesList;
    }

    _initChangeListener() {
        let previousTimeStamp;
        let currentTimeStamp;

        const changeHandler = (evt) => {
            if (this.hasRemoveEvent) return;

            if (!previousTimeStamp) {
                previousTimeStamp = evt.timeStamp;
            } else {
                currentTimeStamp = evt.timeStamp;

                if (previousTimeStamp - currentTimeStamp < 200) {
                    return false;
                }
            }

            this._filesChangeHandler(this.input.$el.files);
            previousTimeStamp = 0;
            return false;
        };

        this.input.$el.addEventListener("change", changeHandler, true);
    }

    _addFilesList() {
        const FILES_LIST_PARAMS = this.params.filesList;
        let direction = this.$container;

        if (FILES_LIST_PARAMS.insert) {
            const INSERT_DIRECTION = FILES_LIST_PARAMS.direction;

            if (isNode(INSERT_DIRECTION)) {
                direction = INSERT_DIRECTION;
            } else {
                const directionElement = document.querySelector(INSERT_DIRECTION);

                if (directionElement) {
                    direction = directionElement;
                }
            }
        }

        direction[FILES_LIST_PARAMS.insert.functionType](this.filesList.$el);
        this._isFilesListAdded = true;
    }

    _createlIstItem(file) {
        if (this._includesInCurrentStore(file)) return;

        const ITEMS_PARAMS = this.params.filesList.items;
        const REMOVER_PARAMS = this.params.filesList.items.remover;
        let filesListItem;

        if (ITEMS_PARAMS.template) {
            const FILE_NAME = file.name;

            const fileName = FILE_NAME.replace(/(.*)\.(.*?)$/, "$1");
            const fileExtension = FILE_NAME.substring(
                FILE_NAME.lastIndexOf("."),
                FILE_NAME.length,
            ).slice(1);
            const fileSize = bytesToSize(file.size);

            const fileInfo = {
                name: fileName,
                extension: fileExtension,
                size: fileSize,
            };

            filesListItem = htmlToElement(ITEMS_PARAMS.template(fileInfo));
            ITEMS_PARAMS.classes = filesListItem.classList;
        } else {
            filesListItem = document.createElement("li");
            filesListItem.innerHTML = file.name;
            this._setClasses(filesListItem, ITEMS_PARAMS.classes);
        }

        const filesListItemRemoveButton = document.createElement("button");
        filesListItemRemoveButton.setAttribute("type", "button");

        this._setClasses(filesListItemRemoveButton, REMOVER_PARAMS.classes);

        if (REMOVER_PARAMS.content) {
            filesListItemRemoveButton.insertAdjacentHTML("beforeend", REMOVER_PARAMS.content);
        }

        filesListItem.appendChild(filesListItemRemoveButton);

        return filesListItem;
    }

    _setClasses(el, classes) {
        if (!isNode(el)) return;

        if (Array.isArray(classes)) {
            for (const className of classes) {
                if (className) el.classList.add(className);
            }
        } else {
            el.classList.add(classes);
        }
    }

    _includesInCurrentStore(file) {
        const currentFileName = file.name || file[0];

        if (this._filesToUpload.has(currentFileName)) {
            return true;
        }

        return false;
    }

    _removeFile(evt) {
        const ITEMS_PARAMS = this.params.filesList.items;
        const REMOVER_PARAMS = this.params.filesList.items.remover;

        const closestButton = evt.target.closest(`.${REMOVER_PARAMS.classes[0]}`);
        if (!closestButton) {
            return;
        }
        this._removeMessageItems();

        const closestListItem = evt.target.closest(`.${ITEMS_PARAMS.classes[0]}`);

        if (!closestListItem) {
            return;
        }

        for (const fileContainer of this._filesToUpload) {
            const assotiatedListItemElem = fileContainer[1].assitiatedListItem;

            if (assotiatedListItemElem === closestListItem) {
                assotiatedListItemElem.remove();
                this._filesToUpload.delete(fileContainer[0]);
            }
        }

        this.hasRemoveEvent = true;
        this._updateInputState();
    }

    _updateInputState() {
        const files = Array.from(this._filesToUpload, ([, value]) => {
            return value.file;
        });
        const newFilesList = filesListFrom(files);

        this.input.$el.files = newFilesList;
        this.hasRemoveEvent = false;
    }

    _addFile(file) {
        let assitiatedListItem;

        if (this.params.accept && !this._isAcceptedExtension(file)) {
            const error = "Файлы некорректного типа были пропущены";
            this._generateMessageItem(error, true);
            return;
        }

        if (!this._filesToUpload.get(file.name)) {
            assitiatedListItem = this._createlIstItem(file);
        } else {
            assitiatedListItem = this._filesToUpload.get(file.name).assitiatedListItem;
            const message = "Ранее добавленные файлы с такими же названиями обновлены";
            this._generateMessageItem(message);
        }
        this._filesToUpload.set(file.name, { file, assitiatedListItem });
    }

    _generateMessageItem(message, isError) {
        const PARAMS = this.params.messages;
        const ERROR_TYPE_PARAMS = this.params.messages.types.error;

        if (this.messageItems) {
            this.hasMessages = true;

            for (const messageItem of this.messageItems) {
                if (messageItem.innerHTML === message) {
                    return;
                }
            }
        }

        const messageItem = document.createElement(PARAMS.tagType);

        this._setClasses(messageItem, PARAMS.classes);

        if (isError) {
            this._setClasses(messageItem, ERROR_TYPE_PARAMS.classes);
        }

        messageItem.innerHTML = message;

        this.messageItems.push(messageItem);
        this.hasMessages = true;
    }

    _removeMessageItems() {
        this.hasMessages = false;

        if (this.messageItems) {
            for (const messageItem of this.messageItems) {
                messageItem.remove();
            }
            this.messageItems = [];
        }
    }

    _addMessageItems() {
        const INSERT_PARAMS = this.params.messages.insert;

        const directionEl = this._getElement(INSERT_PARAMS.el);

        const direction = directionEl || this.$container;

        if (this.messageItems) {
            for (const messageItem of this.messageItems) {
                direction[INSERT_PARAMS.functionType](messageItem);
            }
        }
    }

    _isAcceptedExtension(file) {
        for (const fileExtension of this.params.accept) {
            if (file.name.includes(fileExtension)) {
                return true;
            }
        }
        return false;
    }

    _updateFilesListState() {
        for (const fileContainer of this._filesToUpload) {
            const listItemElement = fileContainer[1].assitiatedListItem;

            if (isNode(listItemElement) && !this.filesList.$el.contains(listItemElement)) {
                this.filesList.$el.appendChild(listItemElement);
            }
        }
    }

    _checkFilesList() {
        if (!this._isFilesListAdded) {
            this._addFilesList();
        }
    }

    _filesChangeHandler(files) {
        if (this.hasMessages) {
            this._removeMessageItems();
        }

        for (const file of files) {
            this._addFile(file);
        }

        this._updateInputState();
        this._checkFilesList();
        this._updateFilesListState();

        if (this.hasMessages) {
            this._addMessageItems();
        }
    }

    _initDropArea() {
        const params = this.dropArea;
        if (!params) return;

        const dropArea = {
            $el: this._getElement(params.el),
        };
        if (dropArea.$el) return;

        // Предотвращаем события по-умолчанию
        ["dragenter", "dragover", "drop"].forEach((eventName) => {
            dropArea.$el.addEventListener(eventName, (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
            });
        });

        // Добавляем обработчики
        dropArea.$el.addEventListener("drop", (evt) => {
            const dt = evt.dataTransfer;
            const files = dt.files;
            this._filesChangeHandler(files);
        });

        extend(this, dropArea);
    }
}
