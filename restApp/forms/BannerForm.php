<?php
/**
 * @author Kozulyaev
 */
namespace restApp\forms;

use common\models\Banners as Banner;
use yii\base\Model;

class BannerForm extends Model
{

    /**
     * @var \yii\web\UploadedFile
     */
    public $file;

    public $title;
    public $place;
    public $url;
    public $order;

    public function rules()
    {
        return [
            [['title', 'url'], 'required'],
            ['file', 'file', 'extensions' => ['png', 'jpg', 'gif'], 'maxSize' => 1024*1024],
            ['title', 'string'],
            [['place', 'order'], 'number'],
            ['url', 'url', 'defaultScheme' => 'http'],
        ];
    }


    public function save()
    {
        if($this->validate()) {
            $this->file->saveAs(
                \Yii::$app->params['BannersPath']
                . $this->file->baseName
                . '.'
                . $this->file->extension
            );

            $baner = new Banner();
            if(isset($this->file)) {
                $baner->file = $this->file->baseName . '.' . $this->file->extension;
            }
            $baner->title = $this->title;
            $baner->url = $this->url;
            $baner->place = (int)$this->place;

            return $baner->save() ? $baner : false;
        }

        return false;
    }

    public function edit($id)
    {
        if($this->file != '') {
            $this->file->saveAs(
                \Yii::$app->params['BannersPath']
                . $this->file->baseName
                . '.'
                . $this->file->extension
            );
        }

        $baner = Banner::find()->andWhere(['id'=>$id])->one();
        if($this->file !='') {
            $baner->file = $this->file->baseName . '.' . $this->file->extension;
        }
        $baner->title = $this->title;
        $baner->url = $this->url;
        $baner->place = (int)$this->place;

        return $baner->save() ? $baner : false;
    }

}