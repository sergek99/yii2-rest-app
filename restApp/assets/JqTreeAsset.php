<?php
/**
 *  @author Kozulyaev
 */
namespace restApp\assets;
use yii\web\AssetBundle;

class JqTreeAsset extends AssetBundle
{
    public $sourcePath = '@bower/jqtree';

    public $js = [
        'tree.jquery.js'
    ];

    public $css = [
        'jqtree.css'
    ];


}