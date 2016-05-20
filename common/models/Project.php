<?php
namespace common\models;

use common\models\behaviors\SoftDelete;
use common\models\queries\ProjectQuery;
use Yii;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;

class Project extends ActiveRecord
{

    const STATUS_NEW = 0;
    const STATUS_ACTIVE = 1;
    const STATUS_BOT = 2;

    public $enableAutoLogin;
    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'projects';
    }

    public function rules()
    {
        return [
            [['name', 'date_start', 'date_end', 'owner', 'description'], 'required'],
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
        return new ProjectQuery(get_called_class());
    }
}
