<?php
/**
 *  @author Kozulyaev
 */
namespace common\helpers;

use yii\base\InvalidParamException;
use yii\helpers\StringHelper;

class ExtStringHelper extends StringHelper
{
    const RUSSIAN_LAYOUT = 0;
    const ENGLISH_LAYOUT = 1;

    public static $RUS_LAYOUT_DICTIONARY = [
        "й","ц","у","к",
        "е","н","г",
        "ш","щ","з",
        "х","ъ","ф",
        "ы","в","а",
        "п","р","о",
        "л","д","ж",
        "э","я","ч",
        "с","м","и",
        "т","ь","б",
        "ю",".",
    ];

    public static $ENG_LAYOUT_DICTIONARY = [
        "q","w","e","r",
        "t","y","u",
        "i","o","p",
        "[","]","a",
        "s","d","f",
        "g","h","j",
        "k","l",";",
        "'","z","x",
        "c","v","b",
        "n","m",",",
        ".","/",
    ];

    /**
     * Convert string to another keyboard layout
     * @param $string
     * @param int $from - from layout
     * @param int $to - to layout
     * @return string - converted string
     */
    public static function convertToLayout($string, $from = self::RUSSIAN_LAYOUT, $to = self::ENGLISH_LAYOUT)
    {
        if ($from == self::RUSSIAN_LAYOUT) {
            $key = self::$RUS_LAYOUT_DICTIONARY;
        } elseif ($from == self::ENGLISH_LAYOUT) {
            $key = self::$ENG_LAYOUT_DICTIONARY;
        } else {
            throw new InvalidParamException;
        }

        if ($to == self::RUSSIAN_LAYOUT) {
            $value = self::$RUS_LAYOUT_DICTIONARY;
        } elseif ($to == self::ENGLISH_LAYOUT) {
            $value = self::$ENG_LAYOUT_DICTIONARY;
        } else {
            throw new InvalidParamException;
        }

        $dictionary = array_combine($key, $value);
        $string = strtolower($string);
        $stringToArray = (mb_detect_encoding($string) == 'UTF-8' ? preg_split('//u', $string, -1, PREG_SPLIT_NO_EMPTY) : str_split($string));

        foreach ($stringToArray as &$char) {
            $char = ExtArrayHelper::getValue($dictionary, $char, $char);
        }

        return implode('', $stringToArray);
    }
}