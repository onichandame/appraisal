<?PHP
$fid=0;
$sql="SELECT id,plan FROM TableFileOutput WHERE plan=".$id;
if ($result=$conn->query($sql)){
  if ($result->num_rows<>1){
    throw new RuntimeException("final failed");
  }else{
    $row=mysqli_fetch_array($result,MYSQLI_ASSOC);
    $tmp=$row['id'];
    if(file_exists('data/download/'.$tmp)){
      $fid=$tmp;
    }
  }
}else{
  throw new RuntimeException("final check failed");
}
require(realpath(dirname(__FILE__)).'/../out/out.download.php');
?>
