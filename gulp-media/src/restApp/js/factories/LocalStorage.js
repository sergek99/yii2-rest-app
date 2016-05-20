rest.factory("rest.LocalStorage", [
    function() {
        return {
            set: function(key, value) {
                window.localStorage.setItem(key, value);
            },
            get: function(key) {
                return window.localStorage.getItem(key);
            },
            setObject: function(key, value) {
                window.localStorage.setItem(key, JSON.stringify(value));
            },
            getObject: function(key) {
                return JSON.parse(window.localStorage.getItem(key));
            },
            remove: function(key) {
                window.localStorage.removeItem(key);
            }
        }
    }
]);