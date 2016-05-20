<?php
namespace common\models\behaviors;

use yii\base\InvalidConfigException;
use \yii\db\ActiveRecord;
use yii\helpers\Json;

/**
 * @author Kozulyaev
 */
class JsonColumn extends \yii\base\Behavior
{
    public $columns = [];

    public function events()
    {
        return [
            ActiveRecord::EVENT_AFTER_FIND => 'decode',
            ActiveRecord::EVENT_BEFORE_INSERT => 'encode',
            ActiveRecord::EVENT_BEFORE_UPDATE => 'encode'
        ];
    }

    /**
     * @param $event
     */
    public function decode($event)
    {
        foreach ($this->columns as $column) {
            if (is_array($column)) {
                $this->validateColumnConfig($column);
                $this->owner->{$column['name']} = new $column['model']($this->owner->{$column['name']});
            } else {
                $this->owner->{$column} = Json::decode($this->owner->{$column});
            }
        }
    }

    public function encode($event)
    {
        foreach ($this->columns as $column) {
            if (is_array($column)) {
                $this->validateColumnConfig($column);
                $column = $column['name'];
            }
            $this->owner->{$column} = Json::encode($this->owner->{$column});
        }
    }

    private function validateColumnConfig($config)
    {
        if (empty($config['property'])) {
            throw new InvalidConfigException('key "name" required');
        }

        if (empty ($config['model'])) {
            throw new InvalidConfigException('key "model" required');
        }
    }
}