<?php
/**
 * @author Kondaurov
 */
namespace console\components\parameters;

use console\components\parameters\rules\ParseToBoolean;
use console\components\parameters\rules\ParseToInterval;
use console\components\parameters\rules\ParseToList;
use console\components\parameters\rules\SeparateParameter;
use console\models\TempParam;
use yii\base\Component;
use yii\base\InvalidParamException;

/**
 * Class ParameterParser
 * @package console\components\parameters
 * @property array $rules
 */
class ParameterParser extends Component
{
    private static $instance;

    public static function getRules()
    {
        return [
            ParseToList::getName() => ParseToList::className(),
            ParseToInterval::getName() => ParseToInterval::className(),
            ParseToBoolean::getName() => ParseToBoolean::className(),
            SeparateParameter::getName() => SeparateParameter::className()
        ];
    }

    public static function create()
    {
        if (!self::$instance) {
            self::$instance = new static;
        }

        return self::$instance;
    }

    /**
     * @param $name
     * @param $config
     * @return RuleInterface
     * @throws \yii\base\InvalidConfigException
     */
    public function createRuleByName($name, $config)
    {
        if (key_exists($name, $this->rules)) {
            $config['class'] = $this->rules[$name];
            return \Yii::createObject($config);
        } else {
            throw new InvalidParamException('Not found rule with name "' . $name . '"');
        }
    }

    public function runRule($name, $config, array $parameters)
    {
        $rule = $this->createRuleByName($name, $config);
        return $rule->run($parameters);
    }
}