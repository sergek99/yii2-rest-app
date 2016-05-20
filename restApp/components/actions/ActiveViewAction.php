<?php
/**
 *  @author Kozulyaev
 */
namespace restApp\components\actions;

use yii\base\Action;
use yii\web\NotFoundHttpException;

class ActiveViewAction extends Action
{
    /**
     * @var \yii\db\BaseActiveRecord
     */
    public $modelClass;

    public $view;

    public function run()
    {
        $id = \Yii::$app->request->get('id', 0);
        $model = $this->modelClass;
        $item = $model::findOne([$id]);

        if(!$item) {
            throw new NotFoundHttpException('Object not found #'.$id);
        }

        return $this->controller->render($this->view, [
            'model' => $item,
        ]);
    }

}