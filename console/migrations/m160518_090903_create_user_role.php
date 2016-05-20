<?php

use yii\db\Schema;
use yii\db\Migration;

class m160518_090903_create_user_role extends Migration
{
    public function safeUp()
    {
        $this->createTable('rule', [
            'id' => Schema::TYPE_PK,
            'mask' => Schema::TYPE_STRING . ' NOT NULL'
        ]);
        $this->createIndex('idx-rule-mask', 'rule', 'mask');

        $this->createTable('role_rule', [
            'role_id' => Schema::TYPE_INTEGER . ' NOT NULL',
            'rule_id' => Schema::TYPE_INTEGER . ' NOT NULL'
        ]);
        $this->createIndex('idx-role_rule-rule_id', 'role_rule', 'rule_id');
        $this->createIndex('idx-role_rule-role_id', 'role_rule', 'role_id');

        $this->createTable('role', [
            'id' => Schema::TYPE_PK,
            'name' => Schema::TYPE_STRING . ' NOT NULL',
            'english_name' => Schema::TYPE_STRING . ' NOT NULL',
            'parents' => Schema::TYPE_STRING . ' NOT NULL'
        ]);

        $this->createTable('user_role', [
            'user_id' => Schema::TYPE_INTEGER . ' NOT NULL',
            'role_id' => Schema::TYPE_INTEGER . ' NOT NULL'
        ]);

        $this->createIndex('idx-user_role-user_id', 'user_role', 'user_id');
        $this->createIndex('idx-user_role-role_id', 'user_role', 'role_id');
    }

    public function safeDown()
    {
        $this->dropTable('rule');
        $this->dropTable('role');
        $this->dropTable('role_rule');
        $this->dropTable('user_role');
    }
}
