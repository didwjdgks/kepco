<?php
namespace kepco\controllers;

use yii\helpers\Json;
use yii\helpers\Console;

use GearmanWorker;

class BidController extends \yii\console\Controller
{
  public function actionSearch(){
    $worker=new GearmanWorker();
    $worker->addServers('127.0.0.1');
    $worker->addFunction('kepco_bid_search',[$this,'kepco_bid_search']);
    while($worker->work());
  }

  public function kepco_bid_search($job){
    echo $job->workload(),PHP_EOL;
    $workload=Json::decode($job->workload());

    $httpClient=new \GuzzleHttp\Client([
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
        'X-CSRF-TOKEN'=>'691d22ea-6b3c-495f-91c6-f092d95618ef',
        'Cookie'=>'WMONID=GSllI5g9DRW; SRM_ID=1drpU9QDWi5WoIszuYHTP81SY3NvpwGfYYDZPj6SKegK-M4nSklY!879765992!1848779880; org.springframework.web.servlet.theme.CookieThemeResolver.THEME=default',
      ],
    ]);
    $response=$httpClient->request('POST','/router',[
      'json'=>[
        'action'=>'smartsuit.ui.etnajs.pro.rfx.sp.BidListController',
        'method'=>'findNoticeSPList',
        'tid'=>'18',
        'type'=>'rpc',
        'data'=>[
          [
            'companyId'=>'ALL',
            'fromNoticeDate'=>'2016-03-01T00:00:00',
            'toNoticeDate'=>'2016-04-06T00:00:00',
            'limit'=>30,
            'page'=>1,
            'start'=>0,
          ],
        ],
      ],
    ]);
    $body=$response->getBody();
    $json=Json::decode($body);

    $rows=$json[0]['result']['records'];
    foreach($rows as $row){
      \yii\helpers\VarDumper::dump($row);
    }
  }
}

