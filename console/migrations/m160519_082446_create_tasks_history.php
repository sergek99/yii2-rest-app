<?php

use yii\db\Schema;
use yii\db\Migration;

class m160519_082446_create_tasks_history extends Migration
{
    public function up()
    {
        $this->createTable('tasks_history', [
            'id' => Schema::TYPE_BIGPK,
            'task_id' => Schema::TYPE_INTEGER . ' NOT NULL',
            'comment' => Schema::TYPE_TEXT,
            'type' => Schema::TYPE_INTEGER,
            'old_value' => Schema::TYPE_TEXT,
            'new_value' => Schema::TYPE_TEXT,

            'created_at' => Schema::TYPE_INTEGER . ' NOT NULL',
            'updated_at' => Schema::TYPE_INTEGER . ' NOT NULL',
            'deleted' => $this->boolean()->defaultValue('0'),
        ]);
    }

    public function down()
    {
        $this->dropTable('tasks_history');
    }
}
