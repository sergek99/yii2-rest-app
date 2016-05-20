<?php

use yii\db\Schema;
use yii\db\Migration;

class m160518_081703_create_session extends Migration
{
    public function up()
    {
        $this->createTable('session',[
            'id' => $this->string(40),
            'expire' => $this->integer(),
            'data' => $this->binary(),
        ]);
    }

    public function down()
    {
        $this->dropTable('session');
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
