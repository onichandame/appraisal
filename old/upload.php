<!DOCTYPE html>
<html>
<head>
  <title>Upload your files</title>
</head>
<body>
  <form enctype="multipart/form-data" action="upload.php" method="POST">
    Physician UID: <input type="text" name="physuid"><br>
    Physician Name: <input type="text" name="physname"><br>
    Plan UID: <input type="text" name="planuid"><br>
    File: <input type="file" name="uploaded_file"><br>
    <input type="submit" value="Upload"></input>
  </form>
</body>
</html>
<?PHP
  $hostname="localhost";
  $username="mctpsdemo";
  $password="123456";
  $dbname="mctpsdemo";
  $conn= new mysqli($hostname,$username,$password,$dbname);
  if($conn->connect_error){
    die("Connection failed: " . $conn->connect_error);
  }
  $sql="INSERT INTO TablePlan (PhysicianUID,PhysicianName,PlanUID) VALUES ('" . $_POST['physuid']."','".$_POST['physname']."','".$_POST['planuid']."')";
  if ($conn->query($sql)===TRUE){
    echo "New record created.";
  } else{
    echo "record creation failed.".$conn->error;
  }
  if(!empty($_FILES['uploaded_file']))
  {
    $path = "upload/";
    $path = $path . basename( $_FILES['uploaded_file']['name']);
    if(move_uploaded_file($_FILES['uploaded_file']['tmp_name'], $path)) {
      echo "The file ".  basename( $_FILES['uploaded_file']['name']). 
      " has been uploaded";
    } else{
        echo "There was an error uploading the file, please try again!";
    }
  }
  $conn->close();
?>
