<?PHP
  require_once('DBsettings.php');
  $conn= new mysqli($hostname,$username,$password,$dbname);
  if($conn->connect_error){
    die("Connection failed: " . $conn->connect_error);
  }
?>
