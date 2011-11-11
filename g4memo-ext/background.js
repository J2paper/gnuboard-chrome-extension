/* 그누보드4 쪽지알림 Google Chrome Extension
 * 
 * author: J2paper@papermodel.org
 * updated: 2011.11.12
 * comments:
 * this extension needs 'checkNewMemos.php' installed on the server with gnuboard4
 * this php will return xml as following structure:
 * newMemos
 *	total
 *	nextUpate
 *	memo
 *		name
 *		content
 *		URL
 *		datetime
 */
var audioElement = new Audio();

function updateTitleBadge()
{
	var totalMemos = localStorage["totalMemos"];
	var unreadMemos = localStorage["unreadMemos"];
		
	//update title
	var title = "";
	if(totalMemos==0) {
		title = "새 쪽지가 없습니다.";
	}else {
		title = "새 쪽지 " + totalMemos + "개 있습니다.";
	}
	chrome.browserAction.setTitle({ title: title });

	//update badge + alarm
	var badge = "";
	if(totalMemos>0) {
		// badge update
		badge = nK(totalMemos);
		if(totalMemos>unreadMemos) {
			// alarm
			playSound();
			// notification
			showNotification(totalMemos-unreadMemos);
		}
		localStorage["unreadMemos"] = totalMemos;
	}
	chrome.browserAction.setBadgeBackgroundColor({color:[0,255,0,255]});
	chrome.browserAction.setBadgeText({text:badge});	
}

function playSound() {
	if (localStorage["soundOn"] == null || localStorage["soundOn"] == "false")
		return;

	audioElement.src = localStorage["soundFile"];
	audioElement.load();
	audioElement.play();
}

function showNotification(nb) {
	if (localStorage["notifyOn"] == null || localStorage["notifyOn"] == "false")
		return;
	
	var xml = localStorage["newMemos"];
	var name = extractXMLelement(xml, "name");
	var content = extractXMLelement(xml, "content");
	var postfix = "";
//	if(nb>1) postfix = "(총 " + nb + "개의 새쪽지가 있습니다.)"; 
	var notification = webkitNotifications.createNotification(
		'email128.png',						// The image.
		'새 쪽지 from ' + name,			// The title.
		'내용: ' + content + postfix		// The body.
	);
	notification.show();
}

function storageEventHandler(e)
{
	if(e.key=='totalMemos') {
		updateTitleBadge();
	}
}
window.addEventListener('storage', storageEventHandler, false);

function initLocalStorage()
{
	if(!localStorage["server"]) {
		chrome.browserAction.setTitle({ title: "서버정보를 입력하세요." });
		chrome.browserAction.setBadgeBackgroundColor({color:[255,0,0,255]});
		chrome.browserAction.setBadgeText({text: "?"});
	}

	localStorage["errorMemos"] = "";
	localStorage["totalMemos"] = "";
	localStorage["unreadMemos"] = "";	// for sound & notify
	localStorage["newMemos"]   = "";

	localStorage["soundOn"] = "true";
	localStorage["soundFile"] = "chime.mp3";
	localStorage["notifyOn"] = "true";
}

function requestNewMemos()
{
	var server = localStorage["server"];

	chrome.browserAction.setTitle({ title: "정보를 읽어옵니다." });
	chrome.browserAction.setBadgeBackgroundColor({color:[200,200,200,255]});
	chrome.browserAction.setBadgeText({text: "..."});

	var xhr = new XMLHttpRequest();

	xhr.open("GET", "http://" + server + "/checkNewMemos.php", true);

	xhr.onreadystatechange = function() {
		if(xhr.readyState==4) {
			if (xhr.status==404) {
				chrome.browserAction.setTitle({ title: "서버 응답이 없습니다." });
				chrome.browserAction.setBadgeBackgroundColor({color:[255,0,0,255]});
				chrome.browserAction.setBadgeText({text: "X"});
				localStorage["errorMemos"] = "NO_RESPONSE";
				document.getElementById("container").innerHTML = '<div class="message">서버 응답이 없습니다.  필요한 화일을 설치했는지 확인해보세요.</div>';
			} else {
				var resp = handleResponse(xhr.responseText);
			}
		}
	}
	xhr.send();
	window.setTimeout(requestNewMemos, 10*60000);	//TODO: need to calculate the interval from nextUpdate
}

function handleResponse(xml)
{
	//get error if any
	if(xml.indexOf("<error>")!=-1) 
	{
		localStorage["errorMemos"] = extractXMLelement(xml, "error");
		
		chrome.browserAction.setTitle({ title: "ERROR: " + localStorage["errorMemos"] });
		chrome.browserAction.setBadgeBackgroundColor({color:[255,0,0,255]});
		chrome.browserAction.setBadgeText({text: "X"});
		return;
	}
	
	//get # new memos
	if(xml.indexOf("<newMemos>")!=-1)
	{
		localStorage["errorMemos"] = "";
		localStorage["totalMemos"] = extractXMLelement(xml, "total");
		localStorage["newMemos"]   = xml;
		
		updateTitleBadge();
	}
	handleNewMemos();
}

function handleNewMemos() {	// placeholder for real function in popup.html
}


// utility functions
function nK(number)	// 1k = 1001~1999, 2k = 2001 ~ 2999 so on
{
	var formatedNumber = number;
	if(number > 1000) {
		formatedNumber = (number/1000) | 0;
		formatedNumber = badge + "k";
	}
	return formatedNumber;
}

function extractXMLelement(str,tag)	// extract the content inside the TAG
{
	var start = str.indexOf("<"+tag+">") + tag.length + 2;
	var end   = str.indexOf("</"+tag+">");
	return str.substring(start,end);
}

function leadingZero(number) 
{
	return number < 10 ? "0" + number : number;
}

function formatDate(oldDate) {	// no need anymore.. but just keeping just for formatting
    var date = new Date(oldDate.getTime() + parseInt(localStorage["timeOffset"]) * 3600000);
    return date.getFullYear() + "-" + 
        leadingZero(date.getMonth()+1) + "-"+
        leadingZero(date.getDate()) + "+" + 
        leadingZero(date.getHours()) + ":" + 
        leadingZero(date.getMinutes()) + ":" +
        leadingZero(date.getSeconds());
}
