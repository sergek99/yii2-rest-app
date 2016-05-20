<?php
/**
 * @author Kondaurov
 */
namespace console\components\parameters\rules;

use console\components\parameters\RuleInterface;
use yii\base\Object;

class SeparateParameter extends Object implements RuleInterface
{
    public static function getName()
    {
        return 'separate';
    }
    
    public function run(array $parameters)
    {
        // TODO: Implement run() method.
    }
    
}