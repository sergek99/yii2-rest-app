<?php
/**
 *  @author Kozulyaev
 */
namespace common\models\queries\access;

use yii\redis\ActiveQuery;
use yii\redis\ActiveRecord;

class RoleCacheQuery extends ActiveQuery
{
    public function englishName($name)
    {
        $this->andWhere(['english_name' => $name]);
        return $this;
    }

}