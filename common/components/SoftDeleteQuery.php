<?php
/**
 *  @author Kondaurov
 */


namespace common\components;

trait SoftDeleteQuery {

    public function prepare($builder)
    {
        $this->andWhere(['deleted' => false]);
        return parent::prepare($builder);
    }
}