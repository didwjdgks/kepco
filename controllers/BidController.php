<?php
namespace kepco\controllers;

use yii\helpers\Json;
use yii\helpers\Console;

use GearmanWorker;

class BidController extends \yii\console\Controller
{
  public $csrf_token='1895ac80-2326-4af8-a79b-0160017c1eab';
  public $cookie='WMONID=GSllI5g9DRW; SRM_ID=YYzpwSGuH4Tb6jsJYPADlszzniktM6O1pex0VAOzFBQPlsZ6w3Yn!879765992!1848779880; org.springframework.web.servlet.theme.CookieThemeResolver.THEME=default';

  public function actionSearch(){
    $worker=new GearmanWorker();
    $worker->addServers('127.0.0.1');
    $worker->addFunction('kepco_bid_search',[$this,'kepco_bid_search']);
    while($worker->work());
  }

  public function actionDetail(){
    $worker=new GearmanWorker();
    $worker->addServers('127.0.0.1');
    $worker->addFunction('kepco_bid_detail',[$this,'kepco_bid_detail']);
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
        'Referer'=>'http://203.248.44.161/mdi.do?theme=default',
        'X-CSRF-TOKEN'=>$this->csrf_token,
        'Cookie'=>$this->cookie,
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
            'fromNoticeDate'=>$workload['fromNoticeDate'].'T00:00:00',
            'toNoticeDate'=>$workload['toNoticeDate'].'T23:59:59',
            'limit'=>30,
            'page'=>1,
            'start'=>0,
          ],
        ],
      ],
    ]);
    $body=$response->getBody();
    $json=Json::decode($body);

    $total=$json[0]['result']['total'];
    echo Console::ansiFormat('[검색건수] : '.$total,[Console::FG_YELLOW]),PHP_EOL;
    $rows=$json[0]['result']['records'];
    foreach($rows as $row){
      echo ' - '.$row['id'].'/'.$row['name'],PHP_EOL;
    }
  }

  public function kepco_bid_detail($job){
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
        'Referer'=>'http://203.248.44.161/mdi.do?theme=default',
        'X-CSRF-TOKEN'=>$this->csrf_token,
        'Cookie'=>$this->cookie,
      ],
    ]);
    $response=$httpClient->request('POST','/router',[
      'json'=>[
        [
          'action'=>'smartsuit.ui.etnajs.pro.rfx.sp.BidDetailController',
          'method'=>'findBidBasicInfo',
          'tid'=>51,
          'type'=>'rpc',
          'data'=>[$workload['id']],
        ],
        
        [
          'action'=>'smartsuit.ui.etnajs.pro.rfx.sp.BidDetailController',
          'method'=>'findBidChangeTimeDetailList',
          'tid'=>52,
          'type'=>'rpc',
          'data'=>[
            [
              'bidFileType'=>'Bid',
              'bidId'=>$workload['id'],
              'fileGroupId'=>'ProductBidFileGroup',
              'limit'=>100,
              'page'=>1,
              'start'=>0,
              'type'=>'Bid',
            ],
          ],
        ],

        [
          'action'=>'smartsuit.ui.etnajs.pro.rfx.sp.BidDetailController',
          'method'=>'findBidItems',
          'tid'=>53,
          'type'=>'rpc',
          'data'=>[
            [
              'bidFileType'=>'Bid',
              'bidId'=>$workload['id'],
              'fileGroupId'=>'ProductBidFileGroup',
              'limit'=>100,
              'page'=>1,
              'start'=>0,
              'type'=>'Bid',
            ],
          ],
        ],

        [
          'action'=>'smartsuit.ui.etnajs.pro.rfx.sp.BidDetailController',
          'method'=>'findProgressStateSPList',
          'tid'=>54,
          'type'=>'rpc',
          'data'=>[
            [
              'bidFileType'=>'Bid',
              'bidId'=>$workload['id'],
              'fileGroupId'=>'ProductBidFileGroup',
              'limit'=>100,
              'page'=>1,
              'start'=>0,
              'type'=>'Bid',
            ],
          ],
        ],

        [
          'action'=>'smartsuit.ui.etnajs.pro.rfx.sp.BidDetailController',
          'method'=>'getFileItemList',
          'tid'=>55,
          'type'=>'rpc',
          'data'=>[
            [
              'bidFileType'=>'Bid',
              'bidId'=>$workload['id'],
              'fileGroupId'=>'ProductBidFileGroup',
              'limit'=>100,
              'page'=>1,
              'start'=>0,
              'type'=>'Bid',
            ],
          ],
        ],

      ],
    ]);
    $body=$response->getBody();
    $json=Json::decode($body);

    foreach($json as $row){
      switch($row['method']){
      case 'findBidBasicInfo':
        $findBidBasicInfo=$row;
        break;
      case 'findBidChangeTimeDetailList':
        $findBidChangeTimeDetail=$row;
        break;
      case 'findBidItems':
        $findBidItems=$row;
        break;
      case 'findProcessStateSPList':
        $findProcessStateSPList=$row;
        break;
      case 'getFileItemList':
        $getFileItemList=$row;
        break;
      }
    }

    echo ' > 입찰참가등록마감일시: '.$findBidBasicInfo['result']['bidAttendRequestCloseDateTime'],PHP_EOL;
  }
}

