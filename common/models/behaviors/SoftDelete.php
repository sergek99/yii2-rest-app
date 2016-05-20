<?php
/**
 *  @author Kondaurov
 */
namespace common\models\behaviors;

use yii\base\Behavior;
use yii\db\ActiveRecord;

/**
 * Class SoftDelete
 * @package common\models\behaviors
 * Added soft delete functionally
 * Usage
 * Add column ```deleted``` to your database table
 * Add behavior to your model
 * ```php
 * public function behaviors()
 * {
 *     return [common\model\behaviors\SoftDelete::className()];
 * }
 * ```
 * Methods:
 * ```php
 * // soft-delete model
 * $model->remove();
 * // restore model
 * $model->restore();
 * // delete model from db
 * $model->forceDelete();
 *
 * //soft-delete model if $safeMode = true
 * //delete model form db if $safeMode = false
 * $model->delete();
 * ```
 */
class SoftDelete extends Behavior
{

    public $attribute = 'deleted';

    public $safeMode = true;

    public function events()
    {
        return [ActiveRecord::EVENT_BEFORE_DELETE => 'doDelete'];
    }

    /**
     * @param \yii\base\Event $event
     */
    public function doDelete($event)
    {
        if(!$this->safeMode) {
            return;
        }

        $this->remove();
        $event->isValid = false;
    }

    public function remove()
    {
        $attribute = $this->attribute;
        $this->owner->$attribute = true;
        $this->owner->save(false, [$attribute]);
    }

    public function restore()
    {
        $attribute = $this->attribute;
        $this->owner->$attribute = false;
        $this->owner->save(false, [$attribute]);
    }

    public function forceDelete()
    {
        /**
         * @var $model ActiveRecord
         */
        $model = $this->owner;
        $this->detach();
        $model->delete();
    }
}