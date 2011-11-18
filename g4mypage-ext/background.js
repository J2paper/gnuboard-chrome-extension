/* 그누보드4 내맞춤쪽 Google Chrome Extension
 * 
 * author: J2paper@papermodel.org
 * updated: 2011.11.18
 * comments:
 * this extension needs 'checkNewMemos.php', 'checkNewResponses.php' installed on the server with gnuboard4
 * and the php will return xml as following structure:
 *	newMemos
 *		total
 *		nextUpate
 *		memo
 *			name
 *			content
 *			URL
 *			datetime
 *
 *	newResponses
 *		total
 *		nextUpate
 *		lastUpated
 *		Response
 *			group
 *			board
 *			title
 *			URL
 *			name
 *			datetime
 *
 * @ icons (email, message, and task, are downloaded from http://www.iconarchive.com/show/palm-icons-by-thiago-silva.html)
 */
var audioElement = new Audio();
var updateResponseInterval = 10;
var updateMemoInterval = 10;

function updateTitleBadge()
{
	var totalResponses = localStorage["totalResponses"];
	var unreadResponses = localStorage["unreadResponses"];
	var totalMemos = localStorage["totalMemos"];
	var unreadMemos = localStorage["unreadMemos"];
	var totalWatches = localStorage["totalWatches"];
	var unreadWatches = localStorage["unreadWatches"];

	//update title
	var title = "";
	if(totalResponses==0 && totalMemos==0 && totalWatches==0) {
		title = "새 반응/쪽지가 없습니다.";
	}else {
		if(totalMemos>0) title = title + "새 쪽지: " + totalMemos;
		if(totalResponses>0 && totalMemos>0) title = title + " & ";
		if(totalResponses>0) title = title + "새 반응: " + totalResponses;
		if(totalResponses+totalMemos>0 && totalWatches>0) title = title + " & ";
		if(totalWatches>0) title = title + "새 관심: " + totalWatches;
		title = title + "개가 있습니다.";
	}
	chrome.browserAction.setTitle({ title: title });

	//update badge + alarm
	var badge = "";
	var colorR = 0;
	var colorG = 0;
	var colorB = 0;
	if(totalResponses == 0 && totalMemos==0 && totalWatches==0) {
		badge = "";
	}else {
		// badge update
		if(totalMemos>0) {
			badge = badge + nK(totalMemos);
			colorB = 255;
		}
		if(totalResponses>0 && totalMemos>0) badge = badge + ":";
		if(totalResponses>0) {
			badge = badge + nK(totalResponses);
			colorG = 255;
		}
		if(totalResponses+totalMemos>0 && totalWatches>0) badge = badge + ":";
		if(totalWatches>0) {
			badge = badge + nK(totalWatches);
			colorR = 255;
		}
		// alarm + notification
		if(totalResponses > unreadResponses || totalMemos > unreadMemos || totalWatches > unreadWatches) playSound();
		
		if(totalResponses > unreadResponses) showNotification('response', totalResponses-unreadResponses);
		if(totalMemos > unreadMemos) showNotification('memo', totalMemos-unreadMemos);
		if(totalWatches > unreadWatches) showNotification('watch', totalWatches-unreadWatches);

		localStorage["unreadResponses"] = totalResponses;
		localStorage["unreadMemos"] = totalMemos;
		localStorage["unreadWatches"] = totalWatches;
	}
	chrome.browserAction.setBadgeBackgroundColor({color:[colorR,colorG,colorB,255]});
	chrome.browserAction.setBadgeText({text:badge});	
}

function playSound() {
	if (localStorage["soundOn"] == null || localStorage["soundOn"] == "false")
		return;

	audioElement.src = localStorage["soundFile"];
	audioElement.load();
	audioElement.play();
}

function showNotification(type,nb) {
	if (localStorage["notifyOn"] == null || localStorage["notifyOn"] == "false")
		return;
	
	var title = "반응";
	var xml = localStorage["newResponses"];
	var name = extractXMLelement(xml, "name");
	var content = extractXMLelement(xml, "title");
	var image = 'palm-message48.png';

	if(type=='memo') {
		title = "쪽지";	
		xml = localStorage["newMemos"]
		content = extractXMLelement(xml, "content");
		image = 'palm-email48.png';
	}else if(type=='watch') {
		title = "관심";	
		xml = localStorage["newWatches"]
		content = extractXMLelement(xml, "title");
		image = 'palm-task48.png';
	}
	var postfix = "";
	if(nb>1) postfix = " (총 " + nb + "개의 새 " + title + ")";  

	var notification = webkitNotifications.createNotification(
		image,								// The image.
		'새 ' + title + ' from ' + name,	// The title.
		'내용: ' + content + postfix		// The body.
	);
	notification.show();
}

