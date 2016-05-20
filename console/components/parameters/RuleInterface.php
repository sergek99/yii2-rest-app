<?php
/**
 * @author Kondaurov
 */

namespace console\components\parameters;

interface RuleInterface
{
    /**
     * @return string - rule name
     */
    public static function getName();
    
    /**
     * run parse collected param
     * @param \console\models\TempParam[] $parameters
     * @return mixed
     */
    public function run(array $parameters);
}