<?php
namespace console\actions;

use console\components\YmlCatalog;
use Yii;
use pastuhov\Command\Command;
use yii\base\Action;
use yii\console\Controller;

/**
 * Генерация YML.
 */
class GenerateAction extends Action
{
    /**
     * @var bool
     */
    public $enableGzip = true;

    /**
     * Publish yml and .gz
     * 
     * @var bool
     */
    public $keepBoth = false;

    /**
     * @var string
     */
    public $publicPath;

    /**
     * @var string
     */
    public $runtimePath;

    /**
     * @var callable
     */
    public $onValidationError;

    /**
     * @var string
     */
    public $handleClass = 'pastuhov\FileStream\BaseFileStream';

    /**
     * @var string
     */
    public $gzipCommand = 'cat {src} | gzip > {dst}';

    /**
     * Генерация YML.
     */
    public function run($id = null)
    {
        Yii::beginProfile('yml generate');

        $fileName = \Yii::getAlias($this->runtimePath) . '/store_' . $id .'.xml';
        $gzipedFileName = $fileName . '.gz';
        $handle = new $this->handleClass($fileName);

        $generator = new YmlCatalog(
            $handle,
            null,
            $this->onValidationError
        );
        if($id != null) {
            $generator->generate($id);
            if ($this->enableGzip === true) {
                Command::exec($this->gzipCommand, [
                    'src' => $fileName,
                    'dst' => $gzipedFileName
                ]);
                if (!$this->keepBoth) {
                    $fileName = $gzipedFileName;
                }
            }

            $publicPath = \Yii::getAlias($this->publicPath);
            rename($fileName, $publicPath . '/' . basename($fileName));
            if ($this->enableGzip && $this->keepBoth) {
                rename($gzipedFileName, $publicPath . '/' . basename($gzipedFileName));
            }
            Yii::endProfile('yml generate');

            return Controller::EXIT_CODE_NORMAL;
        } else {
            $this->controller->stdout('Неуказан id магазина' . PHP_EOL);
            return Controller::EXIT_CODE_NORMAL;
        }
    }
}
