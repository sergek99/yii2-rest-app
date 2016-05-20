<?php

namespace console\controllers;

use common\models\elastic\ProductMapping;
use yii\helpers\Console;

/**
 * @author Kozulyaev
 */
class IndexController extends \yii\console\Controller
{
    public $title = '';

    public $commands = [
        [
            'name' => 'mongo/load',
            'desc' => 'Загрузка спарсенных продуктов yandex.market.ru из mongo'
        ]
    ];

    public function options($actionID)
    {
        return [
            'title'
        ];
    }

    public function actionIndex()
    {
        $this->stdout('Available commands:' . PHP_EOL, Console::FG_YELLOW);
        foreach ($this->commands as $command) {
            $this->stdout($command['name'], Console::FG_GREEN);
            $this->stdout(' - ' . $command['desc'] . PHP_EOL);
        }

        $this->stdout(\Yii::$app->params['imgPath']);

        return $this->close();
    }

    public function close()
    {
        return self::EXIT_CODE_NORMAL;
    }

    public function actionDdd()
    {
        // Ariston PRO 15 R/3 (SG 15 OR)
        var_dump(\common\models\elastic\Product::find()->name('3Cott 5006 450W Black')->fields(['title'])->count());
    }

    public function actionTest()
    {
        $response = ProductMapping::find()->title($this->title)->all();

        foreach ($response as $model) {
            echo $model->title . ' ' . $model->score . PHP_EOL;
        }
    }
}