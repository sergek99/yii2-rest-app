<?php
/**
 * @author Kozulyaev
 */
namespace common\forms;

use common\models\Banners as Banner;
use common\models\User;
use yii\base\Model;

class UserEditForm extends Model
{

    /**
     * @var \yii\web\UploadedFile
     */
    public $avatar;

    public $id;
    public $status;
    public $password_hash;
    public $sms_code;
    public $sms_send_at;
    public $auth_key;
    public $password_reset_token;
    public $created_at;
    public $updated_at;
    public $deleted;

    public $lastname;
    public $firstname;
    public $patronymic;

    public $birthday;
    public $email;
    public $phone;

    public function rules()
    {
        return [
            ['avatar', 'file', 'extensions' => 'png,jpg,gif', 'message' => 'Изображение должно быть png, jpg, gif'],
            [['lastname', 'firstname', 'patronymic', 'birthday'], 'string'],
            ['email', 'email', 'message' => '{attribute} не валидный e-mail адрес'],
            [
                'phone', 'match',
                'pattern' => '/\+([0-9]{11})/',
                'message' => 'Номер телефона должен быть в формате +79001234567'
            ],
            [
                'phone', 'string',
                'max' => 12,
                'tooLong' => 'Номер телефона должен быть в формате +79001234567',
            ],
            ['birthday', 'date', 'format' => 'd.M.yyyy'],
            ['birthday', 'dateValidate'],
            [
                'email', 'unique', 'skipOnEmpty' => true,
                'targetClass' => User::className(), 'targetAttribute' => 'email',
                'message' => 'Почта уже есть в нашей базе',
            ],
            [
                'phone', 'unique', 'skipOnEmpty' => true,
                'targetClass' => User::className(), 'targetAttribute' => 'phone',
                'message' => 'Телефон уже есть в нашей базе',
            ],
        ];
    }

    public function dateValidate($attribute)
    {
        if (!$this->hasErrors()) {
            $birthday = strtotime($this->birthday);
            $now = time();
            $diff = abs($now - $birthday);
            $years = floor($diff / (365 * 60 * 60 * 24));
            if ($birthday > $now) {
                $this->addError($attribute, 'Дата рождения не может быть больше текущей даты');
            }
            if ($years < 12) {
                $this->addError($attribute, 'Вам должно быть больше или равно 12 лет');
            }
        }
    }

    public function edit()
    {
        $user = \Yii::$app->user->getIdentity();
        if (file_exists(\Yii::$app->params['userAvatarPath'] . '/' . $user->getId()) == false) {
            mkdir(\Yii::$app->params['userAvatarPath'] . '/' . $user->getId(), 0766);
        }

        if ($this->avatar != '') {
            $this->avatar->saveAs(
                \Yii::$app->params['userAvatarPath'] . '/' . $user->getId() . '/'
                . $this->avatar->baseName
                . '.'
                . $this->avatar->extension
            );
        }
        if ($this->avatar != '') {
            $user->avatar = $this->avatar->baseName . '.' . $this->avatar->extension;
        }
        $user->lastname = $this->lastname;
        $user->firstname = $this->firstname;
        $user->patronymic = $this->patronymic;
        $user->birthday = strtotime($this->birthday);

        return $user->save() ? $user : false;
    }

}