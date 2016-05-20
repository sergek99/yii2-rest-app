<?php
/**
 * @author Kozulyaev
 */
namespace common\components\rest;

use yii\base\InvalidConfigException;

abstract class Serializer extends \yii\rest\Serializer
{
    const ALWAYS = 0;
    const COLLECTION_SERIALIZE = 1;
    const ONE_SERIALIZE = 2;

    /**
     * @var array
     * Example
     * [
     *      "title" => [
     *          "destination" => "product_name",
     *          "transformation" => function($value) { return "Product name of " . $value  }
     *          "include" => Serializer::ONE_SERIALIZE //default Serializer::ALWAYS
     *      ] or
     *      "title" => "product_name"
     * ]
     */
    abstract public function columnMap();

    protected function serializeModel($model)
    {
        $model = parent::serializeModel($model);
        return $this->transformModel($model, self::ONE_SERIALIZE);
    }

    protected function serializeModels(array $models)
    {
        $models = parent::serializeModels($models);
        foreach ($models as &$model) {
            $model = $this->transformModel($model, self::COLLECTION_SERIALIZE);
        }
        return $models;
    }

    protected function transformModel($model, $scenario = self::ALWAYS)
    {
        $columnMap = $this->columnMap();
        if (!$columnMap) {
            return $model;
        }

        $result = [];
        foreach ($model as $column => $value) {
            if (array_key_exists($column, $columnMap)) {
                $rule = $columnMap[$column];
                if (is_array($rule)) {
                    if (!array_key_exists('include', $rule) ||
                        (array_key_exists('include', $rule)) && $rule['include'] == $scenario
                    ) {

                        if (array_key_exists('transformation', $rule) && is_callable($rule['transformation'])) {
                            $value = $rule['transformation']($value);
                        }

                        $result[$rule['destination']] = $value;
                    }
                } else {
                    $result[$rule] = $value;
                }
            }
        }
        return $result;
    }

    protected function serializePagination($pagination)
    {
        return ['pagination' => $pagination];
    }
}