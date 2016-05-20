<?php
/**
 *  @author Kondaurov
 */
namespace common\models\access;
use yii\redis\ActiveRecord;

class RuleCache extends ActiveRecord
{

    public static function getDb()
    {
        return \Yii::$app->auxiliaryRedisDb;
    }

    public function rules()
    {
        return [
            [['id', 'mask', 'app', 'allow'], 'safe']
        ];
    }

    public function attributes()
    {
        return ['id', 'mask', 'app', 'allow'];
    }
}