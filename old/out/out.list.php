<?PHP
ob_end_clean();
header("Connection: close");
header("Content-Encoding: none");
ob_start();
require(realpath(dirname(__FILE__)).'/out.head.php');
echo "<p>";
echo "<table>";
echo "<tr>";
echo "<th>";
echo 'UUID';
echo "</th>";
echo "<th>";
echo 'submit_date_time';
echo "</th>";
echo "<th>";
echo 'start_date_time';
echo "</th>";
echo "<th>";
echo 'total_time';
echo "</th>";
echo "<th>";
echo 'status';
echo "</th>";
echo "<th>";
echo 'finish_date_time';
echo "</th>";
echo "</tr>";
if ($result=$conn->query($sql)){
  while($row=mysqli_fetch_array($result,MYSQLI_ASSOC)){
    echo "<tr>";
    echo "<td>";
    echo $row['UUID'];
    echo "</td>";
    echo "<td>";
    echo $row['submit_date_time'];
    echo "</td>";
    echo "<td>";
    echo $row['start_date_time'];
    echo "</td>";
    echo "<td>";
    echo $row['total_time'];
    echo "</td>";
    echo "<td>";
    echo $row['status'];
    echo "</td>";
    echo "<td>";
    echo $row['finish_date_time'];
    echo "</td>";
    echo "</tr>";
  }
}else{
  throw new RuntimeException("DB error");
}
echo "</table>";
echo "</p>";
require(realpath(dirname(__FILE__)).'/out.foot.php');
ob_end_flush();
flush();
?>
