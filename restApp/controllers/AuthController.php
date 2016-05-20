<?php
/**
 *  @author Kozulyaev
 */
namespace restApp\controllers;

use common\components\rest\RestController;
use common\forms\LoginForm;
use yii\filters\auth\HttpBearerAuth;
use yii\helpers\Json;


class AuthController extends RestController
{
    public function behaviors()
    {
        $behaviors = parent::behaviors();
        $behaviors['authenticator']['class'] = HttpBearerAuth::className();
        $behaviors['authenticator']['except'] = ['index', 'view'];
        return $behaviors;
    }

    public function actionIndex()
    {
        $body = \Yii::$app->request->getRawBody();
        $data = Json::decode($body);
        $get = \Yii::$app->request->get();
        if(empty($data) && $get['logout']){
            \Yii::$app->user->logout();
            return [
                'status' => true
            ];
        }
        $model = new LoginForm();
        if ($model->load($data['form'], '') && $model->login()) {
            /**
             * @var $user \common\models\User
             */
            $user = \Yii::$app->user->getIdentity();
            $token = \Yii::$app->user->identity->getAuthKey();
            return [
                'user' => [
                    'id' => $user->id,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'email' => $user->email,
                ],
                'token' => $token
            ];
        } else {
            return [
                'status' => 'error',
                'errors' => $model->errors
            ];
        }
    }

    public function actionView($id)
    {
        $get = \Yii::$app->request->get();
        $url = $get['url'];
        if(!\Yii::$app->user->isGuest) {
            return [
                'status' => true
            ];
        } else {
            return [
                'status' => false
            ];
        }
    }

    public function actionCreate($id)
    {
        $hash = \Yii::$app->security->generateRandomString(32);
        \Yii::$app->cache->set('admin:auth:'.$hash, $id, 900);
        return [
            'hash' => $hash,
            'url' => \Yii::$app->params['marketUrl'].'/user/admin-auth/'
        ];
    }
}