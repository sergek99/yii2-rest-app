<?php
/**
 * @author Kozulyaev
 */
namespace common\helpers;

use yii\db\BaseActiveRecord;
use yii\helpers\ArrayHelper;
use Zend\Log\Formatter\Base;

class ExtArrayHelper extends ArrayHelper
{
    /**
     * find minimum element of array, using callback
     * @param array $array
     * @param callable $callback should return true if first argument less, or false if second element less
     * @return mixed
     */
    public static function minValue(array $array, callable $callback)
    {
        $min = $array[0];
        for($i = 0; $i < count($array); $i++) {
            if(call_user_func_array($callback, [$min, $array[$i]]) === false) {
                $min = $array[$i];
            }
        }
        return $min;
    }

    public static function maxValue(array $array, callable $callback)
    {
        $max = $array[0];
        for($i = 0; $i < count($array); $i++) {
            if(call_user_func_array($callback, [$max, $array[$i]]) === false) {
                $max = $array[$i];
            }
        }
        return $max;
    }

    public static function groupByColumn(array $array, $column)
    {
        $result = [];
        foreach ($array as $item) {
            if($item[$column] === null) {
                $item[$column] = (int)$item[$column];
            }
            $result[$item[$column]][] = $item;
        }
        return $result;
    }

    public static function findByColumnValue($array, $column, $value)
    {
        $result = [];
        foreach($array as $item) {
            if(static::getValue($item, $column) == $value) {
                $result[] = $item;
            }
        }
        return $result;
    }

    public static function sum($array, $column)
    {
        $sum = 0;

        foreach ($array as $item) {
            $sum += (float)self::getValue($item, $column, 0);
        }
        return $sum;
    }

    public static function removeRecursiveValue($array, $value)
    {
        foreach ($array as $key => $item) {
            if (is_array($item)) {
                $array[$key] = self::removeRecursiveValue($item, $value);
            }

            if ($item === $value || (is_array($item) && empty($item)) ) {
                unset($array[$key]);
            }
        }

        return $array;
    }

    public static function index($array, $key, $prefix = null)
    {
        $result = [];
        foreach ($array as $element) {
            $value = static::getValue($element, $key);
            $value = $prefix . $value;
            $result[$value] = $element;
        }

        return $result;
    }

    public static function unique($array, $key)
    {
        $array = static::index($array, $key);
        $keys = array_keys($array);
        $keys = array_unique($keys);

        return array_intersect_key($array, array_flip($keys));
    }

    /**
     * convert ActiveRecord object to array with relations
     * @param BaseActiveRecord[]|BaseActiveRecord $objects
     * @return array
     */
    public static function toArrayWithRelations($objects)
    {
        $result = [];

        $toArray = function ($object) {
            if (!$object) return null;

            /** @var BaseActiveRecord $object */
            $item = $object->toArray();
            $relations = $object->getRelatedRecords();
            foreach ($relations as $relationName => $relation) {
                $item[$relationName] = static::toArrayWithRelations($relation);
            }

            return $item;
        };

        if (is_array($objects)) {
            foreach ($objects as $object) {
                $result[] = $toArray($object);
            }
        } else {
            $result = $toArray($objects);
        }

        return $result;
    }

}