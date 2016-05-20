<?php
/**
 * @author Kozulyaev
 */

namespace common\models\queries;

use common\components\SoftDeleteQuery;
use yii\db\ActiveQuery;

class UserQuery extends ActiveQuery
{
    use SoftDeleteQuery;

    public function phone($phone)
    {
        $this->andWhere(['phone' => $phone]);
        return $this;
    }

    public function email($email)
    {
        $this->andWhere(['email' => $email]);
        return $this;
    }

    public function phoneOrEmail($data) {
        $this->orWhere(['phone' => $data])
            ->orWhere(['email' => $data]);
        return $this;
    }

    public function status($status)
    {
        $this->andWhere(['status' => $status]);
        return $this;
    }
    public function passwordResetToken($token)
    {
        $this->andWhere(['password_reset_token' => $token]);
        return $this;
    }

    public function likeFullName($fullName)
    {
        $chunks = explode(' ', $fullName);
        $condition = [];
        $params = [];

        foreach ($chunks as $key => $chunk) {
            $condition[] = "lower(lastname) LIKE :chunk{$key} OR lower(firstname) LIKE :chunk{$key}";
            $params["chunk{$key}"] = '%' . strtolower($chunk) . '%';
        }

        $this->andWhere(implode(" OR ", $condition), $params);
        return $this;
    }

    public function likeEmail($email)
    {
        $this->andWhere('LOWER(email) LIKE :email', ['email' => '%' . strtolower($email) . '%']);
        return $this;
    }

    public function emailOrPhone($email = null, $phone = null)
    {
        if ($email) {
            $this->orWhere(['email' => $email]);
        }

        if ($phone) {
            $this->orWhere(['phone' => $phone]);
        }

        return $this;
    }

    public function code($code)
    {
        $this->andWhere(['sms_code' => $code]);
        return $this;
    }
}