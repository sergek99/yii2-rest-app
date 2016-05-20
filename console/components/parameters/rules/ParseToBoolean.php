<?php
/**
 * @author Kondaurov
 */
namespace console\components\parameters\rules;

use console\components\parameters\RuleInterface;
use yii\base\Object;

class ParseToBoolean extends Object implements RuleInterface
{
    public $positive = 'есть, да';

    public static function getName()
    {
        return 'parse_to_boolean';
    }
    
    public function init()
    {
        $this->positive = explode(',', $this->positive);
        $this->positive = array_map('trim', $this->positive);
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
                1 => $parameters[0]->name,
            ],
            'values' => [
                1 => 'Да',
                2 => 'Нет'
            ],
            'relations' => []
        ];
        
        foreach ($parameters as $parameter) {
            $isPositive = false;
            
            if (in_array($parameter, $this->positive)) {
                $isPositive = true;
            }

            $result['relations'][] = [
                'product_id' => $parameter->product_id,
                'name_id' => 1,
                'value_id' => $isPositive ? 1 : 2
            ];
        }

        return $result;
    }
    
}