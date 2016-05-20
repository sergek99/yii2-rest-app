<?php
/**
 *  @author Kondaurov
 */
namespace console\controllers;

use common\access\AuthManager;
use common\models\access\Role;
use common\models\access\Rule;
use yii\console\Controller;
use yii\rbac\DbManager;

class RbacController extends Controller
{

    public function actionInit()
    {
        $auth = new AuthManager();
        $auth->init();

        $auth->removeAll();

        $roles = [];

        $roles['anonym'] = $auth->createRole(Role::ANONYM);
        $roles['anonym']->setScenario(Role::SCENARIO_INIT);
        $roles['anonym']->name = 'Незарегистрированный пользователь';
        $auth->add($roles['anonym']);

        $roles['user'] = $auth->createRole(Role::USER);
        $roles['user']->setScenario(Role::SCENARIO_INIT);
        $roles['user']->name = 'Пользователь';
        $auth->add($roles['user']);


        $roles['bot'] = $auth->createRole(Role::BOT);
        $roles['bot']->setScenario(Role::SCENARIO_INIT);
        $roles['bot']->name = 'Бот';
        $auth->add($roles['bot']);

        $roles['admin'] = $auth->createRole(Role::ADMIN);
        $roles['admin']->setScenario(Role::SCENARIO_INIT);
        $roles['admin']->name = 'Админ';
        $auth->add($roles['admin']);

        $rules = [
            'market' => new Rule([
                'name' => 'Разрешено все',
                'mask' => '/*',
                'allow' => true,
                'app' => Rule::APP_MARKET
            ]),
            'store-admin' => new Rule([
                'name' => 'Разрешено все',
                'mask' => '/*',
                'allow' => true,
                'app' => Rule::APP_STORE
            ]),
            'admin' => new Rule([
                'name' => 'Разрешено все',
                'mask' => '/*',
                'allow' => true,
                'app' => Rule::APP_ADMIN
            ]),
            'job' => new Rule([
                'name' => 'Разрешено все',
                'mask' => '/*',
                'allow' => true,
                'app' => Rule::APP_JOB
            ])
        ];

        foreach ($rules as $rule) {
            $auth->add($rule);
            foreach ($roles as $role) {
                $auth->attachRule($rule->id, $role->id);
            }
        }
    }

    public function actionSetSiteAdmin($id)
    {
        $auth = new DbManager();
        $siteAdmin = $auth->getRole(Role::ADMIN);
        $auth->assign($siteAdmin, $id);
    }
}