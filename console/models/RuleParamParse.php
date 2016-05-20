<?php
/**
 * @author Kozulyaev
 */
namespace console\models;

use common\models\behaviors\JsonColumn;
use console\models\queries\RuleParamParseQuery;
use yii\db\ActiveRecord;

class RuleParamParse extends ActiveRecord
{

    public function behaviors()
    {
        return [
            [
                'class' => JsonColumn::className(),
                'columns' => ['config']
            ]
        ];
    }
    
    public static function find()
    {
        return new RuleParamParseQuery(get_called_class());
    }
}