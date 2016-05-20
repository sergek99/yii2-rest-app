<?php
namespace common\sort;

use Yii;
use yii\base\Model;

class SortModel extends Model
{
    private $params;
    private $objects;

    const SORT_DESC = 'DESC';
    const SORT_ASC = 'ASC';

    public function __construct($config, $data)
    {
        $this->params = $config;
        $this->objects = $data;
    }

    private function getValue($object)
    {
        $fields = explode('.', $this->params['fields']);
        foreach($fields as $key => $field){
            if( $key == 0 ) {
                $result = $object[$field];
            } else {
                if ($key == count($fields)-1) {
                    $result = $result[$field];
                    if($result !=null) {
                        if(isset($this->params['callback'])) {
                            $result = call_user_func_array([$result, $this->params['callback']], [$this->params['callbackValue']]);
                        }
                    }
                } else {
                    $result = $result[$field];
                }
            }
        }
        return $result;
    }

    public function sort()
    {
        usort($this->objects, function($a, $b){
            $val1 = $this->getValue($a);
            $val2 = $this->getValue($b);
            if ($val1 == $val2) {
                return 0;
            }
            return ($val1 < $val2) ? -1 : 1;
        });

        if($this->params['sort'] == self::SORT_DESC){
            return array_reverse($this->objects);
        }

        return $this->objects;
    }
}
