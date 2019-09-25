<?PHP
$sql="INSERT INTO TableFileInput (id,plan,hash) VALUES (0,LAST_INSERT_ID(),UNHEX('".sha1_file($_FILES['file']['tmp_name'])."'))";
if ($conn->query($sql)===FALSE){
  $code=4;
  throw new RuntimeException("DB insertion failed after file upload");
}
$path='data/upload/';
$path=$path.$conn->insert_id;
if (move_uploaded_file($_FILES['file']['tmp_name'],$path)){
  $code=0;
} else {
  $code=5;
  throw RuntimeException("The file upload failed at server");
}
?>
