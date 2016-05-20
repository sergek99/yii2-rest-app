<?php
/**
 *  @author Kondaurov
 */
namespace common\models\access;

use common\models\queries\access\RoleCacheQuery;
use yii\redis\ActiveRecord;

class RoleCache extends ActiveRecord
{

    public static function getDb()
    {
        return \Yii::$app->auxiliaryRedisDb;
    }

    public function rules()
    {
        return [
            [['id', 'name', 'english_name', 'patterns'], 'safe']
        ];
    }

    public static function find()
    {
        return new RoleCacheQuery(get_called_class());
    }

    public function attributes()
    {
        return [
            'id', 'name', 'english_name', 'patterns'
        ];
    }

    public function getRules()
    {
        $rules = [];

        if ($this->rulesRelation) {
            foreach ($this->rulesRelation as $relation) {
                array_push($rules, $relation->rule);
            }
        }

        return $rules;
    }

    public function getRulesRelation()
    {
        return $this->hasMany(RoleRuleCache::className(), ['role_id' => 'id'])->with('rule');
    }
}