<?PHP
//return:
// 0: submission successful
// 1: No file received
// 2: File size exceeds limit
// 3: User's UUID not unique, DB error
// 4: DB insertion failed
// 5: Server internal error
  require('database/connectDB.php');
  require('submit/initTask.php');
  require('database/closeDB.php');
?>
