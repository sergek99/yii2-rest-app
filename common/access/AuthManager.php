<?php
/**
 *  @author Kozulyaev
 */
namespace common\access;

use common\exceptions\InvalidInstanceException;
use common\exceptions\NotImplementedException;
use common\helpers\ExtArrayHelper;
use common\models\access\RoleRuleCache;
use common\models\User;
use yii\base\Exception;
use yii\base\InvalidConfigException;
use yii\base\Object;
use yii\db\Query;
use yii\helpers\StringHelper;
use yii\rbac\Assignment;
use yii\rbac\Item;
use yii\rbac\ManagerInterface;
use yii\rbac\Permission;
use common\models\access\Role;
use common\models\access\Rule;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;
use common\models\access\RoleCache;
use common\models\access\RuleCache;

class AuthManager extends Object implements ManagerInterface
{
    /**
     * Checks if the user has the specified permission.
     * @param string|integer $userId the user ID. This should be either an integer or a string representing
     * the unique identifier of a user. See [[\yii\web\User::id]].
     * @param string $url
     * @param array $params name-value pairs that will be passed to the rules associated
     * with the roles and permissions assigned to the user.
     * @return boolean whether the user has the specified permission.
     * @throws \yii\base\InvalidParamException if $permissionName does not refer to an existing permission
     */
    public function checkAccess($userId, $url, $params = [])
    {
        return $this->checkUrlAccess($userId, $url);
    }


    public function checkUrlAccess($userId, $url)
    {
        $roles = $this->getAssignments($userId);
        foreach ($roles as $role) {
            foreach ($role->rules as $rule) {
                if ($this->_checkRule($rule, $url)) {
                    if (!$rule->allow) {
                        throw new ForbiddenHttpException('У вас нет прав для совершения этого действия');
                    }
                    return true;
                }
            }
        }

        return true;
//        throw new ForbiddenHttpException('У вас нет прав для совершения этого действия');
    }

    /**
     * Check if anonym user has the url
     * @param $url
     * @return bool
     * @throws ForbiddenHttpException
     */
    public function checkAnonymAccess($url)
    {
        $role = $this->getRole(Role::ANONYM);

        foreach ($role->rules as $rule) {
            if ($this->_checkRule($rule, $url)) {
                if (!$rule->allow) {
                    throw new ForbiddenHttpException('У вас нет прав для совершения этого действия');
                }
            }
        }

        return true;
    }

    protected function _checkRule($rule, $url)
    {
        $regExp = str_replace(['*', '/'], ['([a-zA-Z\-0-9/]*)', '\\/'], $rule->mask);
        if (!StringHelper::endsWith($url, '/')) {
            $url .= '/';
        }

        return (bool)preg_match('/' . $regExp . '/', $url) && \Yii::$app->id === $rule->app;
    }

    /**
     * Creates a new Role object.
     * Note that the newly created role is not added to the RBAC system yet.
     * You must fill in the needed data and call [[add()]] to add it to the system.
     * @param string $name the role name
     * @return Role the new Role object
     */
    public function createRole($name)
    {
        return new Role(['english_name' => $name]);
    }

    /**
     * Creates a new Permission object.
     * Note that the newly created permission is not added to the RBAC system yet.
     * You must fill in the needed data and call [[add()]] to add it to the system.
     * @param string $name the permission name
     * @return Permission the new Permission object
     */
    public function createPermission($name)
    {
        throw new NotImplementedException;
    }

    /**
     * Adds a role, permission or rule to the RBAC system.
     * @param Role|Permission|Rule $object
     * @return boolean whether the role, permission or rule is successfully added to the system
     * @throws \Exception if data validation or saving fails (such as the name of the role or permission is not unique)
     */
    public function add($object)
    {
        if (!$object instanceof Role && !$object instanceof Rule) {
            throw new InvalidInstanceException;
        }

        if (!$object->validate()) {
            var_dump($object->getErrors());exit;
            throw new InvalidConfigException();
        }
        $result = $object->save();
        $this->addToCache($object);

        return $result;
    }

    protected function addToCache($object)
    {
        $cacheClass = $this->getCacheClass($object);
        /**
         * @var \yii\redis\ActiveRecord $cacheModel;
         */

        $cacheModel = new $cacheClass;
        $cacheModel->load(ExtArrayHelper::toArray($object), '');
        $cacheModel->save();
    }

    protected function removeFromCache($object)
    {
        $cacheClass = $this->getCacheClass($object);
        $cacheClass::deleteAll(['id' => $object->id]);
    }

    /**
     * @param $object
     * @return RoleCache|RuleCache
     * @throws InvalidInstanceException
     */
    protected function getCacheClass($object)
    {
        if ($object instanceof Role) {
            $cacheClass = RoleCache::className();
        } else if ($object instanceof Rule) {
            $cacheClass = RuleCache::className();
        } else {
            throw new InvalidInstanceException(
                sprintf('object must instanceof %s or %s', Role::className(), Rule::className())
            );
        }

        return $cacheClass;
    }


