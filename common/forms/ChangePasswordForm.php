<?php
namespace common\forms;

use common\components\User;
use Yii;
use yii\base\Model;

/**
 * Login form
 */
class ChangePasswordForm extends Model
{
    public $oldPassword;
    public $newPassword;
    public $newPasswordRepeat;

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['oldPassword', 'newPassword', 'newPasswordRepeat'], 'required', 'message' => 'Поле "{attribute}" должно быть заполнено'],
            ['oldPassword', 'string', 'min' => 6, 'tooShort' => 'Пароль должен состоять как минимум из {min} символов'],
            ['oldPassword', 'validatePassword'],
            ['newPassword', 'string', 'min' => 6, 'tooShort' => 'Пароль должен состоять как минимум из {min} символов'],
            ['newPasswordRepeat', 'validateNewPassword'],

        ];
    }

    public function validateNewPassword($attribute, $params)
    {
        if (!$this->hasErrors()) {
            if ($this->newPassword != $this->newPasswordRepeat) {
                $this->addError($attribute, 'Пароль несовпадает');
            }
        }
    }

    /**
     * Validates the password.
     * This method serves as the inline validation for password.
     *
     * @param string $attribute the attribute currently being validated
     * @param array $params the additional name-value pairs given in the rule
     */
    public function validatePassword($attribute, $params)
    {
        $user = \Yii::$app->user->getIdentity();
        if (!$this->hasErrors()) {
            if (!$user || !$user->validatePassword($this->oldPassword)) {
                $this->addError($attribute, 'Неккоректный пароль');
            }
        }
    }

    public function attributeLabels()
    {
        return [
            'oldPassword' => 'Старый пароль',
            'newPassword' => 'Новый пароль',
            'newPasswordRepeat' => 'Новый пароль (еще раз)'
        ];
    }

    public function preparation($post)
    {
        $user = \Yii::$app->user->getIdentity();
        \Yii::$app->cache->set('user:'.$user->getId().':changePassword', $post);
        if($user->phone){
            \Yii::$app->user->sendActivationSms($user);
            return true;
        }
        if($user->email){
            $code = $user->generateCode();
            $mail = \Yii::$app->mail;
            $mail->setViewPath('@common/mail');
            $mail->compose('changePassword', ['code' => $code, 'user' => $user])
                ->setFrom([\Yii::$app->params['noreplyMail'] => 'Yotalot'])
                ->setTo($user->email)
                ->setSubject('Смена пароля')
                ->send();
            return true;
        }

    }

    public function save()
    {
        $user = \Yii::$app->user->getIdentity();
        $user->setPassword($this->newPassword);
        if($user->save(false)) {
            return $user;
        }
    }
}
