<?php
namespace common\models;

use common\models\behaviors\SoftDelete;
use common\models\queries\TaskHistoryQuery;
use Yii;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;

class TaskHistory extends ActiveRecord
{
    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'tasks_history';
    }

    /**
     * @inheritdoc
     */
    public function behaviors()
    {
        return [
            TimestampBehavior::className(),
            SoftDelete::className()
        ];
    }

    public static function find()
    {
        return new TaskHistoryQuery(get_called_class());
    }

    public function getOldValue()
    {
        return $this->hasOne(User::className(), ['id' => 'old_value']);
    }

    public function getNewValue()
    {
        return $this->hasOne(User::className(), ['id' => 'new_value']);
    }
}