    /**
     * Removes a role, permission or rule from the RBAC system.
     * @param Role|Permission|Rule $object
     * @return boolean whether the role, permission or rule is successfully removed
     */
    public function remove($object)
    {
        $this->removeFromCache($object);
        return $object->delete();
    }

    /**
     * Updates the specified role, permission or rule in the system.
     * @param string $name the old name of the role, permission or rule
     * @param Role|Permission|Rule $object
     * @return boolean whether the update is successful
     * @throws \Exception if data validation or saving fails (such as the name of the role or permission is not unique)
     */
    public function update($name, $object)
    {
        $result = $object->save();
        $this->updateCache($object);
        return $result;
    }

    protected function updateCache($object)
    {
        $cacheClass = $this->getCacheClass($object);
        $cacheObject = $cacheClass::findOne($object->id);
        if (!$cacheObject) {
            $cacheObject = new $cacheClass;
        }

        $cacheObject->load(ExtArrayHelper::toArray($object), '');
        $cacheObject->save();
    }

    /**
     * Returns the named role.
     * @param string $name the role name.
     * @return Role|RoleCache the role corresponding to the specified name. Null is returned if no such role.
     */
    public function getRole($name)
    {
        $role = RoleCache::find()->englishName($name)->one();
        if (!$role) {
            $role = Role::find()->englishName($name)->one();
        }
        return $role;
    }

    /**
     * Returns all roles in the system.
     * @return Role[] all roles in the system. The array is indexed by the role names.
     */
    public function getRoles()
    {
        return Role::find()->all();
    }

    /**
     * Returns the roles that are assigned to the user via [[assign()]].
     * Note that child roles that are not assigned directly to the user will not be returned.
     * @param string|integer $userId the user ID (see [[\yii\web\User::id]])
     * @return Role[] all roles directly or indirectly assigned to the user. The array is indexed by the role names.
     */
    public function getRolesByUser($userId)
    {
        return $this->getAssignments($userId);
    }

    /**
     * Returns the named permission.
     * @param string $name the permission name.
     * @return Permission the permission corresponding to the specified name. Null is returned if no such permission.
     */
    public function getPermission($name)
    {
        throw new NotImplementedException;
    }

    /**
     * Returns all permissions in the system.
     * @return Permission[] all permissions in the system. The array is indexed by the permission names.
     */
    public function getPermissions()
    {
        throw new NotImplementedException;
    }

    /**
     * Returns all permissions that the specified role represents.
     * @param string $roleName the role name
     * @return Permission[] all permissions that the role represents. The array is indexed by the permission names.
     */
    public function getPermissionsByRole($roleName)
    {
        throw new NotImplementedException;
    }

    /**
     * Returns all permissions that the user has.
     * @param string|integer $userId the user ID (see [[\yii\web\User::id]])
     * @return Permission[] all permissions that the user has. The array is indexed by the permission names.
     */
    public function getPermissionsByUser($userId)
    {
        // TODO: Implement getPermissionsByUser() method.
    }

    /**
     * Returns the rule of the specified name.
     * @param string $id the rule id
     * @return Rule the rule object, or null if the specified name does not correspond to a rule.
     */
    public function getRule($id)
    {
        return Rule::findOne($id);
    }

    /**
     * Returns all rules available in the system.
     * @return Rule[] the rules indexed by the rule names
     */
    public function getRules()
    {
        return Rule::find()->all();
    }

    /**
     * Adds an item as a child of another item.
     * @param Item $parent
     * @param Item $child
     * @throws \yii\base\Exception if the parent-child relationship already exists or if a loop has been detected.
     */
    public function addChild($parent, $child)
    {
        throw new NotImplementedException;
    }

    /**
     * Removes a child from its parent.
     * Note, the child item is not deleted. Only the parent-child relationship is removed.
     * @param Item $parent
     * @param Item $child
     * @return boolean whether the removal is successful
     */
    public function removeChild($parent, $child)
    {
        throw new NotImplementedException;
    }

    public function attachRule($ruleId, $roleId)
    {
        $db = \Yii::$app->getDb();
        $db->createCommand()
            ->insert('role_rule', [
                'role_id' => $roleId,
                'rule_id' => $ruleId
            ])
            ->execute();
        $roleRuleCache = new RoleRuleCache([
            'role_id' => $roleId,
            'rule_id' => $ruleId
        ]);

        $roleRuleCache->save();
    }

    public function detachRule($ruleId, $roleId)
    {
        $db = \Yii::$app->getDb();
        $db->createCommand()
            ->delete('role_rule',
                'role_id = :roleId and rule_id = :ruleId',
                ['roleId' => $roleId, 'ruleId' => $ruleId]
            )
            ->execute();
        RoleRuleCache::deleteAll(['role_id' => $roleId, 'rule_id' => $ruleId]);
    }

