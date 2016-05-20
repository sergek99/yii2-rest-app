<?php

use yii\db\Schema;
use yii\db\Migration;

class m160519_081743_create_projects extends Migration
{
    public function up()
    {
        $this->createTable('projects', [
            'id' => Schema::TYPE_BIGPK,
            'name' => Schema::TYPE_STRING . ' NOT NULL',
            'date_start' => Schema::TYPE_INTEGER . ' NOT NULL',
            'date_end' => Schema::TYPE_INTEGER . ' NOT NULL',
            'description' => Schema::TYPE_TEXT,
            'owner' => Schema::TYPE_INTEGER . ' NOT NULL',
            'status' => Schema::TYPE_SMALLINT . ' NOT NULL DEFAULT 0',

            'created_at' => Schema::TYPE_INTEGER . ' NOT NULL',
            'updated_at' => Schema::TYPE_INTEGER . ' NOT NULL',
            'deleted' => $this->boolean()->defaultValue('0'),
        ]);
    }

    public function down()
    {
        $this->dropTable('projects');
    }
}
