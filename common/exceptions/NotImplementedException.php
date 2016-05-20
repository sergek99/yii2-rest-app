<?php
namespace common\exceptions;
/**
 *  @author Kondaurov
 */
class NotImplementedException extends \yii\web\HttpException
{

    public function __construct($message = "", $code = 0, Exception $previous = null) {
        return parent::__construct(434, $message, $code, $previous);
    }
}