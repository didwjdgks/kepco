<?php
namespace kepco\models\i2;

use kepco\Module;

class BidKey extends \yii\db\ActiveRecord
{
  public static function tableName(){
    return 'bid_key';
  }

  public static function getDb(){
    return Module::getInstance()->i2db;
  }

  public function beforeSave($insert){
    if(parent::beforeSave($insert)){
      if($this->notinum) $this->notinum=iconv('utf-8','cp949',$this->notinum);
      if($this->constnm) $this->constnm=iconv('utf-8','cp949',$this->constnm);
      if($this->org) $this->org=iconv('utf-8','cp949',$this->org);
      if($this->org_i) $this->org_i=iconv('utf-8','cp949',$this->org_i);
      return true;
    }else{
      return false;
    }
  }

  public function afterFind(){
    parent::afterFind();

    if($this->notinum) $this->notinum=iconv('cp949','utf-8',$this->notinum);
    if($this->constnm) $this->constnm=iconv('cp949','utf-8',$this->constnm);
    if($this->org) $this->org=iconv('cp949','utf-8',$this->org);
    if($this->org_i) $this->org_i=iconv('cp949','utf-8',$this->org);
  }
}

