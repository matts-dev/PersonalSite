const px_to_em = 16;
const em_to_px = 1 / px_to_em;

var collapseMap = {};
var openItem = null;
function handleCollapsibleClicked(element, targetContentId)
{
    targetContent = document.getElementById(targetContentId)

    let collapseItem = collapseMap[element.id];
    if(collapseItem == null)
    {
        collapseItem = {
            id : element.id,
            button : element,
            open : false,
            content : targetContent
        }
        collapseMap[element.id] = collapseItem;
    }

    if(!collapseItem.open)
    {
        collapseItem.open = true;
        collapseItem.content = targetContent;

        let targetHeight = targetContent.scrollHeight;
        targetContent.style.maxHeight = targetHeight + "px";

        //collapse another item if we've already opened it.
        if(openItem != null)        
        {
            openItem.open = false;
            openItem.content.style.maxHeight = 0;
        }
        openItem = collapseItem;
    }
    else{
        collapseItem.open = false;
        targetContent.style.maxHeight = 0;
        openItem = null;
        
    }
}

var sidebarOpen = false;
function openSidebar()
{
    // document.getElementById("sidebar").style.width = "2em";
    document.getElementById("sidebar").style.width = "50%";

}

function closeSidebar()
{
    document.getElementById("sidebar").style.width = "0";
}

loadContent("tests/embedtest.html");
function loadContent(content){
    let contentElement = document.getElementById("content");
    // contentElement.className = "embeddedPage";
    if(contentElement)
    {
        contentStr = '<object type="text/html" class="generatedObj" data=' + content + '></object>'
        contentElement.innerHTML = contentStr;
    }
    else{
        console.log("No content for this page")
    }
}