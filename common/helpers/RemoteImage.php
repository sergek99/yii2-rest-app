<?php
/**
 *  @author Kondaurov
 */
namespace common\helpers;

class RemoteImage
{
    const RESIZE_50x50 = '50x50';
    const RESIZE_150x200 = '150x200';
    const RESIZE_90x110 = '90x110';

    public static function src($img)
    {
        return \Yii::$app->params['imageServer'] . '/' . $img;
    }
}