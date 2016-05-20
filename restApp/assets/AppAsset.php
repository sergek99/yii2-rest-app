<?php
/**
 *  @author Kozulyaev
 */
namespace restApp\assets;

use yii\web\AssetBundle;
use yii\web\JqueryAsset;

class AppAsset extends AssetBundle
{
	public $basePath = '@webroot';

	public $css = [
		'css/style.css'
	];

	public $js = [
		'js/vendor-bild.js',
		'js/script.js'
	];


}
