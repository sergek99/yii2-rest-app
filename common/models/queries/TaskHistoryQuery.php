<?php
namespace common\models\queries;

use common\components\SoftDeleteQuery;
use yii\db\ActiveQuery;

class TaskHistoryQuery extends ActiveQuery
{
    use SoftDeleteQuery;

    public function task($id)
    {
        $this->andWhere(['task_id'=>$id]);
        return $this;
    }
}