<?php
/**
 * @author Kozulyaev
 */
namespace restApp\modules\rest\controllers;

use restApp\modules\rest\components\SgmRestController;
use common\helpers\TreeArray;
use common\models\Category;
use common\models\Product;
use common\models\queries\ProductQuery;
use common\models\User;
use yii\data\Sort;
use yii\data\ActiveDataProvider;
use yii\helpers\ArrayHelper;
use yii\helpers\Json;
use yii\web\NotFoundHttpException;


class ProductsController extends SgmRestController
{

    public function actionIndex()
    {
        $query = Product::find()
            ->with(['rating', 'brand'])
            ->asArray()
            ->orderBy('id ASC')
        ;

        $this->applyFilter($query);

        $provider = new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => 20
            ]
        ]);

        $products = [];
        $products_ = $provider->getModels();
        foreach ($products_ as $key => $product) {
            $products[$key] = $product;
            $catId = (int)trim($product['category_ids'], '{}');
            $category = Category::find()
                ->where(['id' => $catId])
                ->asArray()
                ->one();
            $products[$key]['category'] = $category;
            $products[$key]['categoryFullPath'] = $this->getLinksByProduct($product);
        }

        return [
            'products' => $products,
            'pagination' => $provider->pagination
        ];
    }

    public function actionView($id)
    {
        $get = \Yii::$app->request->get();
        $product = Product::find()
            ->andWhere(['id' => $id])
            ->with(['rating', 'brand'])
            ->one();
        if (isset($get['type'])) {
            $type = $get['type'];
            if ($type == 'comment') {
                $comments = $this->getCommentTree($id);
                return ArrayHelper::merge(
                    ['product' => $product],
                    $comments
                );
            }
            if ($type == 'review') {
                $reviews = $this->getReview($id);
                return ArrayHelper::merge(
                    ['product' => $product],
                    $reviews
                );
            }
        }
        return [
            'product' => $product
        ];
    }

    private function applyFilter(ProductQuery &$query)
    {
        $params = \Yii::$app->request->get();
        if (isset($params['filter']['categoryId']) && !empty($params['filter']['categoryId'])) {
            $query->category($params['filter']['categoryId']);
        }
        if (isset($params['filter']['q']) && !empty($params['filter']['q'])) {
            $param = [];
            $condition = "lower(title) LIKE (:search)";
            $param['search'] = '%' . mb_strtolower($params['filter']['q']) . '%';
            $query->andWhere($condition, $param);
        }
    }

    public function actionUpdate($id = null)
    {
        $body = \Yii::$app->request->getRawBody();
        $data = Json::decode($body);

        if (isset($data['moveProducts']) && $data['moveProducts'] == 1) {
            if (!$this->checkCategory($data['products'][0]['categoryId'])) {
                return [
                    'errors' => [
                        'category' => 'Вы не можете перенести товар в категорию содержащую подкатегорнии',
                    ]
                ];
            } else {
                $this->moveProducts($data['products']);
                $this->updateProductCount($data['oldCategoryId']);
                return true;
            }
        }

        $product = Product::findOne($id);
        if (!$product) {
            throw new NotFoundHttpException;
        }
        if (isset($data['product']['title']) && $data['product']['title'] != '') {
            $product->title = $data['product']['title'];
        }
        if (isset($data['product']['brandId']) && $data['product']['brandId'] > 0) {
            $product->brand_id = $data['product']['brandId'];
        }
        if (isset($data['product']['categoryId']) && $data['product']['categoryId'] > 0) {
            if ($this->checkCategory($data['product']['categoryId'])) {
                $product->category_ids = '{' . (int)$data['product']['categoryId'] . '}';
            } else {
                return [
                    'errors' => [
                        'category' => 'Вы не можете перенести товар в категорию содержащую подкатегорнии',
                    ]
                ];
            }
        }
        $save = $product->save();
        $save = true;
        if (isset($data['product']['categoryId']) && $data['product']['categoryId'] > 0) {
            $this->updateProductCount(trim($product->category_ids, '{}'));
            $this->updateProductCount((int)$data['product']['categoryId']);
        }
        return $save;
    }

    public function actionDelete($id = null)
    {
        $get = \yii::$app->request->get();

        $products = Product::find();
        if ($id) {
            $products = $products->where(['id' => $id]);
        }
        if (isset($get['data'])) {
            $temp = Json::decode($get['data']);
            $products = $products->where(['in', 'id', $temp['ids']]);
        }
        $products = $products->all();
        if (count($products) > 0) {
            foreach ($products as $product) {
                $product->delete();
            }
            return true;
        }
        return false;
    }

    private function updateProductCount($categoryId = null)
    {
        if (!$categoryId) {
            return;
        }
        $category = \common\models\redis\Category::findOne($categoryId);
        $productCount = Product::find()
            ->category($categoryId)
            ->count();
        $category->countProducts = $productCount;
        $category->save();
    }

    private function moveProducts($products)
    {
        foreach ($products as $_product) {
            $product = Product::findOne($_product['productId']);
            if ($product) {
                $product->category_ids = '{' . (int)$_product['categoryId'] . '}';
                $product->save();
            }
        }

        $this->updateProductCount($products[0]['categoryId']);
    }

    private function checkCategory($categoryId)
    {
        $category = Category::find()
            ->where(['parent_id' => $categoryId])
            ->all();
        if ($category) {
            return false;
        } else {
            return true;
        }
    }

    public function actionCreate()
    {
        $attributes = Json::decode(\Yii::$app->request->getRawBody());
        if (!$this->checkCategory(trim($attributes['caegory_ids'], '{}'))) {
            return [
                'errors' => [
                    'category' => 'Вы не можете перенести товар в категорию содержащую подкатегорнии',
                ]
            ];
        } else {
            $product = new Product();
            if ($product->load($attributes, '') && $product->validate()) {
                return $product->save();
            } else {
                return ['errors' => $product->getErrors()];
            }
        }
    }

    private function getReview($productId)
    {
        $reviews = \common\models\review\Product::find()
            ->modelPk($productId)
            ->with('user', 'rating')
            ->orderBy('id DESC')
            ->all();

        $usersIds = [];
        foreach ($reviews as $review) {
            $usersIds[$review->author->id] = $review->author->id;
        }

        $reviewUser = User::find()
            ->andWhere(['not in', 'id', $usersIds])
            ->andWhere(['status'=>User::STATUS_BOT])
            ->orderBy('random()')
            ->one();

        return [
            'reviews' => $reviews,
            'user' => $reviewUser
        ];
    }

    private function getCommentTree($productId)
    {
        $get = \Yii::$app->request->get();
        $comments = \common\models\comment\Product::find()
            ->modelPk($productId);
        if (isset($get['comment'])) {
            $comment = json_decode($get['comment']);
            if ($comment->parent_id == 0) {
                $comments = $comments->andWhere(['id' => $comment->id]);
            } else {
                $comments = $comments
                    ->andWhere(['id' => $comment->parent_id])
                    ->orWhere(['parent_id' => $comment->parent_id]);
            }
        }
        $comments = $comments->orderBy('id ASC')
            ->all();

        $usersIds = [];
        foreach ($comments as $comment) {
            $usersIds[$comment->author->id] = $comment->author->id;
        }

        $commentUser = User::find()
            ->andWhere(['not in', 'id', $usersIds])
            ->orderBy('random()')
            ->andWhere(['status'=>User::STATUS_BOT])
            ->one();

        $comments = new TreeArray($comments, 'parent_id', 'id');
        return [
            'comments' => $comments->getTree(),
            'user' => $commentUser
        ];
    }

    private function getLinksByProduct($product)
    {

        $categoryIds = explode(',', trim($product['category_ids'], '{}'));
        $selectCategoryId = null;
        $categoryId = (in_array($selectCategoryId, $categoryIds)) ? $selectCategoryId : $categoryIds[0];
        $parentCategories = $this->searchParentCategory($categoryId);
        $parentCategories = array_reverse($parentCategories);

        $categoryFullPath = [];
        foreach ($parentCategories as $key => $parentCategory) {
            array_push($categoryFullPath, $parentCategory['title']);
        }
        return implode(' -> ', $categoryFullPath);
    }

    private function searchParentCategory($categoryId)
    {
        $parentCategories = [];
        $parentId = $categoryId;
        do {
            $parentCategory = Category::find()
                ->andWhere(['id' => $parentId])
                ->one();

            $parentCategories[] = $parentCategory;
            $parentId = $parentCategory->parent_id;
        } while ($parentId != 0);
        return $parentCategories;
    }
}