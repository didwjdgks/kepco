<?php
namespace kepco\controllers;

use yii\helpers\Json;
use yii\helpers\Console;

use GearmanWorker;

class BidController extends \yii\console\Controller
{
  public $csrf_token='a8077655-a64e-427d-960e-edd86721f475';
  public $cookie='WMONID=GSllI5g9DRW; SRM_ID=RiTvxz94G6NvIdNIXiEiJWAwmO_bs5MQahGxJd-XFjUOWVDfjIrD!2008483430!NONE; org.springframework.web.servlet.theme.CookieThemeResolver.THEME=default; pop23139=done';

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

    try{

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

      if(!empty($workload['recently'])){
        $fromNoticeDate=date('Y-m-d',strtotime($workload['recently']));
        $toNoticeDate=date('Y-m-d');
      }else{
        $fromNoticeDate=$workload['fromNoticeDate'];
        $toNoticeDate=$workload['toNoticeDate'];
      }

      if(empty($fromNoticeDate) || empty($toNoticeDate)) return;
      echo " > 검색기간 : $fromNoticeDate ~ $toNoticeDate",PHP_EOL;

      $limit=30;

      $json_post=[
        'action'=>'smartsuit.ui.etnajs.pro.rfx.sp.BidListController',
        'method'=>'findNoticeSPList',
        'tid'=>'18',
        'type'=>'rpc',
        'data'=>[
          [
            'companyId'=>'ALL',
            'fromNoticeDate'=>$fromNoticeDate.'T00:00:00',
            'toNoticeDate'=>$toNoticeDate.'T23:59:59',
            'limit'=>$limit,
            'page'=>1,
            'start'=>0,
          ],
        ],
      ];

      $response=$httpClient->request('POST','/router',[
        'json'=>$json_post,
      ]);
      $body=$response->getBody();
      $json=Json::decode($body);

      $total=$json[0]['result']['total'];
      echo Console::ansiFormat('[검색건수] : '.$total,[Console::FG_YELLOW]),PHP_EOL;

      if(empty($total)) return;

      $rows=$json[0]['result']['records'];
      foreach($rows as $row){
        echo ' - '.$row['id'].' '
                  .$row['no'].' '
                  .$row['name'].' '
                  ,PHP_EOL;
      }

      $lastPage=ceil($total/$limit);
      for($page=2; $page<=$lastPage; $page++){
        $start=($limit*$page)-$limit;
        $json_post['data'][0]['page']=$page;
        $json_post['data'][0]['start']=$start;

        $response=$httpClient->request('POST','/router',[
          'json'=>$json_post,
        ]);
        $body=$response->getBody();
        $json=Json::decode($body);
        $rows=$json[0]['result']['records'];
        echo " > page : $page / $lastPage",PHP_EOL;
        foreach($rows as $row){
          sleep(1);
          echo ' - '.$row['id'].' '
                    .$row['no'].' '
                    .$row['name'].' '
                    ,PHP_EOL;
        }
      }
    }catch(\Exception $e){
      echo Console::ansiFormat($e->getMessage(),[Console::FG_RED]),PHP_EOL;
      return false;
    }
  }

  public function kepco_bid_detail($job){
    echo $job->workload(),PHP_EOL;
    $workload=Json::decode($job->workload());

    try{

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

      file_put_contents(\Yii::getAlias('@vendor').'/didwjdgks/kepco/temp/'.$workload['id'],\yii\helpers\VarDumper::dumpAsString($json));

      foreach($json as $row){
        switch($row['method']){
        case 'findBidBasicInfo':
          $findBidBasicInfo=$row['result'];
          break;
        case 'findBidChangeTimeDetailList':
          $findBidChangeTimeDetail=$row['result'];
          break;
        case 'findBidItems':
          $findBidItems=$row['result'];
          break;
        case 'findProcessStateSPList':
          $findProcessStateSPList=$row['result'];
          break;
        case 'getFileItemList':
          $getFileItemList=$row['result'];
          break;
        }
      }

      echo ' > 입찰참가등록마감일시: '.$findBidBasicInfo['bidAttendRequestCloseDateTime'],PHP_EOL;
    }
    catch(\Exception $e){
      echo Console::ansiFormat($e->getMessage(),[Console::FG_RED]),PHP_EOL;
      return;
    }
  }
}

