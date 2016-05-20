<?php
/**
 * author Kozulyaev
 */

namespace common\actions;

class Preview extends \yii\base\Action
{
    public function run($hash)
    {
        if(\Yii::$app->cache->exists('preview:'.$hash)) {
            $page = \Yii::$app->cache->get('preview:'.$hash);
            return $this->controller->render('preview',
                [
                    'title' => $page['title'],
                    'body' => $page['body'],
                ]
            );
        }
    }
}