<?php
/**
 * @author Kozulyaev
 */
namespace console\components\parameters\rules;

use console\components\parameters\RuleInterface;
use yii\base\Object;

class ParseToList extends Object implements RuleInterface
{
    public $delimiter;
    
    public static function getName()
    {
        return 'parse_to_list';
    }

    /**
     * @inheritdoc
     */
    public function run(array $parameters)
    {
        if (count($parameters) == 0) {
            return null;
        }
        
        $result = [
            'names' => [
                1 => $parameters[0]->name
            ],
            'values' => [],
            'relations' => []
        ];

        $counter = 0;
        foreach ($parameters as $parameter) {
            $values = explode($this->delimiter, $parameter->value);
            $values = array_map('trim', $values);
            foreach ($values as $value) {
                if (!in_array($value, $result['values'])) {
                    $result['values'][++$counter] = $value;
                }

                $result['relations'][] = [
                    'product_id' => $parameter->product_id,
                    'name_id' => 1,
                    'value_id' => array_search($value, $result['values'])
                ];
            }
        }

        return $result;
    }
}