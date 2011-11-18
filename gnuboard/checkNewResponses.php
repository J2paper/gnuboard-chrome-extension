<?php
/**
 그누보드4 내글/댓글의 새 댓글 알림 for Google Chrome Extension
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
$lastUpdated = $_GET['lastUpdated'];
$mb_id = $member[mb_id];
/**
 * structure:
 *	newResponses
 *		total
 *		nextUpate
 *		lastUpated
 *		response
 *			group
 *			board
 *			title
 *			URL
 *			name
 *			datetime
 */

// new responses on my posts/comments afert 'lastUpated'
$list = array();
echo "<newResponses>";
// all new other's responses after 'lastUpated' from the 'searchable' tables (bo_use_search=1)
$sql_common = " FROM {$g4['board_new_table']} a, {$g4['board_table']} b, {$g4['group_table']} c ".
			"	WHERE NOT a.mb_id = '{$mb_id}' AND a.bo_table = b.bo_table AND b.gr_id = c.gr_id AND b.bo_use_search = '1' ";
if ($lastUpdated) $sql_common .= " AND bn_datetime > '{$lastUpdated}' ";
else $sql_limit .= " LIMIT 10 ";
$sql_order = " ORDER BY a.bn_id DESC ";
$sql = " SELECT a.*, b.bo_subject, c.gr_subject, c.gr_id " . $sql_common . $sql_order . $sql_limit;
$result = sql_query($sql);
for ($i=0; $row=sql_fetch_array($result); $i++) {

	$write_table = $g4['write_prefix'] . $row['bo_table'];
	if ($row['wr_id'] == $row['wr_parent']) {	// post
		// check if reply to mb_id's post
		$sql2 = " SELECT r.* FROM {$write_table} p, {$write_table} r ".
				"	WHERE r.wr_id = '{$row[wr_id]}' AND p.mb_id = '{$mb_id}' ".
				"		AND LENGTH(r.wr_reply) > 0 AND p.wr_num = r.wr_num  ".		// r is reply and p and r are in the same thread (same wr_num)
				"		AND LOCATE(p.wr_reply, r.wr_reply) = 1 ";					// and r is lower level reply to p (p.wr_reply is front-substring of r.wr_reply, e.g. p.wr_reply='ABA' and r.wr_repy='ABACA')

		$res2 = sql_query($sql2);
		if(mysql_num_rows($res2)==0) {
			$i--;
			continue;	// condition not matched
		}

		$row2 = sql_fetch($sql2);
		$link_postfix = "";
				
		$list[$i] = $row2;
		if(strstr($row2[wr_option], "secret")) $title ='비밀글 입니다.';
		else $title = $row2[wr_subject];
	}else { // comment
		// check if comment to mb_id's post or comment
		$sql2 = " SELECT r.* FROM {$write_table} p, {$write_table} r ".
				"	WHERE r.wr_id = '{$row[wr_id]}' AND p.mb_id = '{$mb_id} ' ".
				"		AND (	p.wr_id = '{$row[wr_parent]}' ".					// either p is post and r is p's comment
				"			OR	p.wr_comment = r.wr_comment AND LOCATE(p.wr_comment_reply, r.wr_comment_reply) = 1) ";
																					// or p and r are in the same comment branch and r is lower comment to p
		$res2 = sql_query($sql2);
		if(mysql_num_rows($res2)==0) {
			$i--;
			continue;	// condition not matched
		}
				
		$row2 = sql_fetch($sql2);
		$link_postfix = "#c_{$row[wr_id]}";
	
		$list[$i] = $row2;
		if(strstr($list[$i][wr_option], "secret")) $title ='[코] 비밀글 입니다.';
		else $title = "[코] ".cut_str($row2[wr_content], 100, '…');
	}

	$list[$i][gr_subject] = $row[gr_subject];
	$list[$i][bo_subject] = $row[bo_subject];
	$list[$i][title] = $title;
	$list[$i][href] = "/bbs/board.php?bo_table=".$row['bo_table']."&wr_id=".$row['wr_id'].$link_postfix;
	
	if(strstr($list[$i][wr_option], "anonym")) $list[$i][mb_nick] = '익명';
	else {
		$member = sql_fetch(" SELECT mb_nick FROM g4_member WHERE mb_id='{$row[mb_id]}' ");
		$list[$i][mb_nick] = $member['mb_nick'];
	}
	$list[$i][datetime] = substr($list[$i][wr_datetime],5,11);
}

echo "<total>".count($list)."</total>";
echo "<nextUpate>0</nextUpate>";	// TODO: need to update for server side control on update interval
echo "<lastUpated>".date("Y-m-d+H:i:s")."</lastUpated>";
for ($i=0; $i < count($list); $i++) {
	$e = $list[$i];
	echo "<response>{$i}";
	echo "<group>{$e[gr_subject]}</group><board>{$e[bo_subject]}</board>";
	echo "<title>{$e[title]}</title>";
	echo "<URL>".urlencode($g4['url'].$e['href'])."</URL>";
	echo "<name>{$e[mb_nick]}</name>";
	echo "<datetime>{$e[datetime]}</datetime>";
	echo "</response>";
}
echo "</newResponses>";
?>