rest.factory("rest.Auth", [
    '$resource',
    function($resource) {
        return $resource('/auth/:id', {id:'@id'}, {
            get: { method: "GET" },
            post: { method: "POST" }
        });
    }
]);