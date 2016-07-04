<?php
namespace kepco\watchers;

use kepco\Module;
use kepco\Http;

class BidWatcher extends \yii\base\Component
{
  public $http;

  public function init(){
    parent::init();
    $this->http=Module::getInstance()->http;
  }

  public function watch(){
  }
}

