<?php
namespace common\models\queries;

use common\components\SoftDeleteQuery;
use yii\db\ActiveQuery;

class ProjectQuery extends ActiveQuery
{
    use SoftDeleteQuery;

    
}