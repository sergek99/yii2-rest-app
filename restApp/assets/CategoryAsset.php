<?php
/**
 *  @author Kondaurov
 */

namespace restApp\assets;

use yii\web\AssetBundle;
use yii\web\JqueryAsset;

class CategoryAsset extends AssetBundle
{
    public $sourcePath = '@gulp/js';

    public $js = [
        'actionHistory.js',
        'category.js',
    ];

    public $depends = [
        'yii\web\JqueryAsset',
        'yii\jui\JuiAsset',
        'admin\assets\JqTreeAsset',
    ];
}