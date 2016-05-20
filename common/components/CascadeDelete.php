<?php
/**
 *  @author Kondaurov
 */

namespace common\components;

use common\helpers\ExtArrayHelper;

/**
 * Class CascadeDelete
 * @package common\components
 * @see http://wiki.1vse.ru/doku.php?id=market:behaviors:cascadedelete
 */
trait CascadeDelete
{
    /**
     * return relations that must delete
     * @return array
     * example
     * ```php
     * [
     *     [\common\models\Auth::className(), 'id' => 'user_id'],
     *     [\common\models\RequestDiscount::className(), 'id' => 'user_id'],
     *     ['user_role', 'id' => 'user_id']
     * ]
     * ```
     */
    public static function relations()
    {
        return [];
    }

    public static function deleteAll($condition = '', $params = [])
    {
        $select = null;
        $relations = static::relations();

        foreach ($relations as $relation) {
            $link = array_slice($relation, 1, 1);
            $select[] = key($link);
        }

        if (!$select) {
            return;
        }
        $records = static::find()->select($select)->andWhere($condition, $params)->all();

        foreach ($relations as $relation) {
            list($targetRelation) = array_slice($relation, 0, 1);
            $link = array_slice($relation, 1, 1);

            $keys = ExtArrayHelper::getColumn($records, key($link));

            $relationCondition = ['in', reset($link), $keys];

            if (!class_exists($targetRelation)) {
                $cmd = static::getDb()->createCommand();
                $cmd->delete($targetRelation, $relationCondition)->execute();
            } else {
                $targetRelation::deleteAll($relationCondition);
            }

        }
        static::getDb()->createCommand()->delete(static::tableName(), $condition)->execute();
    }

    public function delete()
    {
        /**
         * @var $this \yii\db\ActiveRecord
         */
        $relations = static::relations();
        foreach ($relations as $relation) {
            list($target) = array_slice($relation, 0, 1);
            $link = array_slice($relation, 1, 1);

            $condition = [reset($link) => $this->{key($link)}];
            if (!class_exists($target)) {
                static::getDb()->createCommand()->delete($target, $condition)->execute();
            } else {
                $relationRecord = $target::find()->andWhere($condition)->all();
                foreach ($relationRecord as $record) {
                    $record->delete();
                }
            }
        }
        parent::delete();
    }
}


