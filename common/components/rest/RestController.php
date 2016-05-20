<?php
namespace common\components\rest;

use yii\web\Response;
/**
 *  @author Kondaurov
 */
class RestController extends \yii\rest\Controller
{
    public function behaviors()
    {
        $behaviors = parent::behaviors();
        $behaviors['contentNegotiator']['formats']['text/html'] = Response::FORMAT_JSON;
        return $behaviors;
    }
}
