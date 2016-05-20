<?php
/**
 *  @author Kondaurov
 */
namespace common\helpers;

interface TreeInterface {

    public function getChildren();

    public function setChildren($children);

}