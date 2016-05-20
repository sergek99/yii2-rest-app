<?php
/**
 * @author Kondaurov
 */
namespace console\components\parameters\rules;

use console\components\parameters\RuleInterface;
use yii\base\Object;

class ParseToInterval extends Object implements RuleInterface
{
    public $measurement;

    public $beginWord = 'от';

    public $endWord = 'до';

    public $delimiter = '';

    public static function getName()
    {
         return 'parse_to_interval';
    }

    /**
     * @inheritdoc
     */
    public function run(array $parameters)
    {
        $result = [
            'names' => [
                1 => $parameters[0]->name
            ],
            'values' => [],
            'relations' => [],
        ];

        $counter = 0;
        foreach ($parameters as $parameter) {
            $values = $this->parse($parameter->value);
            foreach ($values as $value) {
                if (!in_array($value, $result['values'])) {
                    $result['values'][++$counter] = $value;
                }
            }

            $result['relations'][] = [
                'product_id' => $parameter->product_id,
                'name_id' => 1,
                'value' => [
                    'begin' => array_search($values['begin'], $result['values']),
                    'end' => array_search($values['end'], $result['values'])
                ]
            ];

        }

        return $result;
    }

    private function parse($value) {
        $result = [];
        if ($this->measurement) {
            $value = str_replace($this->measurement, '', $value);
        }

        if ($this->delimiter) {
            $value = explode($this->delimiter, $value);
            $value['begin'] = $value[0];
            $value['end'] = $value[1];
        }

        if (!is_array($value)) {
            $value = [
                'begin' => $value,
                'end' => $value
            ];
        }

        $value = array_map('floatval', $value);
        return $value;
    }

}