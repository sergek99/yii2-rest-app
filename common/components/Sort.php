<?php
/**
 * @author Kozulyaev
 */

namespace common\components;

use Yii;
use yii\web\Request;

class Sort extends \yii\data\Sort
{
    public function getUrl($attribute, $sort, $absolute = false)
    {
        if (($params = $this->params) === null) {
            $request = Yii::$app->getRequest();
            $params = $request instanceof Request ? $request->getQueryParams() : [];
        }
        $sort == SORT_ASC ? $prefix = '' : $prefix = '-';
        $params[$this->sortParam] = $prefix.$attribute;//$this->createSortParam($attribute);
        $params[0] = $this->route === null ? Yii::$app->controller->getRoute() : $this->route;
        $urlManager = $this->urlManager === null ? Yii::$app->getUrlManager() : $this->urlManager;
        if ($absolute) {
            return $urlManager->createAbsoluteUrl($params);
        } else {
            return $urlManager->createUrl($params);
        }
    }
}