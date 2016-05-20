<?php
/**
 *  @author Kozulyaev
 */
namespace common\models\queries\access;

use yii\db\ActiveQuery;

class RoleQuery extends ActiveQuery
{
    public function likeName($name)
    {
        $this->andWhere('name LIKE :name', ['name' => '%' . $name . '%']);
        return $this;
    }

    public function parent($id)
    {
        $this->andWhere(':id = ANY(parents)', ['id' => $id]);
        return $this;
    }

    public function englishName($name)
    {
        $this->andWhere(['english_name' => $name]);
        return $this;
    }

}