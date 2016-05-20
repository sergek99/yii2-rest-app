<?php
/**
 * @author Kozulyaev
 */
namespace console\models\queries;

use yii\db\ActiveQuery;

class RuleParamParseQuery extends ActiveQuery
{
    public function param($id)
    {
        $this->andWhere(['param_id' => $id]);
        return $this;
    }

    public function category($id)
    {
        $this->andWhere(['category_id' => $id]);
        return $this;
    }
}