function ActionHistory(config) {
    var self = this;
    this.__data = [];
    this.__saved = false;
    this.__config = {
        message: 'Остались несохраненные данные. Вы действительно хотите покинуть страницу?'
    };

    if(config) {
        $.extend(this.__config, config);
    }

    window.onbeforeunload = function (e) {
        return self.__data.length != 0 ? self.__config.message : null;
    };
}

ActionHistory.prototype.add = function (action) {
    this.__data.unshift(action);
    this.onAdd();
    return this;
};

ActionHistory.prototype.show = function () {
    return this.__data;
};

ActionHistory.prototype.clear = function () {
    this.__data = [];
    return this;
};

ActionHistory.prototype.cancel = function () {
    if(!this.__data.length) {
        return false;
    }
    var canceled = this.__data.shift();
    this.onCancel(canceled);
    return this;
};

ActionHistory.prototype.onAdd = function () {

};

ActionHistory.prototype.onCancel = function (action) {};