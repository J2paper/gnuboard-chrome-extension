<?php
/**
 그누보드4 쪽지알림 for Google Chrome Extension
 server side code
 */
$g4_path = ".";
include_once("$g4_path/_common.php");
include_once("$g4[path]/lib/connect.lib.php");
header ("Content-Type:text/xml");
if(!$member[mb_id]) {	// not logged in
	echo "<error>NOT_LOGIN</error>";
	exit;
}
$mb_id = $member[mb_id];
/**
 * structure:
 *	newMemos
 *		total
 *		nextUpate
 *		memo
 *			name
 *			content
 *			URL
 *			datetime
 */

// unread messages
echo "<newMemos>";
$sql = " SELECT me.*, mb.mb_nick 
	FROM $g4[memo_table] me LEFT JOIN $g4[member_table] mb ON (me.me_send_mb_id = mb.mb_id)
	WHERE me_recv_mb_id = '$mb_id' AND me_read_datetime = '0000-00-00 00:00:00' 
	ORDER BY me_id DESC ";
$result = sql_query($sql);
echo "<total>".mysql_num_rows($result)."</total>";
echo "<nextUpate>0</nextUpate>";	// TODO: need to update for server side control on update interval
for ($i=0; $row=sql_fetch_array($result); $i++)	{
	echo "<memo>{$i}";
	echo "<name>";
	if ($row[mb_nick]) echo $row[mb_nick];
	else echo "정보없음";
	echo "</name>";
	echo "<content>".$row[me_memo]."</content>";
	echo "<URL>".urlencode("$g4[url]/bbs/memo_view.php?me_id=$row[me_id]&kind=recv")."</URL>";
	echo "<datetime>".substr($row[me_send_datetime],2,14),"</datetime>";
	echo "</memo>";
}
echo "</newMemos>";
?>