<?php
namespace common\forms;

use common\components\User;
use Yii;
use yii\base\Model;

/**
 * Login form
 */
class LoginForm extends Model
{
    public $login;
    public $password;
    public $remember = true;

    private $_user = false;

    private $backUrl;

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            // username and password are both required
            [['login', 'password'], 'required', 'message' => '{attribute} не может быть пустым'],
            ['login', 'validateLogin'],
            // rememberMe must be a boolean value
            ['remember', 'boolean'],
            // password is validated by validatePassword()
            ['password', 'validatePassword'],
            ['backUrl', 'safe']
        ];
    }

    public function validateLogin($attribute, $params)
    {
        if(!filter_var($this->login, FILTER_VALIDATE_EMAIL)){
            if (!preg_match("/^(\+7)(\d{3})\d{7}$/", $this->login)) {
                $this->addError($attribute, 'Поле "логин" может быть в виде email или телефон в формате +70000000000');
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
        if (!$this->hasErrors()) {
            $user = $this->getUser();
            if (!$user || !$user->validatePassword($this->password)) {
                $this->addError($attribute, 'Неккоректный логин или пароль');
            }
        }
    }

    public function attributeLabels()
    {
        return [
            'password' => 'Пароль',
            'login' => 'Логин',
            'remember' => 'Запомнить меня'
        ];
    }

    /**
     * Logs in a user using the provided username and password.
     *
     * @return boolean whether the user is logged in successfully
     */
    public function login()
    {
        if ($this->validate()) {
            return Yii::$app->user->login($this->getUser(), $this->remember ? 3600 * 24 * 30 : 0);
        } else {
            return false;
        }
    }

    /**
     * Finds user by [[phone]]
     *
     * @return \common\models\User|null
     */
    public function getUser()
    {
        if (!$this->_user) {
            $this->_user = \common\models\User::find()->phoneOrEmail($this->login)->one();
        }
        return $this->_user;
    }

    public function getBackUrl()
    {
        return $this->backUrl;
    }

    public function setBackUrl($url)
    {
        if(empty($this->backUrl)) {
            $this->backUrl = $url;
        }
    }
}
