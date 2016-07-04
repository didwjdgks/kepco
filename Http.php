<?php
namespace kepco;

use yii\helpers\Json;

class Http extends \yii\base\Component
{
  public $client;

  public function init(){
    $this->client=new \GuzzleHttp\Client([
      'base_uri'=>'http://203.248.44.161',
      'cookies'=>true,
      'headers'=>[
        'User-Agent'=>'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
        'Content-Type'=>'application/json',
        'X-Requested-With'=>'XMLHttpRequest',
        'Accept-Language'=>'ko',
        'Accept-Encoding'=>'gzip, deflate',
        'DNT'=>'1',
        'Pragma'=>'no-cache',
        'Connection'=>'Keep-Alive',
        'Accept'=>'*/*',
        'Referer'=>'http://203.248.44.161/mdi.do?theme=default',
      ],
    ]);
  }

  public function request($method,$uri='',array $options=[]){
    $res=$this->client->request($method,$uri,$options);
    $body=$res->getBody();
    $html=(string)$body;
    return $html;
  }

  public function json_post($uri,array $options=[]){
    $res=$this->client->request('POST',$uri,$options);
    $body=$res->getBody();
    $json=Json::decode($body);
    return $json;
  }
}

