<?php
/**
 * @author Kondaurov
 */

namespace common\components;

use common\exceptions\InvalidInstanceException;
use common\forms\LoginForm;
use common\models\Auth;
use common\models\DiscountSettings;
use Yii;
use yii\base\ErrorException;
use common\models\User as UserModel;

/**
 * Class User
 * @package common\components
 * @property \common\models\User $identity
 * @property array $defaultAddress
 * @property array $accessRules
 * @property \market\components\compare\CompareCollection $compare
 * @property \common\components\Position $position
 * @property \common\models\DiscountSettings $discountSettings
 */
class User extends \yii\web\User
{
    const ACTIVATION_VIA_EMAIL = 'email';
    const ACTIVATION_VIA_SMS = 'sms';

    const EXPIRE_TIME = 24 * 30 * 3600;

    /**
     * @var \market\components\compare\CompareCollection
     */
    public $compareClass = 'market\components\compare\CompareCollection';

    private $_compare;

    /**
     * @var \market\components\Bookmarks
     */
    public $bookmarkClass = 'market\components\Bookmarks';

    private $_bookmark;

    /**
     * @var array
     */
    private $positionClass = 'common\components\Position';

    private $_position;

    /**
     * @var \common\models\DiscountSettings
     */
    private $_discountSettings;

    public function init()
    {
        parent::init();
    }


    /**
     * send sms or mail with activation of account
     * @param \common\models\User $user
     * @return string
     * @throws ErrorException
     */
    public function sendActivation(\common\models\User $user)
    {
        if (!empty($user->phone)) {
            $this->sendActivationSms($user);
            return self::ACTIVATION_VIA_SMS;
        } else {
            return $this->_email($user);
        }
    }

    /**
     * activation via email
     * @param $token
     * @param string $type
     * @return bool|\common\models\User
     */
    public function activateEmail($token)
    {
        /**
         * @todo перенести в таблицу юзера
         */
        $email = \Yii::$app->security->decryptByKey($token, \Yii::$app->params['userKey']);
        $user = \common\models\User::find()->email($email)->one();
        if ($user) {
            return $this->_activate($user);
        }
        return false;
    }

    /**
     * activation via sms
     * @param \common\models\User $user
     * @param $code
     * @return bool|\common\models\User
     */
    public function activatePhone(\common\models\User $user, $code)
    {
        if ($user->sms_code == $code) {
            return $this->_activate($user);
        }

        return false;
    }

    /**
     * send sms with code of activation
     * @param \common\models\User $user
     * @throws ErrorException
     */
    public function sendActivationSms(\common\models\User $user)
    {
        if (!$user->getPhone()) {
            throw new ErrorException('User without phone');
        }
        /**
         * @var $sms \common\components\sms\Sender
         */
        $sms = \Yii::$app->sms;
        $code = $user->generateCode();
        return $sms->send($user->getPhone(), 'Код активации:' . $code);
    }

    public function sendPasswordResetSms(\common\models\User $user)
    {
        /**
         * @var $sms \common\components\sms\Sender
         */
        if ($user->phone) {
            $sms = \Yii::$app->sms;
            return $sms->send($user->phone, 'Ваш пароль к аккаунту изменён');
        } else {
            return false;
        }
    }

    /**
     * activate user
     * @param \common\models\User $user
     * @return bool|\common\models\User
     */
    private function _activate(\common\models\User $user)
    {
        if ($user->status == \common\models\User::STATUS_NEW) {
            $user->status = \common\models\User::STATUS_ACTIVE;
            \Yii::$app->authManager->revoke(
                \Yii::$app->authManager->getRole('nonActivated'),
                $user->getId()
            );
            if ($user->save()) {

                Auth::updateAll(
                    ['status' => Auth::STATUS_ACTIVE],
                    'user_id = :user and status = :new',
                    ['user_id' => $user->id, 'new' => Auth::STATUS_NEW]
                );

                return $user;
            }
        }

        return false;
    }

