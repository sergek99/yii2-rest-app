<?php

namespace common\components;

use common\components\rest\RestController;
use yii\filters\auth\HttpBearerAuth;

class AppRestController extends RestController
{

    public function behaviors()
    {
        $behaviors = parent::behaviors();
        $behaviors['authenticator']['class'] = HttpBearerAuth::className();
        return $behaviors;
    }

}