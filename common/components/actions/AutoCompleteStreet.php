<?php
/**
 *  @author Kozulyaev
 */
namespace common\components\actions;

use yii\base\Action;
use common\models\elastic\Address;
use yii\helpers\Json;

class AutoCompleteStreet extends Action
{

    public function run($term, $region)
    {
        $term = trim($term);
        $result = Address::find()
            ->where(['level' => 4, 'parents' => $region])
            ->address($term)
            ->asArray()
            ->all();
        $result = array_filter($result, function($address) {
            return (bool)(count($address['_source']['parents']) > 0);
        });

        $result = array_map(function($address) {
            return [
                'label' => $address['_source']['shortType'].'. '.$address['_source']['addressObject'],
                'value' => $address['_source']['shortType'].'. '.$address['_source']['addressObject'],
                'id' => $address['_source']['id']
            ];
        }, $result);

        return Json::encode($result);
    }
}