<?php
return [
    '/auth/login' => 'index/index',
    '/logout' => 'index/index',
    '/users' => 'index/index',
    '/projects' => 'index/index',
    '/projects/<id:\w+>\/tasks' => 'index/index',


    'GET /auth/<id:\w+>' => 'auth/view',
    'POST /auth/<id:\w+>' => 'auth/create',

    [
        'class' => 'yii\rest\UrlRule',
        'prefix' => 'rest',
        'controller' => [
            'auth',
            'projects',
            'tasks',
            'users',
        ]
    ]
];