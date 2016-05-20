<?php
namespace restApp\controllers;

use common\components\AppRestController;
use common\helpers\ExtArrayHelper;
use common\models\access\Role;
use common\models\queries\UserQuery;
use common\models\User;
use yii\data\ActiveDataProvider;
use yii\data\Sort;
use yii\helpers\Json;
use yii\web\NotFoundHttpException;

/**
 * @author Kozulyaev
 */
class UsersController extends AppRestController
{
    public $serializer = [
        'class' => 'restApp\components\UsersSerializer',
        'collectionEnvelope' => 'users'
    ];

    public function actionIndex()
    {
        $get = \Yii::$app->request->get();
        $query = User::find()->with('roles')->asArray();
        $this->applyFilter($query);
        if(isset($get['all']) && $get['all']){
            $users = $query->all();
            return [
                'users' => $users
            ];
        }
        $provider = new ActiveDataProvider([
            'query' => $query,
            'sort' => new Sort([
                'attributes' => [
                    'name' => [
                        'asc' => ['lastname' => SORT_ASC, 'firstname' => SORT_ASC],
                        'desc' => ['lastname' => SORT_DESC, 'firstname' => SORT_DESC],
                    ]
                ]
            ])
        ]);
        return $provider;
    }

    private function applyFilter(UserQuery &$query)
    {
        $params = \Yii::$app->request->get();
        if (!empty($params['filter']['name'])) {
            $query->likeFullName($params['filter']['name']);
        }

        if (!empty($params['filter']['email'])) {
            $query->likeEmail($params['filter']['email']);
        }
    }

    public function actionView($id)
    {
        return User::findOne($id);
    }

    public function actionDelete($id)
    {
        $user = User::findOne($id);
        if (!$user) {
            throw new NotFoundHttpException;
        }
        $user->remove();
        return ['success' => true];
    }

    public function actionUpdate($id)
    {
        $post = \Yii::$app->request->post();
        return $this->saveUserWithImage($post);
    }

    private function saveUserWithImage($post)
    {
        $fileName = false;
        foreach($post as $key => $value){
            if($key == 'file'){
                $filePath = \Yii::$app->params['userAvatarPath'];

                $fileName = \Yii::$app->security->generateRandomString(32);
                $ext = pathinfo($value['fileName'], PATHINFO_EXTENSION);
                file_put_contents($filePath.'/'.$fileName.'.'.$ext, $value['fileBody']);

                $fileName = $fileName.'.'.$ext;
            } else {
                if($key=='user') {
                    $data = Json::decode($value);
                } else {
                    $body = \Yii::$app->request->getRawBody();
                    $data = Json::decode($body);
                    return $this->saveOrUpdateUser($data);
                }
            }
        }
        if($fileName){
            if(isset($data)){
                $data['avatar'] = $fileName;
                return $this->saveOrUpdateUser($data);
            }
        }
    }

    private function saveOrUpdateUser($data)
    {
        if(isset($data['id'])) {
            $model = User::findOne($data['id']);
        } else {
            $model = new User();
        }

        if (!$model) {
            throw new NotFoundHttpException;
        }

        if (!empty($data['password'])) {
            $model->setPassword($data['password']);
            unset($data['password']);
        }

        $model->load($data, '');

        if ($model->validate()) {
            $model->save();

            return [
                'success' => true,
                'user' => $model
            ];
        } else {
            return [
                'errors' => $model->getErrors()
            ];
        }
    }

    public function actionCreate()
    {
        $post = \Yii::$app->request->post();
        if($post) {
            return $this->saveUserWithImage($post);
        } else {
            $body = \Yii::$app->request->getRawBody();
            $data = Json::decode($body);
            return $this->saveOrUpdateUser($data);
        }
    }
}