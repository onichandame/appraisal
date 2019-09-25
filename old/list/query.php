<?PHP
$condition="";
foreach ($_GET['uid'] as $value){
  $condition.='UUID=';
  $condition.=$value;
  $condition.=' OR ';
}
$condition=rtrim($condition,' OR ');
$sql='SELECT * FROM TablePlan WHERE '.$condition;
echo $sql;
echo '<br>';
require(realpath(dirname(__FILE__)).'/../out/out.list.php');
?>
