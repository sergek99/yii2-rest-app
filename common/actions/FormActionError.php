<?php
/**
 * author Kozulyaev
 */

namespace common\actions;

use common\models\StaticPages;
use market\forms\ErrorForm;
use yii\web\NotFoundHttpException;

class FormActionError extends \yii\base\Action
{
    public function run()
    {
        $request = \Yii::$app->request;
        $model = new ErrorForm();
        if(\Yii::$app->request->isAjax) {
            $post = \Yii::$app->request->post();
            $model->load($post);
            $model->type = $post['ErrorForm']['type'];
            \Yii::$app->response->format = \yii\web\Response::FORMAT_JSON;
            if ($model->validate()) {
                if ($model->save()) {
                    return [
                        'succes' => true,
                        'message' => 'Благодарим Вас за сообщение. Мы с Вами обязательно свяжемся.',
                    ];
                }
            } else {
                return [
                    'errors' => $model->getErrors(),
                ];
            }
        } else {
            if($request->pathInfo == 'form-error') {
                $type = 'error';
            } else {
                $type = 'support';
            }
            return $this->controller->render('error-form',[
                'model' => $model,
                'type' => $type,
            ]);
        }
    }
}