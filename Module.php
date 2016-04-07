<?php
namespace kepco;

use yii\db\Connection;
use yii\di\Instance;

class Module extends \yii\base\Module
{
  public $i2db='i2db';

  public function init(){
    parent::init();

    $this->i2db=Instance::ensure($this->i2db,Connection::className());
  }
}

