<?PHP
  require_once('connectDB.php');
  $tableplan=array(
    'UUID'=>'VARCHAR(50) NOT NULL UNIQUE KEY',
    'id'=>'INT NOT NULL AUTO_INCREMENT PRIMARY KEY',
    'submit_date_time'=>'DATETIME NOT NULL',
    'start_date_time'=>'DATETIME',
    'total_time'=>'BIGINT',
    'status'=>'TINYINT NOT NULL',
    'finish_date_time'=>'DATETIME');
  $tablefileinput=array(
    'id'=>'INT NOT NULL AUTO_INCREMENT PRIMARY KEY',
    'plan'=>'INT NOT NULL',
    'hash'=>'BINARY(20) NOT NULL');
  $tablefileoutput=array(
    'id'=>'INT NOT NULL AUTO_INCREMENT PRIMARY KEY',
    'plan'=>'INT NOT NULL',
    'hash'=>'BINARY(20) NOT NULL');
  $tables=array(
    'TablePlan'=>$tableplan,
    'TableFileInput'=>$tablefileinput,
    'TableFileOutput'=>$tablefileoutput);
  foreach($tables as $table=>$columns){
    $temp="";
    foreach($columns as $column=>$type){
      $temp=$temp.$column." ".$type.",";
    }
    $temp=rtrim($temp,",");
    $sql="CREATE TABLE IF NOT EXISTS ".$table." (".$temp.")";
    if($conn->query($sql)===FALSE){
      throw new RuntimeException('Creation of Tables Failed');
    }
  }
?>
