<?php
/**
 *  @author Kondaurov
 */
namespace common\helpers;

use yii\helpers\Json;
use yii\web\NotFoundHttpException;

class JsonFileHelper
{

    public static function loadFile($path)
    {
        if (!file_exists($path)) {
            throw new NotFoundHttpException();
        }

        $file = file_get_contents($path);
        return $file ? Json::decode($file) : null;
    }
}