<?php
namespace common\models\queries;

use common\components\SoftDeleteQuery;
use yii\db\ActiveQuery;

class TaskQuery extends ActiveQuery
{
    use SoftDeleteQuery;

    public function project($projectId)
    {
        $this->andWhere(['project_id' => $projectId]);
        return $this;
    }
}