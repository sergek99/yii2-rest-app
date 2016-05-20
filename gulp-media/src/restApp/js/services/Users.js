rest.service('rest.UsersService', [
    '$resource',
    function ($resource) {
        this.resource = $resource('/rest/users/:userId', { userId: '@id'}, {
            'edit': {method: 'PUT'},
            'create': {method: 'POST'}
        });
    }
]);
