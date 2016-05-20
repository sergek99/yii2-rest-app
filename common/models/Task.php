<?php
namespace common\models;

use common\models\behaviors\SoftDelete;
use common\models\queries\TaskQuery;
use Yii;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;

class Task extends ActiveRecord
{

    private $_comment;
    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'tasks';
    }

    public function rules()
    {
        return [
            [['name', 'date_start', 'date_end', 'user_id', 'project_id', 'status','description'], 'required'],
            ['comment', 'safe']
        ];
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
        return new TaskQuery(get_called_class());
    }

    public function getProject()
    {
        return $this->hasOne(Project::className(), ['id' => 'project_id']);
    }

    public function getUser()
    {
        return $this->hasOne(User::className(), ['id' => 'user_id']);
    }

    public function setComment($value)
    {
        $this->_comment = $value;
    }

    public function getComment()
    {
        return $this->_comment;
    }

    public function beforeSave($insert)
    {
        if(!$insert && $this->oldAttributes['user_id'] != $this->user_id){
            $history = new TaskHistory();
            $history->task_id = $this->id;
            $history->comment = $this->comment;
            $history->old_value = $this->oldAttributes['user_id'];
            $history->new_value = $this->user_id;

            $history->save();
        }
        return parent::beforeSave($insert);
    }
}
