var enableGrouping = false;
var expandNewGroups = false;
var groupingInclude = undefined;
var groupingExclude = undefined;
/* Defined in: "Textual 5.app -> Contents -> Resources -> JavaScript -> API -> core.js" */

var groupCount = 0
var currentChannel = undefined

Textual.viewInitiated = function(viewType, serverHash, channelHash, channelName)
{
	currentChannel = (viewType == 'channel') ? channelName : undefined
}

Textual.viewBodyDidLoad = function()
{
	Textual.fadeOutLoadingScreen(1.00, 0.95)

	setTimeout(function() {
		Textual.scrollToBottomOfView()
	}, 500)
}

Textual.newMessagePostedToView = function(line)
{
	var element = document.getElementById("line-" + line)

	ConversationTracking.updateNicknameWithNewMessage(element)

	if (enableGrouping && currentChannel) {
		if (groupingInclude) {
			enableGrouping = groupingInclude.indexOf(currentChannel) != -1
		} else if (groupingExclude) {
			enableGrouping = groupingExclude.indexOf(currentChannel) == -1
		}
	}

	if (enableGrouping) {
		groupGeneralUserEvents(element)
	}
}

Textual.nicknameSingleClicked = function(e)
{
	ConversationTracking.nicknameSingleClickEventCallback(e)
}

function isGeneralUserEvent(element)
{
	var type = element.getAttribute("command")
	return ["join", "part", "quit", "nick"].indexOf(type) != -1
}

function isGroup(element)
{
	var type = element.getAttribute("ltype")
	return type == "group"
}

function isMarker(element)
{
	return element && element.id && element.id == 'mark'
}

function groupGeneralUserEvents(currentLine)
{
	var previousLine = currentLine.previousElementSibling

	// Ignore marker line
	if (isMarker(previousLine))
		previousLine = previousLine.previousElementSibling

	if (!isGeneralUserEvent(currentLine) || !previousLine)
		return

	var previousType = previousLine.getAttribute("ltype")

	// Don't group if there is just one line.
	if (!(isGeneralUserEvent(previousLine) || isGroup(previousLine)))
		return

	var group = previousLine

	if (!isGroup(previousLine) && previousType != "general_user_events") {
		group = createGroup("general_user_events")
		currentLine.parentElement.insertBefore(group, currentLine)
	}

	if (!isGroup(previousLine)) {
		increaseAttribute(group, previousType + "s")
		addLineToGroup(group, previousLine)
	}

	// Increase before decorating, else the numbers might be off.
	var currentType = currentLine.getAttribute("command")
	increaseAttribute(group, currentType + "s")

	addLineToGroup(group, currentLine)
}

function createGroup(name)
{
	var group = document.createElement("details")
	group.id = "group-" + groupCount
	group.setAttribute("ltype", "group")
	group.setAttribute("class", "line group")
	group.setAttribute("gtype", name)

	if (expandNewGroups) {
		group.setAttribute("open", "")
	}

	var head = document.createElement("summary")
	head.id = "group_head-" + groupCount
	group.appendChild(head)

	var body = document.createElement("div")
	body.id = "group_body-" + groupCount
	body.setAttribute("class", "group_body")
	group.appendChild(body)

	var time = document.createElement("span")
	time.setAttribute("class", "time")
	head.appendChild(time)

	var message = document.createElement("span")
	message.setAttribute("class", "message")
	message.appendChild(document.createTextNode(""))
	head.appendChild(message)

	groupCount++

	return group
}

function addLineToGroup(group, line)
{
	line.parentNode.removeChild(line)
	group.lastElementChild.appendChild(line)

	var head = group.firstElementChild
	var time = line.firstElementChild.firstElementChild.cloneNode(true)

	head.removeChild(head.firstElementChild)
	head.insertBefore(time, head.firstElementChild)

	decorateGroup(group)
}

function increaseAttribute(element, name)
{
	var value = Number(element.getAttribute(name))
	element.setAttribute(name, value + 1)
}

function decorateGroup(group)
{
	function stringifyValue(name, title)
	{
		if (title == undefined)
			title = name

		var value = Number(group.getAttribute(name + "s"))
		if (value == 0)
			return undefined

		if (title == "nick")
			title = "nick change"

		return value + " " + (value == 1 ? title : title + "s")
	}

	var gtype = group.getAttribute("gtype")
	var head = group.firstElementChild
	var message = head.lastElementChild
	var text = message.firstChild

	if (gtype == "general_user_events") {
		types = ["join", "part", "quit", "nick"]
		contents = new Array()
		for (var i in types) {
			var value = stringifyValue(types[i])
			if (value)
				contents.push(value)
		}
		text.textContent = " " + contents.join(", ")
	}
}
