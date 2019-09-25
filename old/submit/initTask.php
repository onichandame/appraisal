<?PHP
$code=-1;
if (!isset($_FILES['file']['error']) || is_array($_FILES['file']['error'])){
  $code=1;
  throw new RuntimeException('Invalid file');
}
switch ($_FILES['file']['error']) {
  case UPLOAD_ERR_OK:
    break;
  case UPLOAD_ERR_NO_FILE:
    $code=1;
    throw new RuntimeException('No file sent.');
  case UPLOAD_ERR_INI_SIZE:
  case UPLOAD_ERR_FORM_SIZE:
    $code=2;
    throw new RuntimeException('Exceeded filesize limit.');
  default:
    throw new RuntimeException('Unknown errors.');
}

$sql="INSERT INTO TablePlan (UUID,id,submit_date_time,status) VALUES ('".$_POST['planuid']."',0,NOW(),3)";
echo $sql;
if ($conn->query($sql)===FALSE){
  $code=4;
  throw new RuntimeException('Commit failed');
}
require(realpath(dirname(__FILE__)).'/moveFile.php');
require(realpath(dirname(__FILE__)).'/../out/out.submit.php');
?>
