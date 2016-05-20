<?php

$config = [
    'components' => [
        'request' => [
            // !!! insert a secret key in the following (if it is empty) - this is required by cookie validation
            'cookieValidationKey' => 'fGNeVfONu2ugCf1ksd61MTcunNDFViNx',
        ],
    ],
];

//if (!YII_ENV_TEST) {
//    // configuration adjustments for 'dev' environment
//    $config['bootstrap'][] = 'debug';
//    $config['modules']['debug'] = 'yii\debug\Module';
//    $config['modules'] =[
//        'debug' => [
//            'class' => 'yii\\debug\\Module',
//            'panels' => [
//                'elasticsearch' => [
//                    'class' => 'yii\\elasticsearch\\DebugPanel',
//                ],
//            ],
//        ],
//        [
//            'yii\debug\Module'
//        ]
//    ];
////    $config['bootstrap'][] = 'gii';
////    $config['modules']['gii'] = 'yii\gii\Module';
//}

return $config;