<?php
/**
 * author Kozulyaev
 */

namespace common\actions;

use common\models\User;
use yii\helpers\Url;

class adminAuth extends \yii\base\Action
{
    public function run($hash)
    {
        if(\Yii::$app->cache->exists('admin:auth:'.$hash)) {
            $userId = \Yii::$app->cache->get('admin:auth:'.$hash);
            $user = User::findOne(['id'=>$userId]);
            \Yii::$app->user->login($user);
            \Yii::$app->session->set('admin-auth',$hash);
            return $this->controller->redirect(Url::toRoute('/index/index'));
        } else {
            return $this->controller->redirect(Url::toRoute('/index/login'));
        }
    }
}