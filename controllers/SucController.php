<?php
namespace kepco\controllers;

use yii\helpers\Json;
use yii\helpers\Console;
use yii\helpers\VarDumper;

use GearmanWorker;

class SucController extends \yii\console\Controller
{
  public $csrf_token='1895ac80-2326-4af8-a79b-0160017c1eab';
  public $cookie='WMONID=GSllI5g9DRW; SRM_ID=YYzpwSGuH4Tb6jsJYPADlszzniktM6O1pex0VAOzFBQPlsZ6w3Yn!879765992!1848779880; org.springframework.web.servlet.theme.CookieThemeResolver.THEME=default';

  public function actionSearch(){
    $worker=new GearmanWorker();
    $worker->addServers('127.0.0.1');
    $worker->addFunction('kepco_suc_search',[$this,'kepco_suc_search']);
    while($worker->work());
  }

  public function actionDetail(){
    $worker=new GearmanWorker();
    $worker->addServers('127.0.0.1');
    $worker->addFunction('kepco_suc_detail',[$this,'kepco_suc_detail']);
    $worker->addFunction('kepco_suc_detail_pur',[$this,'kepco_suc_detail_pur']);
    while($worker->work());
  }

  public function kepco_suc_search($job){
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
        'action'=>'smartsuit.ui.etnajs.pro.rfx.sp.OpenInfoDataListController',
        'method'=>'findOpenInfoDataBidList',
        'tid'=>16,
        'type'=>'rpc',
        'data'=>[
          [
            'companyId'=>'ALL',
            'fromNoticeDate'=>$workload['fromNoticeDate'].'T00:00:00',
            'toNoticeDate'=>$workload['toNoticeDate'].'T23:59:59',
            'limit'=>100,
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

  public function kepco_suc_detail($job){
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
          'action'=>'smartsuit.ui.etnajs.pro.rfx.sp.OpenInfoDataDetailController',
          'method'=>'findOpenInfoDataAttendGrid',
          'tid'=>118,
          'type'=>'rpc',
          'data'=>[$workload['id']],
        ],

        [
          'action'=>'smartsuit.ui.etnajs.pro.rfx.sp.OpenInfoDataDetailController',
          'method'=>'findProposalEvalOpenYn',
          'tid'=>119,
          'type'=>'rpc',
          'data'=>[$workload['id']],
        ],
      ],
    ]);
    $body=$response->getBody();
    $json=Json::decode($body);

    VarDumper::dump($json);
  }

  /**
   * 구매
   */
  public function kepco_suc_detail_pur($job){
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
          'method'=>'findBidDetail',
          'tid'=>181,
          'type'=>'rpc',
          'data'=>[$workload['id']],
        ],
      ],
    ]);
    $body=$response->getBody();
    $json=Json::decode($body);

    $response=$httpClient->request('POST','/router',[
      'json'=>[
        'action'=>'smartsuit.ui.etnajs.pro.rfx.OpenInfoDataDetailController',
        'method'=>'findOpenInfoDataDetail',
        'tid'=>182,
        'type'=>'rpc',
        'data'=>[
          $json[0]['result'],
        ],
      ],
    ]);
    $body=$response->getBody();
    $json=Json::decode($body);

    $rows=$json[0]['result'];
    foreach($rows as $row){
      echo ' > '.$row['ranking'].','
                .$row['vendorName'].','
                .$row['vendorRegistrationNo'].','
                .$row['representativeName'].','
                .$row['attendAmount'].','
                .$row['quantity'].','
                .$row['attendRate'].','
                .$row['submitDateTime'].','
                .$row['lotteryNum'].','
                .$row['note'],PHP_EOL;
    }
  }
}

