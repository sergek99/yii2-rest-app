<?php

namespace restApp\controllers;

use common\components\queue\Message;
use common\models\Facet;
use yii\base\Controller;
use yii\helpers\Json;

class IndexController extends Controller
{
    public function actionIndex()
    {
        return $this->render('index');
    }

	/**
	 * @todo Реализовать страницу оператора кол-центра, сейчас верстка
	 * @return string
	 */
	public function actionCallCenter()
	{
		return $this->render('call-center');
	}
}