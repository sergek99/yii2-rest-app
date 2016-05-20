<?php

namespace restApp\components;

use common\components\rest\Serializer;

class TasksSerializer extends Serializer
{
    public function columnMap()
    {
        return [
            "id" => ["destination" => "id"],
            "name" => ["destination" => "name"],
            "status" => ["destination" => "status"],
            "user_id" => ["destination" => "user_id"],
            "project_id" => ["destination" => "project_id"],
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
            "project" => ["destination" => "project"],
            "user" => ["destination" => "user"]
        ];
    }

}