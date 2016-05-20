rest.factory("rest.Tasks",
    function($resource) {
        return $resource('/rest/tasks/:taskId', { taskId: '@taskId' }, {
            get: { method: "GET" },
            create: { method: "POST" },
            update: { method: "PUT" },
            delete: { method: "DELETE" }
        });
    }
);