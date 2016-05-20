<?php
/**
 *  @author Kondaurov
 */
namespace common\components\actions;

use yii\base\Action;
use common\models\elastic\Address;
use yii\helpers\Json;

class AutoCompleteCity extends Action
{
    public function run($term)
    {
        $term = trim($term);
        $result = Address::find()
            ->where(['shortType' => 'г'])
            ->address($term)
            ->asArray()
            ->all();

        $result = array_map(function($address) {
            return [
                'label' => $address['_source']['address'],
                'value' => $address['_source']['addressObject'],
                'id' => $address['_source']['id']
            ];
        }, $result);

        return Json::encode($result);
    }
}