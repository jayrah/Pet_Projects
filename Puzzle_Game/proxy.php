<?
header('Content-type:text/plain');
$daurl = 'http://labs.funspot.tv/worktest_color_memory/colours.conf';
$handle = fopen($daurl, "r");
if ($handle) {
    while (!feof($handle)) {
        $buffer = fgets($handle, 4096);
        echo $buffer;
    }
    fclose($handle);
}
?>
