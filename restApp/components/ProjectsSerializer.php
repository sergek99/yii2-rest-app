<?php

namespace restApp\components;

use common\components\rest\Serializer;

class ProjectsSerializer extends Serializer
{
    public function columnMap()
    {
        return [
            "id" => ["destination" => "id"],
            "name" => ["destination" => "name"],
            "owner" => ["destination" => "owner"],
            "status" => ["destination" => "status"],
            "description" => ["destination" => "description"],
            "date_start" => [
                "destination" => "date_start",
                "transformation" => function($date) {
                    return date("d.m.Y", $date);
                }
            ],
            "date_end" => [
                "destination" => "date_end",
                "transformation" => function($date) {
                    return date("d.m.Y", $date);
                }
            ],
        ];
    }

}