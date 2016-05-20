<?php

use yii\db\Schema;
use yii\db\Migration;

class m160519_081749_create_tasks extends Migration
{
    public function up()
    {
        $this->createTable('tasks', [
            'id' => Schema::TYPE_BIGPK,
            'project_id' => Schema::TYPE_INTEGER . ' NOT NULL',
            'user_id' => Schema::TYPE_INTEGER . ' NOT NULL',
            'name' => Schema::TYPE_TEXT,
            'description' => Schema::TYPE_TEXT,
            'status' => Schema::TYPE_SMALLINT . ' NOT NULL DEFAULT 0',
            'date_start' => Schema::TYPE_INTEGER . ' NOT NULL',
            'date_end' => Schema::TYPE_INTEGER . ' NOT NULL',

            'created_at' => Schema::TYPE_INTEGER . ' NOT NULL',
            'updated_at' => Schema::TYPE_INTEGER . ' NOT NULL',
            'deleted' => $this->boolean()->defaultValue('0'),
        ]);
    }

    public function down()
    {
        $this->dropTable('tasks');
    }

    /*
    // Use safeUp/safeDown to run migration code within a transaction
    public function safeUp()
    {
    }

    public function safeDown()
    {
    }
    */
}
