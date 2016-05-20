<?php
namespace restApp\controllers;

use common\components\AppRestController;
use common\helpers\ExtArrayHelper;
use common\models\access\Role;
use common\models\queries\TaskQuery;
use common\models\Task;
use common\models\TaskHistory;
use common\models\User;
use yii\data\ActiveDataProvider;
use yii\helpers\Json;
use yii\web\NotFoundHttpException;

class TasksController extends AppRestController
{
    public $serializer = [
        'class' => 'restApp\components\TasksSerializer',
        'collectionEnvelope' => 'tasks'
    ];

    public function actionIndex()
    {
        $params = \Yii::$app->request->get();
        if(isset($params['filter']['history'])){
            return $this->getHistory($params['filter']['history']);
        }
        $query = Task::find()
            ->With(['project', 'user'])
            ->asArray();
        $this->applyFilter($query);
        $provider = new ActiveDataProvider([
            'query' => $query
        ]);
        return $provider;
    }

    public function getHistory($taskId)
    {
        $history = TaskHistory::find()
            ->task($taskId)
            ->with(['oldValue', 'newValue'])
            ->asArray()
            ->all();
        return [
            'history' => $history
        ];
    }

    private function applyFilter(TaskQuery &$query)
    {
        $params = \Yii::$app->request->get();
        if (isset($params['filter']['projectId']) && !empty($params['filter']['projectId'])) {
            $query->project($params['filter']['projectId']);
        }
    }

    public function actionDelete($id)
    {
        $task = Task::findOne($id);
        if (!$task) {
            throw new NotFoundHttpException;
        }
        $task->remove();
        return ['success' => true];
    }

    public function actionUpdate($id)
    {
        $body = \Yii::$app->request->getRawBody();
        $post = Json::decode($body);

        /**
         * @var User $model
         */
        $model = Task::findOne($id);

        if (!$model) {
            throw new NotFoundHttpException;
        }

        $model->attributes = [
            'name' => $post['task']['name'],
            'description' => $post['task']['description'],
            'date_start' => strtotime($post['task']['date_start']),
            'date_end' => strtotime($post['task']['date_end']),
            'user_id' => $post['task']['user_id'],
            'status' => $post['task']['status'],
            'project_id' => $post['task']['project_id'],
            'comment' => isset($post['task']['comment'])? $post['task']['comment'] : null
        ];

        if ($model->validate()) {
            $model->save();
            return [
                'success' => true
            ];
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
        $task = new Task();
        $task->attributes = [
            'name' => $body['task']['name'],
            'description' => $body['task']['description'],
            'date_start' => strtotime($body['task']['date_start']),
            'date_end' => strtotime($body['task']['date_end']),
            'user_id' => $body['task']['user_id'],
            'status' => $body['task']['status'],
            'project_id' => $body['task']['project_id']
        ];
        if($task->validate()){
            $task->save();
            return [
                'success' => true,
                'task' => $task
            ];
        } else {
            return [
                'errors' => $task->getErrors()
            ];
        }
    }
}