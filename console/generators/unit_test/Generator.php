<?php
namespace console\generators\unit_test;
use yii\base\UnknownClassException;
use yii\gii\CodeFile;

/**
 * @author Kondaurov
 * @property string unitTestClassName;
 */
class Generator extends \yii\gii\Generator
{
    public $targetClass;

    /**
     * @return string name of the code generator
     */
    public function getName()
    {
        return 'Unit-test generator';
    }

    public function rules()
    {
        return [
            ['targetClass', 'required'],
            ['targetClass', 'filter', 'filter' => 'trim'],
            ['targetClass', 'match', 'pattern' => '/^[\w\\\\]*$/', 'message' => 'Only word chars and backslashes are allowed'],
            ['targetClass', 'targetClassExists']
        ];
    }

    public function targetClassExists($attribute)
    {
        try {
            if (!class_exists($this->$attribute) && !trait_exists($this->$attribute)) {
                $this->addError($attribute, sprintf('Class or Trait %s not found', $this->$attribute));
            }
        } catch (UnknownClassException $e) {
            $this->addError($attribute, sprintf('Class or Trait %s not found', $this->$attribute));
        }
    }

    /**
     * Generates the code based on the current user input and the specified code template files.
     * This is the main method that child classes should implement.
     * Please refer to [[\yii\gii\generators\controller\Generator::generate()]] as an example
     * on how to implement this method.
     * @return \yii\gii\CodeFile[] a list of code files to be created.
     */
    public function generate()
    {
        return [new CodeFile($this->getUnitTestFile(), $this->render('unitTest.php'))];
    }

    public function getUnitTestClassName()
    {
        return end(explode('\\', $this->targetClass)) . 'Test';
    }

    public function getUnitTestNamespace()
    {
        $ns = explode('\\', $this->targetClass);
        unset($ns[count($ns) - 1]);
        array_unshift($ns, 'tests\unit');
        return implode('\\', $ns);
    }

    public function getExtendClass()
    {
        return "\yii\codeception\TestCase\n";
    }

    public function getUnitTestFile()
    {
        return \Yii::getAlias('@tests') . '/unit/' . str_replace('\\', DIRECTORY_SEPARATOR, $this->targetClass) . 'Test.php';
    }

}