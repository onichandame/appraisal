<?PHP
$sql='SELECT id FROM TablePlan WHERE UUID='.$_GET['uid'].' AND status=0';
$id=0;
if ($result=$conn->query($sql)){
  if(mysqli_num_rows($result)<>1){
    throw new RuntimeException("DB error");
  }
  $row=mysqli_fetch_array($result,MYSQLI_ASSOC);
  $id=$row['id'];
}else{
  throw new RuntimeException("down DB error");
}
require(realpath(dirname(__FILE__)).'/finalCheck.php');
?>
