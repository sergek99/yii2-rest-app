<?php
/**
 * @author Kondaurov
 */
namespace common\models\access;

use common\helpers\ExtArrayHelper;
use common\models\queries\access\RoleQuery;
use common\models\User;
use yii\db\ActiveRecord;

/**
 * Class Role
 * @package common\models\access
 * @property string $name
 * @property string $english_name
 */
class Role extends ActiveRecord
{
    const ANONYM = 'anonym';
    const ADMIN = 'admin';
    const USER = 'user';
    const NON_ACTIVATED = 'nonActivated';
    const BOT = 'bot';

    const SCENARIO_INIT = 'init';

    public static $reservedNames = [
        'anonym', 'admin', 'user', 'nonActivated', 'bot'
    ];

    public function scenarios()
    {
        return ExtArrayHelper::merge(
            parent::scenarios(),
            [self::SCENARIO_INIT => ['id', 'parents', 'name', 'english_name']]
        );
    }

    private $_allChildren;

    public function rules()
    {
        return [
            [['parents'], 'default', 'value' => '{0}'],
            [['name', 'english_name', 'parents'], 'required'],
            [['english_name'], 'notReservedName', 'except' => self::SCENARIO_INIT],
            [
                ['english_name'],
                'match',
                'pattern' => '/^([a-zA-Z0-9\-\.\_])*$/',
                'message' => 'Допустимы следующие символы: буквы латинского алфавита, точка, тире, символ подчеркивания'
            ]
        ];
    }

    public function notReservedName()
    {
        if (($this->isNewRecord ||
                isset($this->dirtyAttributes['english_name'])) &&
            in_array($this->english_name, self::$reservedNames)
        ) {
            $this->addError('english_name', 'Имя на английском входит в список зарезервированных');
        }
    }

    public function beforeDelete()
    {
        return in_array($this->english_name, self::$reservedNames) ? false : parent::beforeDelete();
    }



    public static function find()
    {
        return new RoleQuery(get_called_class());
    }

    public function getRules()
    {
        return $this->hasMany(Rule::className(), ['id' => 'rule_id'])
            ->viaTable('role_rule', ['role_id' => 'id']);
    }

    public function getUsers()
    {
        return $this->hasMany(User::className(), ['id' => 'user_id'])
            ->viaTable('user_role', ['role_id' => 'id']);
    }

    /**
     * @return array return all children roles
     */
    public function getAllChildren()
    {
        if (!$this->_allChildren && $this->id) {
            $this->_allChildren = ExtArrayHelper::getColumn($this->_findAllChildren($this->id), 'id');
        }
        return $this->_allChildren;
    }

    private function _findAllChildren($id)
    {
        $result = self::find()->select('id')->parent($id)->asArray()->all();
        if ($result) {
            foreach ($result as $item) {
                $result = ExtArrayHelper::merge($result, $this->_findAllChildren($item['id']));
            }
        }

        return $result;
    }
}