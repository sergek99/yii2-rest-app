<?php
/**
 * Created by PhpStorm.
 * User: serbge
 * Date: 30.09.15
 * Time: 16:29
 */

namespace common\components;


use yii\web\RequestParserInterface;

class PutFileParser implements RequestParserInterface {
    /**
     * Parses a HTTP request body.
     * @param string $rawBody the raw HTTP request body.
     * @param string $contentType the content type specified for the request body.
     * @return array parameters parsed from the request body
     */
    public function parse($rawBody, $contentType)
    {
        $boundary = substr($rawBody, 0, strpos($rawBody, "\r\n"));

        $parts = array_slice(explode($boundary, $rawBody), 1);
        $data = array();

        foreach ($parts as $part) {
            if ($part == "--\r\n") break;

            $part = ltrim($part, "\r\n");
            list($rawHeaders, $body) = explode("\r\n\r\n", $part, 2);

            $rawHeaders = explode("\r\n", $rawHeaders);
            $headers = array();
            foreach ($rawHeaders as $header) {
                list($name, $value) = explode(':', $header);
                $headers[strtolower($name)] = ltrim($value, ' ');
            }

            if (isset($headers['content-disposition'])) {
                $filename = null;
                preg_match(
                    '/^(.+); *name="([^"]+)"(; *filename="([^"]+)")?/',
                    $headers['content-disposition'],
                    $matches
                );
                list(, $type, $name) = $matches;
                isset($matches[4]) and $filename = $matches[4];

                switch ($name) {
                    case 'file':
                        $data[$name] = [
                            'fileName'=>$filename,
                            'fileBody' => $body
                        ];
                        break;

                    default:
                        $data[$name] = substr($body, 0, strlen($body) - 2);
                        break;
                }
            }

        }

        return $data;
    }

}