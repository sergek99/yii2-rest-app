<?php
/**
 * @author Kozulyaev
 */
namespace restApp\modules\rest\controllers\category;
use restApp\modules\rest\components\SgmRestController;
use common\modules\priceservice\models\CategoryMappingKeyword;
use yii\data\ActiveDataProvider;
use yii\helpers\Json;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;

class MappingKeywordsController extends SgmRestController
{
    
    
    public function actionIndex()
    {
        $request = \Yii::$app->request;
        $categoryId = $request->get('category');
        if (!$categoryId) {
            throw new BadRequestHttpException('Category required');
        }

        $query = CategoryMappingKeyword::find()->andWhere(['category_id' => (int)$categoryId])->orderBy('created_at DESC');
        if ($request->get('query')) {
            $query->andWhere(['like', 'keyword', $request->get('query')]);
        }

        if (!$request->get('offset')) {
            $provider = new ActiveDataProvider([
                'query' => $query
            ]);

            return [
                'keywords' => $provider->getModels(),
                'pagination' => $provider->getPagination()
            ];
        } else {
            $query->offset($request->get('offset'))->limit(1);
            return [
                'keywords' => $query->one()
            ];
        }
    }
    
    public function actionDelete($id)
    {
        $record = CategoryMappingKeyword::findOne($id);
        $record->delete();
    }
    
    public function actionUpdate($id)
    {
        $model = CategoryMappingKeyword::findOne($id);
        if (!$model) {
            throw new NotFoundHttpException(Json::encode([
                'errors' => [
                    ['Ключевое слово с id#' . $id . ' не найдено']
                ]
            ]));
        }

        $model->load(Json::decode(\Yii::$app->request->rawBody), '');

        if(!$model->validate() || !$model->save()) {
            throw new BadRequestHttpException(Json::encode($model->getErrors()));
        }
    }

    public function actionCreate()
    {
        $request = Json::decode(\Yii::$app->request->rawBody);
        $model = new CategoryMappingKeyword();
        $model->load($request, '');

        if ($model->validate() && $model->save()) {
            return [
                'id' => $model->id
            ];
        } else {
            throw new BadRequestHttpException(Json::encode($model->getErrors()));
        }
    }
}