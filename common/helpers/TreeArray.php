<?php
/**
 *  @author Kondaurov
 */
namespace common\helpers;

use yii\base\Exception;
use yii\base\UnknownClassException;

class TreeArray
{
    const TOP_LEVEL = 0;

    private $__data = [];

    private $__tree = [];

    private $__levelMap = [];

    private $__depth = self::TOP_LEVEL;

    public $startValue;
    public $idColumn;
    public $parentColumn;

    public function __construct(array $array, $parentColumn, $idColumn, $startValue = 0)
    {
        $this->__data = $array;
        $this->parentColumn = $parentColumn;
        $this->idColumn = $idColumn;
        $this->startValue = $startValue;

        if(count($this->__data) > 0) {
            $this->build();
        } else {
            $this->__tree = $this->__data;
        }
    }

    /**
     * @recursive
     * @param $array
     * @param $value
     * @param $level
     * @return null
     */
    protected function build0($array, $value, $level)
    {
        $result = null;
        if(!empty($array[$value])) {
            $result = $array[$value];
            $this->__depth = max($this->__depth, $level);
            if(isset($this->__levelMap[$level])) {
                $this->__levelMap[$level] = ExtArrayHelper::merge($this->__levelMap[$level], $result);
            } else {
                $this->__levelMap[$level] = $result;
            }

            foreach($result as &$item) {
                if(is_object($item) && !$item instanceof TreeInterface) {
                    throw new UnknownClassException('Class must implements common\helpers\TreeInterface');
                }
                $child = $this->build0($array, ExtArrayHelper::getValue($item, $this->idColumn), $level + 1);
                if($child) {
                    $item['children'] = $child;
                }
            }
        }

        return $result;
    }

    protected function build()
    {
        $level = self::TOP_LEVEL;
        $array = ExtArrayHelper::groupByColumn($this->__data, $this->parentColumn);

        $result = $array[$this->startValue];
        if(isset($this->__levelMap[$level])) {
            $this->__levelMap[$level] = ExtArrayHelper::merge($this->__levelMap[$level], $result);
        } else {
            $this->__levelMap[$level] = $result;
        }
        foreach($result as &$item) {
            try {
                $child = $this->build0($array, ExtArrayHelper::getValue($item, $this->idColumn), $level + 1);
                if ($child) {
                    $item['children'] = $child;
                }
            } catch (Exception $e){
                var_dump($e);
            }
        }
        $this->__tree = $result;
    }

    public function getLevel($level)
    {
        if(!empty($this->__levelMap[$level - 1])) {
            return $this->__levelMap[$level - 1];
        }

        return null;
    }

    public function setLevelMap($level, $categories) {
        $this->__levelMap[$level - 1] = $categories;
    }

    public function getDepth() {
        return $this->__depth + 1;
    }

    public function getTree()
    {
        return $this->__tree;
    }
}