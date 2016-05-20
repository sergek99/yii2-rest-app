<?php
/**
 *  @author Kozulyaev
 */
namespace common\models\access;

use yii\redis\ActiveRecord;

class RoleRuleCache extends ActiveRecord
{

    public static function getDb()
    {
        return \Yii::$app->auxiliaryRedisDb;
    }

    public function rules()
    {
        return [
            [['id', 'role_id', 'rule_id'], 'safe']
        ];
    }

    public function attributes()
    {
        return ['id', 'role_id', 'rule_id'];
    }

    public function getRule()
    {
        return $this->hasOne(RuleCache::className(), ['id' => 'rule_id']);
    }

}