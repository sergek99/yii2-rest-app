<?php
/**
 *  @author Kondaurov
 */
namespace restApp\modules\rest\components;

use common\components\rest\Serializer;
use common\models\access\Role;

class RolesSerializer extends Serializer
{
    /**
     * @var array
     * Example
     * [
     *      "title" => [
     *          "destination" => "product_name",
     *          "transformation" => function($value) { return "Product name of " . $value  }
     *          "include" => Serializer::ONE_SERIALIZE //default Serializer::ALWAYS
     *      ] or
     *      "title" => "product_name"
     * ]
     */
    public function columnMap()
    {
        return [
            "id" => ["destination" => "id"],
            "name" => ["destination" => "name"],
            "english_name" => ["destination" => "english_name"],
            "rules" => ["destination" => "rules"],
            "parents" => [
                "destination" => "parents",
                "transformation" => function($parents) {
                    $ids = explode(',', trim($parents, '{}'));
                    return Role::find()->andWhere(['in', 'id', $ids])->all();
                }
            ]
        ];
    }

}