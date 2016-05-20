<?php
/**
 *  @author Kozulyaev
 */
namespace common\components\actions;

use yii\base\Action;
use common\models\elastic\Address;
use yii\helpers\Json;

class AutoCompleteRegion extends Action
{
    public function run($term)
    {
        $term = trim($term);
        $result = Address::find()
            ->where(['level' => 1])
            ->address($term)
            ->asArray()
            ->all();

        $result = array_map(function($address) {
            return [
                'label' => $address['_source']['address'],
                'value' => $address['_source']['address'],
                'id' => $address['_source']['id'],
                'shortType' => $address['_source']['shortType'],
            ];
        }, $result);

        return Json::encode($result);
    }
}