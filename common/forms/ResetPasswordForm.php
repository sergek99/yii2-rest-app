<?php
namespace common\forms;

use common\models\User;
use Yii;
use yii\base\Model;

/**
 * Reset Password form
 */
class ResetPasswordForm extends Model
{
    const STATUS_SEND_EMAIL = 'send_reset_email';
    const STATUS_RESET_PASSWORD = 'reset_password';

    const PAGE_START= 0;
    const PAGE_TRUE_EMAIL = 1;
    const PAGE_ENTER_NEW_PASSWORD = 2;

    public $email;
    public $password;
    private $_email = false;

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [
                ['email'],
                'required',
                'message' => 'E-mail не может быть пустым',
                'on' => self::STATUS_SEND_EMAIL,
            ],
            ['email', 'validateEmail'],

            [
                ['password'],
                'required',
                'message' => 'Поле {attribute} не может быть пустым',
                'on' => self::STATUS_RESET_PASSWORD,
            ],
        ];
    }

    public function validateEmail($attribute, $params)
    {
        if (!$this->hasErrors()) {
            $email = $this->getEmail();
            if (!$email) {
                $this->addError($attribute, 'Неккоректный e-mail');
            }
        }
    }

    public function attributeLabels()
    {
        return [
            'email' => 'E-mail для восстановления пароля',
            'password' => 'Введите новый пароль',
        ];
    }

    public function getEmail()
    {
        if (!$this->_email) {
            $this->_email = User::find()
                ->email($this->email)
                ->one();
        }
        return $this->_email;
    }

    public function validatePasswordResetToken($token)
    {
        return User::find()
            ->passwordResetToken($token)
            ->exists();
    }

    public function resetPassword($token)
    {
        /** @var $user User */
        $user = User::find()
            ->passwordResetToken($token)
            ->one();
        if ($user) {
            $user->removePasswordResetToken();
            $user->setPassword($this->password);
            $user->save();
            Yii::$app->user->sendPasswordResetSms($user);
            Yii::$app->user->sendNewPasswordIsAccepted($user, $this->password);
            return true;
        } else {
            return false;
        }

    }

    public function sendEmail()
    {
        /** @var $user User */
        $user = $this->getEmail();
        if ($user !== null) {
            $user->generatePasswordResetToken();
            $user->save();
            Yii::$app->user->sendResetToken($user);
            return true;
        } else {
            return false;
        }
    }
}