<?php
/**
 * @author Kozulyaev
 */
namespace common\components;

use common\helpers\ExtArrayHelper;
use common\models\StaticPages;
use common\models\User;
use yii\web\Cookie;

class Controller extends \yii\web\Controller
{
    /**
     * @var string - layout for mobile version
     */
    public $mobileLayout = '@market/views/layouts/mobile';

    public function beforeAction($action)
    {
        //$user = User::findOne(17); \Yii::$app->user->login($user);
        if (\Yii::$app->params['engineeringWorks']) {
            echo $this->renderPartial('//system/engineeringWork');
            return false;
        }

        $before = parent::beforeAction($action);
        if (!$before) {
            return $before;
        }

        if (\Yii::$app->errorHandler->exception === null) {
            if (!\Yii::$app->user->isGuest) {
                return \Yii::$app->authManager->checkAccess(\Yii::$app->user->getId(), \Yii::$app->request->getUrl());
            } else {
                $result = \Yii::$app->authManager->checkAnonymAccess(\Yii::$app->request->getUrl());
                return $result;
            }
        }

        return true;
    }

    public function afterAction($action, $result)
    {
        $get = \Yii::$app->request->get();
        if (isset($get['device_type']) && $get['device_type'] == 'mobile') {
            \Yii::$app->session->set('device', 'mobile');
            $this->redirect(\Yii::$app->request->referrer);
        }
        if (isset($get['device_type']) && $get['device_type'] == 'desktop') {
            \Yii::$app->session->set('device', 'desktop');
            $this->redirect(\Yii::$app->request->referrer);
        }
        return parent::afterAction($action, $result);
    }

//    public function getViewPath()
//    {
//        $path = parent::getViewPath();
//        $deviceType = \Yii::$app->request->cookies->getValue('device', null);
//        if (($deviceType == 'mobile'
//                || (\Yii::$app->params['devicedetect']['isMobile'] === true
//                && \Yii::$app->params['devicedetect']['isTablet'] !== true))
//        ) {
//            $path .= DIRECTORY_SEPARATOR . \Yii::$app->params['mobileTemplateDir'];
//            $this->layout = $this->mobileLayout;
//        }
//        return $path;
//    }

    public function actionError()
    {
        $deviceType = \Yii::$app->request->cookies->getValue('device', null);
        if (($deviceType == 'mobile' || (\Yii::$app->params['devicedetect']['isMobile'] === true && \Yii::$app->params['devicedetect']['isTablet'] !== true))) {
            $this->layout = $this->mobileLayout;
            $templatePath = '//error/'.\Yii::$app->params['mobileTemplateDir'].DIRECTORY_SEPARATOR;
        } else {
            $templatePath = '//error/';
        }

        $request = \Yii::$app->request;
        $path = $request->pathInfo;
        $page = StaticPages::find()
            ->andWhere(['url' => $path])
            ->andWhere(['app' => 1])
            ->one();
        if ($page) {
            return $this->render('//index/preview',
                [
                    'title' => $page->title,
                    'body' => $page->body,
                ]
            );
        }

        $exception = \Yii::$app->errorHandler->exception;

        if ($exception != null) {
            switch ($exception->statusCode) {
                case 403:
                    if (\Yii::$app->user->isGuest) {
                        return $this->redirect(ExtArrayHelper::merge(\Yii::$app->user->loginUrl, ['backUrl' => \Yii::$app->request->url]));
                    } else {
                        return $this->render($templatePath.'403');
                    }
                case 404:
                    return $this->render($templatePath.'404');
                default:
                    if (YII_DEBUG) {
                        return $this->renderFile(\Yii::$app->errorHandler->errorView, ['exception' => $exception, 'handler' => \Yii::$app->getErrorHandler()]);
                    } else {
                        return $this->render($templatePath.'error', ['exception' => $exception]);
                    }
            }
        }
    }
}