function storageEventHandler(e)
{
	if(e.key=='totalResponses' || e.key=='totalMemos' || e.key=='totalWatches') {
		updateTitleBadge();
	}
}
window.addEventListener('storage', storageEventHandler, false);
chrome.tabs.onRemoved.addListener(function(tabId) { 
	if(tabId==parseInt(localStorage["openedTabId"])) {
		localStorage["openedTabId"]="";
	}
});

function initLocalStorage()
{
	if(!localStorage["server"]) {
		chrome.browserAction.setTitle({ title: "서버정보를 입력하세요." });
		chrome.browserAction.setBadgeBackgroundColor({color:[255,0,0,255]});
		chrome.browserAction.setBadgeText({text: "?"});
	}
	localStorage["sitename"] = "그누보드4";	

	localStorage["errorMemos"] = "";
	localStorage["totalMemos"] = "";
	localStorage["unreadMemos"] = "";	// for sound & notify
	localStorage["newMemos"]   = "";

	localStorage["errorResponses"] = "";
	localStorage["totalResponses"] = "";
	localStorage["unreadResponses"] = "";
	localStorage["newResponses"]   = "";
	localStorage["lastResponsesUpdated"] = "";


	localStorage["errorWatches"] = "";
	localStorage["totalWatches"] = "0";
	localStorage["unreadWatches"] = "0";
	localStorage["newWatches"]   = "";

	localStorage["openedTabId"] = "";
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
				document.getElementById("container").innerHTML = '<div class="message">서버 (checkNewMemos.php) 응답이 없습니다.  필요한 화일을 설치했는지 확인해보세요.</div>';
			} else {
				var resp = parseNewMemos(xhr.responseText);
			}
		}
	}
	xhr.send();
	window.setTimeout(requestNewMemos, updateMemoInterval*60000);	//TODO: need to calculate the interval from nextUpdate
}

function parseNewMemos(xml)
{
	//get error if any
	if(xml.indexOf("<error>")!=-1) 
	{
		localStorage["errorMemos"] = extractXMLelement(xml, "error");
		
		chrome.browserAction.setTitle({ title: "ERROR_M: " + localStorage["errorMemos"] });
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


function requestNewResponses()
{
	var server = localStorage["server"];
	var lastUpated = localStorage["lastResponsesUpated"];
	
	var xhr = new XMLHttpRequest();

	if(!lastUpated) {
		xhr.open("GET", "http://" + server + "/checkNewResponses.php", true);
	}
	else {
		xhr.open("GET", "http://" + server + "/checkNewResponses.php?lastUpdated=" + lastUpated, true);
	}

	xhr.onreadystatechange = function() {
		if(xhr.readyState==4) {
			if (xhr.status==404) {
				chrome.browserAction.setTitle({ title: "서버 응답이 없습니다." });
				chrome.browserAction.setBadgeBackgroundColor({color:[255,0,0,255]});
				chrome.browserAction.setBadgeText({text: "X"});
				localStorage["errorResponses"] = "NO_RESPONSE";
				document.getElementById("container").innerHTML = '<div class="message">서버 (checkNewResponses.php) 응답이 없습니다.  필요한 화일을 설치했는지 확인해보세요.</div>';
			} else {
				var resp = parseNewResponses(xhr.responseText);
			}
		}
	}
	xhr.send();
	window.setTimeout(requestNewResponses, updateResponseInterval*60000);	//TODO: need to calculate the interval from nextUpdate
}

function parseNewResponses(xml)
{
	//get error if any
	if(xml.indexOf("<error>")!=-1) 
	{
		localStorage["errorResponses"] = extractXMLelement(xml, "error");
		
		chrome.browserAction.setTitle({ title: "ERROR_R: " + localStorage["errorResponses"] });
		chrome.browserAction.setBadgeBackgroundColor({color:[255,0,0,255]});
		chrome.browserAction.setBadgeText({text: "X"});
		return;
	}
	
	//get # new memos
	if(xml.indexOf("<newResponses>")!=-1)
	{
		localStorage["errorResponses"] = "";
		localStorage["totalResponses"] = extractXMLelement(xml, "total");
		localStorage["lastResponsesUpdated"] = extractXMLelement(xml, "lastUpated");
		localStorage["newResponses"]   = xml;
		
		updateTitleBadge();
	}
//	handleNewResponses();
}

function handleNewResponses() {	// placeholder for real function in popup.html
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
