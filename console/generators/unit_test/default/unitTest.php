<?php
/**
 * This is template of unit test file
 * @var $this \yii\web\View
 * @var $generator console\generators\unit_test\Generator
 */
echo "<?php\n";
?>

namespace <?php echo $generator->getUnitTestNamespace(); ?>;

/**
 * Test for <?php echo $generator->targetClass . PHP_EOL; ?>
 */
class <?php echo $generator->unitTestClassName; ?> extends <?php echo $generator->extendClass; ?>
{
}