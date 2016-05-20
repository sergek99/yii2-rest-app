<?php

namespace common\models\queries\access;
/**
 *  @author Kondaurov
 */

class RuleQuery extends \yii\db\ActiveQuery
{
    public function likeName($name)
    {
        $this->andWhere('name LIKE :name', ['name' => '%' . $name . '%']);
        return $this;
    }

    /**
     * @param array|int $id
     * @return $this
     */
    public function role($id)
    {

        $this->join('inner join', 'role_rule as rr', 'rule.id = rr.rule_id');
        if (is_array($id)) {
            $this->andWhere(['in', 'rr.role_id', $id]);
        } else if (is_string($id)) {
            $this->andWhere(['rr.role_id' => $id]);
        }
        return $this;
    }
}