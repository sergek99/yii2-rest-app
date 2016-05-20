<?php
return [
    'vendorPath' => dirname(dirname(__DIR__)) . '/vendor',
    'language' => 'ru-RU',
    'bootstrap' => ['log'],
    'components' => [
        'user' => [
            'class' => 'common\components\User',
            'identityClass' => 'common\models\User',
            'enableAutoLogin' => true,
            'identityCookie' => [
                'name' => '_identity',
                'httpOnly' => true,
                'domain' => '.sgmsoft.loc'
            ],
            'loginUrl' => ['/login'],
        ],
        'db' => [
            'class' => '\yii\db\Connection',
            'dsn' => 'mysql:host=127.0.0.1;dbname=rest-app',
            'username' => 'root',
            'password' => '!Q@W#E$R%T^Y&U*I(O)P',
            'charset' => 'utf8',
            'enableSchemaCache' => false
        ],
        'cache' => [
            'class' => 'yii\caching\FileCache',
        ],
        'session' => [
            'class' => 'yii\web\DbSession',
            'cookieParams' => [
                'domain' => '.sgmsoft.loc',
            ]
        ],
        'authManager' => [
            'class' => '\common\access\AuthManager'
        ],
        'assetManager' => [
            'class' => '\common\components\GulpAssetsManager',
            'gulpBundleFile' => dirname(dirname(__DIR__)) . '/gulp-media/bundles.json',
            'bundles' => [
                'yii\web\JqueryAsset' => [
                    'js' => []
                ]
            ]
        ],
        'log' => [
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['error', 'warning']
                ]
            ]
        ]
    ],
    'modules' => [
        'rest' => 'restApp\modules\rest\Module',
    ]
];
