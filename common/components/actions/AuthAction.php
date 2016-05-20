<?php

namespace common\components\actions;

use yii\web\Cookie;

class AuthAction extends \yii\authclient\AuthAction
{
    public function run()
    {
        $referer = \Yii::$app->request->get('backUrl') ? \Yii::$app->request->get('backUrl') : \Yii::$app->request->referrer;
        if (isset($_GET['backUrl'])) { //hot fix
            unset($_GET['backUrl']);
        }
        \Yii::$app->response->cookies->add(new Cookie([
                'name' => 'referer',
                'value' => $referer
            ]
        ));
        return parent::run();
    }

}