    /**
     * Removed all children form their parent.
     * Note, the children items are not deleted. Only the parent-child relationships are removed.
     * @param Item $parent
     * @return boolean whether the removal is successful
     */
    public function removeChildren($parent)
    {
        throw new NotImplementedException;
    }

    /**
     * Returns a value indicating whether the child already exists for the parent.
     * @param Item $parent
     * @param Item $child
     * @return boolean whether `$child` is already a child of `$parent`
     */
    public function hasChild($parent, $child)
    {
        throw new NotImplementedException;
    }

    /**
     * Returns the child permissions and/or roles.
     * @param string $name the parent name
     * @return Item[] the child permissions and/or roles
     */
    public function getChildren($name)
    {
        throw new NotImplementedException;
    }

    /**
     * Assigns a role to a user.
     *
     * @param Role $role
     * @param string|integer $userId the user ID (see [[\yii\web\User::id]])
     * @return Assignment the role assignment information.
     * @throws \Exception if the role has already been assigned to the user
     */
    public function assign($role, $userId)
    {
        $db = \Yii::$app->getDb();
        return $db->createCommand()->insert('user_role', [
            'user_id' => $userId,
            'role_id' => $role->id
        ])->execute();
    }

    /**
     * Revokes a role from a user.
     * @param Role $role
     * @param string|integer $userId the user ID (see [[\yii\web\User::id]])
     * @return boolean whether the revoking is successful
     */
    public function revoke($role, $userId)
    {
        $db = \Yii::$app->getDb();
        return $db->createCommand()->delete('user_role',
            'user_id = :userId AND role_id = :roleId',
            ['userId' => $userId, 'roleId' => $role->id]
        )->execute();
    }

    /**
     * Revokes all roles from a user.
     * @param mixed $userId the user ID (see [[\yii\web\User::id]])
     * @return boolean whether the revoking is successful
     */
    public function revokeAll($userId)
    {
        $db = \Yii::$app->getDb();
        return $db->createCommand()->delete('user_role',
            ['user_id = :userId'],
            ['userId' => $userId]
        )->execute();
    }

    /**
     * Returns the assignment information regarding a role and a user.
     * @param string|integer $userId the user ID (see [[\yii\web\User::id]])
     * @param string $roleName the role name
     * @return Assignment the assignment information. Null is returned if
     * the role is not assigned to the user.
     */
    public function getAssignment($roleName, $userId)
    {
        $user = User::find()->with([
                'role' => function ($q) use ($roleName) {
                    $q->englishName($roleName);
                    $q->with('rule');
                }
            ])
            ->andWhere(['id' => $userId])
            ->one();

        if (!$user) {
            throw new NotFoundHttpException;
        }

        return $user->roles;
    }

    /**
     * Returns all role assignment information for the specified user.
     * @param string|integer $userId the user ID (see [[\yii\web\User::id]])
     * @return Assignment[] the assignments indexed by role names. An empty array will be
     * @throws NotFoundHttpException
     * returned if there is no role assigned to the user.
     */
    public function getAssignments($userId)
    {
        $query = new Query();
        $roles = $query
            ->select('role_id as id')
            ->from('user_role')
            ->andWhere(['user_id' => $userId])
            ->all(Role::getDb());

        if ($roles) {
            $roles = ExtArrayHelper::getColumn($roles, 'id');
            $cache = RoleCache::find()->andWhere(['in', 'id', $roles])->with('rulesRelation')->all();

            if (!$cache) {
                $roles = Role::find()->andWhere(['in', 'id', $roles])->with('rules')->all();
                foreach ($roles as $role) {
                    $this->updateCache($role);
                }
                return $roles;
            } else {
                return $cache;
            }
        } else {
            return [];
        }
    }

    /**
     * Removes all authorization data, including roles, permissions, rules, and assignments.
     */
    public function removeAll()
    {
        $db = \Yii::$app->getDb();
        $transaction = $db->beginTransaction();

        try {
            $db->createCommand()->delete('role')->execute();
            $db->createCommand()->delete('rule')->execute();
            $db->createCommand()->delete('role_rule')->execute();
            $db->createCommand()->delete('user_role')->execute();
            RoleCache::deleteAll();
            RuleCache::deleteAll();
            RoleRuleCache::deleteAll();
            $transaction->commit();
        } catch (Exception $e) {
            $transaction->rollBack();
        }

    }

    /**
     * Removes all permissions.
     * All parent child relations will be adjusted accordingly.
     */
    public function removeAllPermissions()
    {
        throw new NotImplementedException;
    }

    /**
     * Removes all roles.
     * All parent child relations will be adjusted accordingly.
     */
    public function removeAllRoles()
    {
        throw new NotImplementedException;
    }

    /**
     * Removes all rules.
     * All roles and permissions which have rules will be adjusted accordingly.
     */
    public function removeAllRules()
    {
        throw new NotImplementedException;
    }

    /**
     * Removes all role assignments.
     */
    public function removeAllAssignments()
    {
        throw new NotImplementedException;
    }

}