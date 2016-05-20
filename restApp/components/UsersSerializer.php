<?php

namespace restApp\components;

use common\components\rest\Serializer;

class UsersSerializer extends Serializer
{
    public function columnMap()
    {
        return [
            "id" => ["destination" => "id"],
            "lastname" => ["destination" => "lastname"],
            "status" => ["destination" => "status"],
            "firstname" => ["destination" => "firstname"],
            "email" => ["destination" => "email"],
            "phone" => ["destination" => "phone"],
            "avatar" => ["destination" => "avatar"],
            "patronymic" => ["destination" => "patronymic"],
            "created_at" => ["destination" => "created_at"],
        ];
    }

}