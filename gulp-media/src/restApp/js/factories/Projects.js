rest.factory("rest.Projects",
    function($resource) {
        return $resource('/rest/projects/:projectId', { projectId: '@projectId' }, {
            get: { method: "GET" },
            create: { method: "POST" },
            update: { method: "PUT" },
            delete: { method: "DELETE" }
        });
    }
);