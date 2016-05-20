<?php
/**
 *  @author Kozulyaev
 */
namespace common\helpers;

interface TreeInterface {

    public function getChildren();

    public function setChildren($children);

}