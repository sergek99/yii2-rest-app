<?php

use yii\helpers\Html;
/**
 * @var $this \yii\web\View
 * @var $content string
 */
$this->registerAssetBundle('restAppVendor');
$this->registerAssetBundle('restApp');
?>
<!DOCTYPE HTML>
<?php $this->beginPage();?>
<head>
    <meta charset="<?php echo Yii::$app->charset ?>">
    <title><?php echo Html::encode($this->title)?></title>
    <?php $this->head() ?>
    <base href="/">
</head>
<body ng-app="rest">
    <?php $this->beginBody(); ?>
    <div class="container">
        <div ng-controller="rest.controllers.MenuController">
            <ng-include src="'/views/menu/index.html'"></ng-include>
        </div>
        <div class="main" ui-view>
            <?php echo $content ?>
        <div>
    </div>
    <div class="b-popups">
        <div class="popup-bg js-close-popup"></div>
    </div>
    <?php $this->endBody(); ?>
</body>
<?php $this->endPage()?>