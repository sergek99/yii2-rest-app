<?php

namespace common\components;

use common\helpers\JsonFileHelper;
use yii\base\InvalidConfigException;
use yii\web\AssetBundle;
use yii\web\AssetManager;

class GulpAssetsManager extends AssetManager
{

    public $gulpBundleFile;

    private $_gulpBundles;

    public function init()
    {
        if(!$this->gulpBundleFile) {
            throw new InvalidConfigException('Property "gulpBundleFile" required');
        }
        if(!file_exists($this->gulpBundleFile)) {
            throw new InvalidConfigException("gulp bundle file not found in " . $this->gulpBundleFile);
        }
        parent::init();
    }

    public function loadBundle($name, $config = [], $publish = true)
    {
        $bundles = $this->getBundles();
        if (isset($bundles[$name], $bundles[$name]['compiled']) && $bundles[$name]['compiled'] == true) {
            $bundle = \Yii::createObject([
                'class' => AssetBundle::className(),
                'baseUrl' => '@web/assets/' . $name,
            ]);
            if(self::issetAsset($bundles, $name, 'js')) {
                $bundle->js = [ $name . '.js'];
            }

            if (self::issetAsset($bundles, $name, 'css')) {
                $bundle->css = [ $name . '.css'];
            }

            if (self::issetAsset($bundles, $name, 'less')) {
                $bundle->css[] = $name . '.compile.css';
            }

            if($publish) {
                $bundle->publish($this);
            }
            return $bundle;
        } else {
            return parent::loadBundle($name, $config, $publish);
        }
    }

    public function issetAsset($bundles, $name, $type)
    {
        if (isset($bundles[$name][$type])) {
            return true;
        } else if (!empty($bundles[$name]['require'])) {
            $isset = false;
            foreach ($bundles[$name]['require'] as $depend) {
                $isset = self::issetAsset($bundles, $depend, $type);
                if($isset) {
                    break;
                }
            }
            return $isset;
        } else {
            return false;
        }
    }

    private function getBundles()
    {
        if(!$this->_gulpBundles) {
            $this->_gulpBundles = JsonFileHelper::loadFile($this->gulpBundleFile);
        }
        return $this->_gulpBundles;
    }
}