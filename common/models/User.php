<?php
namespace common\models;

use common\models\access\Role;
use common\models\behaviors\SoftDelete;
use common\models\queries\UserQuery;
use Yii;
use yii\base\NotSupportedException;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;
use yii\web\IdentityInterface;

/**
 * User model
 *
 * @property int $id
 * @property string $username
 * @property string $firstname
 * @property string $lastname
 * @property string $partonymic
 * @property string $phone
 * @property string $auth_key
 * @property string $password_hash
 * @property string $password_reset_token
 * @property string $email
 * @property int $birthday
 * @property \common\models\UserAddress[] $addresses
 * @property \common\models\access\Role[] $roles
 * @property int $status
 */
class User extends ActiveRecord implements IdentityInterface
{

    use \common\components\CascadeDelete;

    const STATUS_NEW = 0;
    const STATUS_ACTIVE = 1;
    const STATUS_BOT = 2;

    public $enableAutoLogin;
    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'users';
    }

    public static function relations()
    {
        return [
            [Auth::className(), 'id' => 'user_id'],
            [RequestDiscount::className(), 'id' => 'user_id'],
            ['user_role', 'id' => 'user_id'],
            [UserAddress::className(), 'id'=>'user_id'],
            [Compare::className(), 'id'=>'user_id'],
            [Bookmark::className(), 'id'=>'user_id'],
        ];
    }

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['lastname', 'firstname'], 'required'],
            [['email'], 'email'],
            ['status', 'default', 'value' => self::STATUS_NEW],
            ['status', 'in', 'range' => [self::STATUS_ACTIVE, self::STATUS_NEW, self::STATUS_BOT]],
            [['sms_code', 'sms_send_at', 'avatar'], 'safe']
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

    /**
     * @inheritdoc
     */
    public static function findIdentity($id)
    {
        return static::findOne(['id' => $id]);
    }

    /**
     * @inheritdoc
     */
    public static function findIdentityByAccessToken($token, $type = null)
    {
        return static::findOne(['auth_key' => $token]);
    }

    /**
     * @inheritdoc
     */
    public function getId()
    {
        return $this->getPrimaryKey();
    }

    /**
     * @inheritdoc
     */
    public function getAuthKey()
    {
        return $this->auth_key;
    }

    /**
     * @inheritdoc
     */
    public function validateAuthKey($authKey)
    {
        return $this->getAuthKey() === $authKey;
    }

    public function beforeSave($insert)
    {
        if ($insert) {
            $this->status = self::STATUS_NEW;
        }

        return parent::beforeSave($insert);
    }

    /**
     * Validates password
     *
     * @param string $password password to validate
     * @return boolean if password provided is valid for current user
     */
    public function validatePassword($password)
    {
        return Yii::$app->security->validatePassword($password, $this->password_hash);
    }

    /**
     * Generates password hash from password and sets it to the model
     *
     * @param string $password
     */
    public function setPassword($password)
    {
        $this->password_hash = Yii::$app->security->generatePasswordHash($password);
    }

    /**
     * @inheritdoc
     */
    public function attributeLabels()
    {
        return [
            [
                'phone' => 'Телефон',
                'password' => 'Пароль'
            ]
        ];
    }

    /**
     * Generates "remember me" authentication key
     */
    public function generateAuthKey()
    {
        $this->auth_key = Yii::$app->security->generateRandomString();
    }

    /**
     * Generates new password reset token
     */
    public function generatePasswordResetToken()
    {
        $this->password_reset_token = Yii::$app->security->generateRandomString() . '_' . time();
    }

    /**
     * Removes password reset token
     */
    public function removePasswordResetToken()
    {
        $this->password_reset_token = null;
    }

    public function generateCode()
    {
        $code = rand(10000, 99999);
        $this->sms_code = $code;
        $this->sms_send_at = time();
        $this->save();

        return $code;
    }

    public function getUserEmail()
    {
        if($this->email){
            return $this->email;
        } else {
            $email = \Yii::$app->cache->get('user:'.$this->id.':email');
            return $email;
        }
    }

    public function getPhone()
    {
        if($this->phone){
            return $this->phone;
        } else {
            $phone = \Yii::$app->cache->get('user:'.$this->id.':phone');
            return $phone;
        }
    }

    public function isBot()
    {
        return ($this->status == self::STATUS_BOT);
    }

    public static function find()
    {
        return new UserQuery(get_called_class());
    }

    public function getAddresses()
    {
        return $this->hasMany(UserAddress::className(), ['user_id' => 'id']);
    }

    public function getDefaultAddress()
    {
        return $this->hasOne(UserAddress::className(), ['user_id' => 'id'])
            ->andWhere(['default' => true]);
    }

    public function getStores()
    {
        return $this->hasMany(Store::className(), ['owner_id' => 'id']);
    }

    public function getFullName()
    {
        return $this->firstname . ' ' . $this->lastname;
    }

    public function getRoles()
    {
        return $this->hasMany(Role::className(), ['id' => 'role_id'])
            ->viaTable('user_role', ['user_id' => 'id']);
    }

    public function getComplaint()
    {
        return $this->hasMany(Complaint::className(), ['respondent_id' => 'id']);
    }

    public function isActive()
    {
        return $this->status == static::STATUS_ACTIVE;
    }
}
