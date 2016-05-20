<?php
/**
 *  @author Kozulyaev
 */
namespace restApp\modules\rest\components;

use common\components\rest\Serializer;

class FacetsSerializer extends Serializer
{
    /**
     * @var array
     */
    public function columnMap()
    {
        return [
            "id" => ["destination" => "id"],
            "lastname" => ["destination" => "lastname"],
            "status" => ["destination" => "status"],
            "firstname" => ["destination" => "firstname"],
            "email" => ["destination" => "email"],
            "phone" => ["destination" => "phone"],
            "roles" => ["destination" => "roles"],
            "patronymic" => ["destination" => "patronymic"],
            "created_at" => ["destination" => "created_at"],
        ];
    }

}