<?php
$params = array_merge(
    require(__DIR__ . '/../../common/config/params.php'),
    require(__DIR__ . '/../../common/config/params-local.php'),
    require(__DIR__ . '/params.php'),
    require(__DIR__ . '/params-local.php')
);

return [
    'id' => 'admin',
    'name' => 'restApp',
    'basePath' => dirname(__DIR__),
    'controllerNamespace' => 'restApp\controllers',
    'defaultRoute' => 'index',
    'components' => [
        'urlManager' => [
            'enablePrettyUrl' => true,
            'showScriptName' => false,
            'rules' => require 'urls.php',
        ],
        'request' => [
            'class' => '\yii\web\Request',
            'parsers' => [
                'rest/request-with-file' => '\common\components\PutFileParser'
            ]
        ],
        'errorHandler' => [
            'errorAction' => 'index/index'
        ]
    ],
    'modules' => [
        'rest' => 'restApp\modules\rest\Module',
    ],
    'params' => $params,

];