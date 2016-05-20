<?php
namespace restApp\controllers;

use common\components\AppRestController;
use common\helpers\ExtArrayHelper;
use common\models\access\Role;
use common\models\Project;
use common\models\queries\ProjectQuery;
use common\models\queries\UserQuery;
use common\models\Task;
use common\models\User;
use yii\data\ActiveDataProvider;
use yii\data\Sort;
use yii\helpers\Json;
use yii\web\NotFoundHttpException;

class ProjectsController extends AppRestController
{
    public $serializer = [
        'class' => 'restApp\components\ProjectsSerializer',
        'collectionEnvelope' => 'projects'
    ];

    public function actionIndex()
    {
        $query = Project::find();
        $this->applyFilter($query);

        $provider = new ActiveDataProvider([
            'query' => $query
        ]);
        return $provider;
    }

    private function applyFilter(ProjectQuery &$query)
    {
        $params = \Yii::$app->request->get();
        if (!empty($params['filter']['name'])) {
            $query->likeFullName($params['filter']['name']);
        }

        if (!empty($params['filter']['email'])) {
            $query->likeEmail($params['filter']['email']);
        }
    }

    public function actionDelete($id)
    {
        $tasks = Task::find()
            ->project($id)
            ->all();
        if($tasks){
            foreach($tasks as $task){
                $task->delete();
            }
        }

        $project = Project::findOne($id);
        if (!$project) {
            throw new NotFoundHttpException;
        }
        $project->remove();
        return ['success' => true];
    }

    public function actionUpdate($id)
    {
        $body = \Yii::$app->request->getRawBody();
        $body = Json::decode($body);
        /**
         * @var User $model
         */
        $model = User::findOne($id);

        if (!$model) {
            throw new NotFoundHttpException;
        }

        if (!empty($body['password'])) {
            $model->setPassword($body['password']);
            unset($body['password']);
        }

        $model->load($body, '');

        if ($model->validate()) {
            $model->save();

            $originalRoles = ExtArrayHelper::index($model->roles, 'id');
            $newRoles = ExtArrayHelper::index($body['roles'], 'id');

            $removedRoles = array_diff_key($originalRoles, $newRoles);
            $newRoles = array_diff_key($newRoles, $originalRoles);

            if ($removedRoles) {
                $removedRoles = Role::find()->andWhere(['in', 'id', ExtArrayHelper::getColumn($removedRoles, 'id')])->all();

                foreach ($removedRoles as $role) {
                    \Yii::$app->authManager->revoke($role, $model->id);
                }
            }

            if ($newRoles) {
                $newRoles = Role::find()->andWhere(['in', 'id', ExtArrayHelper::getColumn($newRoles, 'id')])->all();

                foreach ($newRoles as $role) {
                    \Yii::$app->authManager->assign($role, $model->id);
                }
            }

            return $model;
        } else {
            return [
                'errors' => $model->getErrors()
            ];
        }

    }

    public function actionCreate()
    {
        $body = \Yii::$app->request->getRawBody();
        $body = Json::decode($body);
        $project = new Project();
        $project->attributes = [
            'name' => $body['project']['name'],
            'description' => $body['project']['description'],
            'date_start' => strtotime($body['project']['date_start']),
            'date_end' => strtotime($body['project']['date_end']),
            'owner' => isset($body['project']['owner'])? $body['project']['owner'] : null 
        ];
        if($project->validate()){
            $project->save();
            return [
                'success' => true
            ];
        } else {
            return [
                'errors' => $project->getErrors()
            ];
        }
    }
}