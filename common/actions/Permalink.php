<?php
/**
 * author Kozulyaev
 */

namespace common\actions;

use common\models\StaticPages;
use yii\web\NotFoundHttpException;

class Permalink extends \yii\base\Action
{
    public function run($id)
    {
        $page = StaticPages::find()
            ->andWhere(['id'=>$id])
            ->asArray()
            ->one();
        if($page) {
            return $this->controller->render('preview',
                [
                    'title' => $page['title'],
                    'body' => $page['body'],
                ]
            );
        } else {
            throw new NotFoundHttpException;
        }
    }
}