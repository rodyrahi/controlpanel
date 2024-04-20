var user = "<%= sysuser %>";






var path = `/${user}/app/`;
function resetpath() {
  path = `/${user}/app/`;
}


function toggleSidePanel() {
    try {
      clearInterval();
    } catch (error) {}
  
    var sidePanel = document.getElementById("sidePanel");
    sidePanel.classList.toggle("active");
  }