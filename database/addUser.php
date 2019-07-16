<?PHP
// return:
// 0: Insertion succeeded/User exists
// 1: Cannot access database
// 2: Insertion failed
// 3: Empty input
  $sql="SELECT id FROM TableUser WHERE UUID='".$_POST['physuid']."'";
  if ($result=$conn->query($sql)){
    if($result->num_rows==0){
      if (empty($_POST['physuid'])){
        throw new RuntimeException('Empty PhysUID');
      }
      $sql="INSERT INTO TableUser (UUID,creation_date_time,id) VALUES ('".$_POST['physuid']."',NOW(),0)";
      if ($conn->query($sql)===TRUE){
      }else{
        throw new RuntimeException('Insertion failed');
      }
    } else{
    }
  } else{
    throw new RuntimeException('Database not accessible');
  }
?>
