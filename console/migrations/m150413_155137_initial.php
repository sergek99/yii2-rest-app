<?php

use yii\db\Schema;
use yii\db\Migration;

class m150413_155137_initial extends Migration
{
    public function up()
    {
        $this->createTable('users', [
            'id' => Schema::TYPE_BIGPK,
            'firstname' => Schema::TYPE_STRING . ' NOT NULL',
            'lastname' => Schema::TYPE_STRING . ' NOT NULL',
            'patronymic' => Schema::TYPE_STRING  . ' DEFAULT NULL',
            'phone' => Schema::TYPE_STRING . ' DEFAULT NULL',
            'auth_key' => Schema::TYPE_STRING . '(32) NOT NULL',
            'password_hash' => Schema::TYPE_STRING . ' NOT NULL',
            'password_reset_token' => Schema::TYPE_STRING,
            'email' => Schema::TYPE_STRING . ' NOT NULL',
            'status' => Schema::TYPE_SMALLINT . ' NOT NULL DEFAULT 0',
            'sms_code' => Schema::TYPE_STRING . ' DEFAULT NULL',
            'sms_sent_at' => Schema::TYPE_INTEGER . ' DEFAULT NULL',
            'avatar' => Schema::TYPE_TEXT . ' DEFAULT NULL',
            'birthday' => Schema::TYPE_INTEGER . ' DEFAULT NULL',

            'created_at' => Schema::TYPE_INTEGER . ' NOT NULL',
            'updated_at' => Schema::TYPE_INTEGER . ' NOT NULL',
            'deleted' => $this->boolean()->defaultValue('0'),
        ]);

    }
    
    public function down()
    {
        $this->dropTable('users');
    }
}