    /**
     * send mail with link of activation
     * @param \common\models\User $user
     * @return string
     */
    private function _email(\common\models\User $user, $template = 'activation-html')
    {
        /**
         * @var $mail \yii\swiftmailer\Mailer
         */
        $mail = \Yii::$app->mail;
        $key = \Yii::$app->security->encryptByKey($user->getUserEmail(), \Yii::$app->params['userKey']);
        $mail->setViewPath('@common/mail');
        $mail
            ->compose($template, ['key' => $key, 'user' => $user])
            ->setFrom([\Yii::$app->params['noreplyMail'] => 'Yotalot'])
            ->setTo($user->getUserEmail())
            ->setSubject('Активация аккаунта')
            ->send();

        return self::ACTIVATION_VIA_EMAIL;
    }

    public function sendResetToken(\common\models\User $user)
    {
        return $this->_sendResetToken($user);
    }

    private function _sendResetToken(\common\models\User $user)
    {
        /**
         * @var $mail \yii\swiftmailer\Mailer
         */

        $mail = \Yii::$app->mail;
        $key = $user->password_reset_token;
        $mail->setViewPath('@common/mail');
        $mail
            ->compose('passwordResetToken-html', ['key' => $key, 'user' => $user])
            ->setFrom([\Yii::$app->params['noreplyMail'] => 'Yotalot'])
            ->setTo($user->email)
            ->setSubject('Восстановление пароля')
            ->send();
        return true;
    }

    public function sendNewPasswordIsAccepted(\common\models\User $user, $password)
    {
        return $this->_sendNewPasswordIsAccepted($user, $password);
    }

    private function _sendNewPasswordIsAccepted(\common\models\User $user, $password)
    {
        /**
         * @var $mail \yii\swiftmailer\Mailer
         */

        $message = 'Ваш новый пароль: ' . $password;

        $mail = \Yii::$app->mail;
        $mail->setViewPath('@common/mail');
        $mail
            ->compose('request-html', [
                'message' => $message,
                'user' => $user,])
            ->setFrom([\Yii::$app->params['noreplyMail'] => 'Yotalot'])
            ->setTo($user->email)
            ->setSubject('Восстановление пароля завершено.')
            ->send();
        return true;
    }

    public function getCompare()
    {
        if (!$this->_compare) {
            $this->_compare = Yii::createObject(['class' => $this->compareClass]);
        }
        return $this->_compare;
    }

    /**
     * @return \market\components\Bookmarks
     * @throws \yii\base\InvalidConfigException
     */
    public function bookmarks()
    {
        if (!$this->isGuest) {
            if (!$this->_bookmark) {
                $this->_bookmark = Yii::createObject(['class' => $this->bookmarkClass]);
            }
        }
        return $this->_bookmark;
    }

    /**
     * @return \common\components\Position
     */
    public function getPosition()
    {
        if (!$this->_position) {
            $this->_position = Yii::createObject($this->positionClass);
            if (!$this->_position instanceof Position) {
                throw new InvalidInstanceException('Position class must be instance \common\models\Position class');
            }
            $this->_position->userId = $this->getId();
        }

        return $this->_position;
    }

    public function sendEmail(array $params)
    {
        $this->_email($params['user'], $params['template']);
    }

    public function getDiscountSettings()
    {
        if (!$this->_discountSettings) {
            $settings = DiscountSettings::find()->user($this->getId())->one();

            if (!$settings) {
                $settings = new DiscountSettings();
                $settings->user_id = $this->getId();
                $settings->save();
            }

            $this->_discountSettings = $settings;
        }

        return $this->_discountSettings;
    }

    public function isAdminAuth()
    {
        $hash = \Yii::$app->session->get('admin-auth');
        if ($hash) {
            return true;
        }
        return false;
    }

    public function validateRestUser($post)
    {
        $model = new LoginForm();
        if($model->load(['LoginForm' => $post]) && $model->login()){
            return $model;
        } else {
            return $model;
        }
    }
}
