<?php
/**
 *  @author Kozulyaev
 */
namespace common\models\access;

use common\models\queries\access\RuleQuery;
use yii\db\ActiveRecord;

/**
 * Class Rule
 * @package common\models\access
 * @property string $name
 * @property string $mask
 * @property string $app
 * @property boolean $allow
 */
class Rule extends ActiveRecord
{

    const APP_MARKET = 'market';
    const APP_ADMIN = 'admin';
    const APP_STORE = 'store';
    const APP_JOB = 'job';

    public function rules()
    {
        return [
            [['name', 'mask', 'app', 'allow'], 'required']
        ];
    }

    public static function find()
    {
        return new RuleQuery(get_called_class());
    }

    public function getRoles()
    {
        return $this->hasMany(Role::className(), ['id' => 'role_id'])
            ->viaTable('rule_role', ['rule_id' => 'id'])
            ;
    }
}