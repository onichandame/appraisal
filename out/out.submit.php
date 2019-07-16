<?PHP
ob_end_clean();
header("Connection: close");
header("Content-Encoding: none");
ob_start();
require(realpath(dirname(__FILE__)).'/out.head.php');
echo "<p>";
echo $code;
echo "</p>";
require(realpath(dirname(__FILE__)).'/out.foot.php');
ob_end_flush();
flush();
?>
