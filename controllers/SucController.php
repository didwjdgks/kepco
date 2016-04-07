<?php
namespace kepco\controllers;

use yii\helpers\Json;
use yii\helpers\Console;
use yii\helpers\VarDumper;

use GearmanWorker;

class SucController extends \yii\console\Controller
{
  public $csrf_token='5d55a19a-40d6-48c9-b9ac-906e5e54fc1d';
  public $cookie='WMONID=GSllI5g9DRW; SRM_ID=vr_uAKafPkTwohcRsD6hs3rtrOP0MsQhNb2PQnhfnEz2ZWsUsQmQ!-2096506436!NONE; org.springframework.web.servlet.theme.CookieThemeResolver.THEME=default; pop23139=done';

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

  /**
   * 낙찰검색
   */
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

    if(!empty($workload['recently'])){
      $fromNoticeDate=date('Y-m-d',strtotime($workload['recently']));
      $toNoticeDate=date('Y-m-d');
    }else{
      $fromNoticeDate=$workload['fromNoticeDate'];
      $toNoticeDate=$workload['toNoticeDate'];
    }

    $limit=100;

    $response=$httpClient->request('POST','/router',[
      'json'=>[
        'action'=>'smartsuit.ui.etnajs.pro.rfx.sp.OpenInfoDataListController',
        'method'=>'findOpenInfoDataBidList',
        'tid'=>16,
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
      ],
    ]);
    $body=$response->getBody();
    $json=Json::decode($body);

    $total=$json[0]['result']['total'];
    echo Console::ansiFormat('[검색건수] : '.$total,[Console::FG_YELLOW]),PHP_EOL;
    $rows=$json[0]['result']['records'];
    foreach($rows as $row){
      sleep(1);
      echo ' - '.$row['id'].'/'
                .$row['bidResultStateInOpenInfoData'].'/' //입찰결과
                //.$row['companyId'].'/' //회사이름
                .$row['purchaseType'].'/' //구매유형
                .$row['no'].'/' //공고번호
                .$row['revision'].'/' //공고차수
                .$row['bidRevision'].'/' //입찰차수
                .$row['name'].'/' //공고명
                //.$row['placeName'].'/' //공고부서
                //.$row['noticeDate'].'/' //공고일자
                //.$row['competitionType'].'/' //계약방법
                //.$row['bidType'].'/' //낙찰자선정
                //.$row['noticeType'].'/' //공고종류
                //.$row['bidAttendRequestCloseDateTime'].'/' //입찰참가 마감일시
                //.$row['beginDateTime'].'/' //입찰서 제출 개시일시
                //.$row['endDateTime'].'/' //입찰서 제출 마감일시
                ,PHP_EOL;
    }

    $lastPage=ceil($total/$limit);
    for($page=2; $page<=$lastPage; $page++){
      $start=($limit*$page)-$limit;
      $response=$httpClient->request('POST','/router',[
        'json'=>[
          'action'=>'smartsuit.ui.etnajs.pro.rfx.sp.OpenInfoDataListController',
          'method'=>'findOpenInfoDataBidList',
          'tid'=>16,
          'type'=>'rpc',
          'data'=>[
            [
              'companyId'=>'ALL',
              'fromNoticeDate'=>$fromNoticeDate.'T00:00:00',
              'toNoticeDate'=>$toNoticeDate.'T23:59:59',
              'limit'=>$limit,
              'page'=>$page,
              'start'=>$start,
            ],
          ],
        ],
      ]);
      $body=$response->getBody();
      $json=Json::decode($body);

      $rows=$json[0]['result']['records'];
      echo ' > page : '.$page.' / '.$lastPage,PHP_EOL;
      foreach($rows as $row){
        sleep(1);
        echo ' - '.$row['id'].'/'
                  .$row['bidResultStateInOpenInfoData'].'/' //입찰결과
                  //.$row['companyId'].'/' //회사이름
                  .$row['purchaseType'].'/' //구매유형
                  .$row['no'].'/' //공고번호
                  .$row['revision'].'/' //공고차수
                  .$row['bidRevision'].'/' //입찰차수
                  .$row['name'].'/' //공고명
                  //.$row['placeName'].'/' //공고부서
                  //.$row['noticeDate'].'/' //공고일자
                  //.$row['competitionType'].'/' //계약방법
                  //.$row['bidType'].'/' //낙찰자선정
                  //.$row['noticeType'].'/' //공고종류
                  //.$row['bidAttendRequestCloseDateTime'].'/' //입찰참가 마감일시
                  //.$row['beginDateTime'].'/' //입찰서 제출 개시일시
                  //.$row['endDateTime'].'/' //입찰서 제출 마감일시
                  ,PHP_EOL;
      }
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
          'method'=>'findBidBasicInfo',
          'tid'=>181,
          'type'=>'rpc',
          'data'=>[$workload['id']],
        ],
      ],
    ]);
    $body=$response->getBody();
    $json=Json::decode($body);

    $bidData=$json[0]['result'];
    echo ' > 예정가격 : '.$bidData['estimatedAmount'],PHP_EOL;

    $response=$httpClient->request('POST','/router',[
      'json'=>[
        'action'=>'smartsuit.ui.etnajs.pro.rfx.OpenInfoDataDetailController',
        'method'=>'findOpenInfoDataDetail',
        'tid'=>182,
        'type'=>'rpc',
        'data'=>[$bidData],
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

    $multispare=$this->getMultispare($httpClient,$workload['id']);
    echo ' > 추첨번호 : '.join('-',$multispare['selms']).', 복수예가 : '.join('/',$multispare['multispares']),PHP_EOL;
  }

  /**
   * 복수예가
   */
  public function getMultispare($httpClient,$id){
    $response=$httpClient->request('POST','/router',[
      'json'=>[
        [
          'action'=>'smartsuit.ui.etnajs.pro.rfx.BidDetailController',
          'method'=>'findByIdBidMultiEstimatedPriceList',
          'tid'=>21,
          'type'=>'rpc',
          'data'=>[
            [
              'bidId'=>$id,
              'limit'=>100,
              'page'=>1,
              'start'=>0,
              'type'=>'select',
            ],
          ],
        ],

        [
          'action'=>'smartsuit.ui.etnajs.pro.rfx.BidDetailController',
          'method'=>'findByIdBidMultiEstimatedPriceList',
          'tid'=>22,
          'type'=>'rpc',
          'data'=>[
            [
              'bidId'=>$id,
              'limit'=>100,
              'page'=>1,
              'start'=>0,
              'type'=>'noneSelect',
            ],
          ],
        ],
      ],
    ]);
    $body=$response->getBody();
    $json=Json::decode($body);

    foreach($json as $row){
      switch($row['tid']){
      case 21:
        $select=$row['result'];
        break;
      case 22:
        $noneSelect=$row['result'];
        break;
      }
    }
    
    $multispares=[];
    $selms=[];

    if(is_array($select)){
      foreach($select as $row){
        $multispares[$row['no']]=$row['price'];
        $selms[]=$row['no'];
      }
    }

    if(is_array($noneSelect)){
      foreach($noneSelect as $row){
        $multispares[$row['no']]=$row['price'];
      }
    }

    return [
      'selms'=>$selms,
      'multispares'=>$multispares,
    ];
  }
}

