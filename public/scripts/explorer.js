

recents.forEach((element) => {
  let directoryName = element.split("/").slice(-2, -1)[0];
  console.log(directoryName);
  document.getElementById(
    "recents"
  ).innerHTML += `<button class="btn btn-primary me-1 btn-sm" onclick="cdrecent(this)" data-dir="${element}" >${directoryName}</button>`;
});

function cdrecent(el) {
  const recentdir = el.getAttribute("data-dir");

  const command = `cd ${recentdir}\nls -la`;
  console.log(command);
  

  dir = recentdir
  console.log(dir);

  document.getElementById("changedir").innerHTML = command;
  document.getElementById("changedir").click();
}

var explorer = document.getElementById("explorer");
var folders = document.querySelectorAll(".folders");
var contextMenu = document.getElementById("contextMenu");
var contextMenuExplorer = document.getElementById("contextMenuExplorer");

explorer.addEventListener("contextmenu", function (event) {
  event.preventDefault();
  showMenu(event, contextMenuExplorer, null);
});

function menu(el) {
  var allContextMenus = document.querySelectorAll(".context-menu");
  allContextMenus.forEach(function (menu) {
    menu.style.display = "none";
  });

  event.preventDefault();
  event.stopPropagation();
  showMenu(event, el.querySelector(".context-menu"), el);
}

function showMenu(event, menu, el = null) {
  Array.from(folders).forEach((item) => (item.style.backgroundColor = ""));

  if (menu.id === "contextMenuExplorer") {
    const allContextMenus = document.querySelectorAll("#contextMenu");
    allContextMenus.forEach(function (menu) {
      menu.style.display = "none";
    });
  }

  // if (document.getElementById('contextMenu')) {
  //   document.getElementById('contextMenu').style.display = 'none';
  // }

  document.getElementById("contextMenuExplorer").style.display = "none";

  const maxleft =
    document.getElementById("explorer").offsetWidth - menu.offsetWidth;
  const maxtop =
    document.getElementById("explorer").offsetHeight - menu.offsetHeight;

  const sub_menu_maxtop =
    document.getElementById("explorer").offsetHeight -
    contextMenuExplorer.offsetHeight;

  

  menu.style.display = "block";

  menu.style.left = Math.min(maxleft, event.clientX) + "px";
  menu.style.top = Math.min(maxtop, event.clientY) + "px";

  if (el) {
    file = el.querySelector("span").textContent.trim();
  }

  document.addEventListener("click", function (event) {
    hideContextMenu(el, menu);
  });

  if (el) {
    el.style.backgroundColor = "red";
  }
}

function hideContextMenu(el, menu) {
  menu.style.display = "none";
  document.removeEventListener("click", hideContextMenu);
  if (el) {
    el.style.backgroundColor = "";
  }
}

async function cd(el, name) {
  const type = el.getAttribute("data-type");

  el.setAttribute("type", "none");

  if (type === "dic") {
    const currentDir = name;
    if (!dir.includes(currentDir)) {
      dir += currentDir + "/";

      const command = `cd ${dir}\nls -la`;


      document.getElementById("changedir").innerHTML = command;
      document.getElementById("changedir").click();

      
      if (!recents.includes(dir)) {
        recents.push(dir);
        console.log(recents);
      }
    }
  } else {
   
   
    readfile(name);



    file = name;
  }
  el.setAttribute("type", "button");
}

document.getElementById("filterInput").addEventListener("input", function () {
  var filterValue = this.value.toLowerCase(); // Get the value entered by the user and convert it to lowercase for case-insensitive filtering
  var itemList = document.getElementById("explorer");
  var items = itemList.getElementsByTagName("p");

  Array.from(items).forEach(function (item) {
    var text = item.textContent.toLowerCase();
    if (text.indexOf(filterValue) > -1) {
      item.style.display = "block"; // Show the item if the text matches the filter
    } else {
      item.style.display = "none"; // Hide the item if the text does not match the filter
    }
  });
});

async function readfile(el) {
  var name = el.innerHTML;
  console.log(`cd ${dir.trim()}\ncat ${el}`);

  if (!files_opened.includes(dir + el)) {
    files_opened.push(dir + el);
  }

  filedata = await execute(`cd ${dir}\ncat ${el}`);

  console.log(el);
  
  let file_json = {
    name: el,
    data: filedata,
  };
  
  if (!recents_files_data.includes(file_json)) {
    recents_files_data.push(file_json);
    
  }

  console.log(recents_files_data);
  


  

  htmx.ajax('GET', '/testfileditor' , {target:'#file', swap:'innerHTML'})


  
  

  editor.on("change", function () {
    if (editor.getValue != data) {
      document.getElementById("asterisk").style.display = "block";
    }
  });

  console.log(files_opened);
  el.innerHTML = name;
}

async function back() {
  const pathParts = dir.split("/");

  if (pathParts.length > 2) {
    dir = pathParts.slice(0, -2).join("/") + "/";

    const command = `cd ${dir}\nls -la`;
    console.log(command);

    document.getElementById("changedir").innerHTML = command;
    document.getElementById("changedir").click();
  } else {
    dir = "/";
  }
}

async function home() {
  dir = `/${username}/`;

  const command = `cd ${dir}\nls -la`;
  console.log(command);

  document.getElementById("changedir").innerHTML = command;
  document.getElementById("changedir").click();
}

async function reload() {
  console.log(dir);

  const command = `cd ${dir}\nls -la`;
  console.log(command);

  document.getElementById("changedir").innerHTML = command;
  document.getElementById("changedir").click();
}

async function deletefile(el) {
  var name = el.innerHTML;

  // Display a confirmation dialog
  var confirmDelete = confirm(`Are you sure you want to delete '${file}'`);

  if (confirmDelete) {
    // Proceed with the deletion
    el.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
      const data = await execute(`rm -r ${dir + file}`);
      console.log(data);
      el.innerHTML = name;
      document.getElementById("changedir").innerHTML = `cd ${dir}\nls -la`;
      document.getElementById("changedir").click();
    } catch (error) {
      console.error("Error deleting file:", error);
      el.innerHTML = name;
      alert("An error occurred while deleting the file.");
    }
  } else {
    // User canceled the deletion, revert the changes
    el.innerHTML = name;
  }
}

async function copy(el) {
  copyfile = dir + el;
  console.log(copyfile);
}

async function paste(el) {
  console.log(copyfile);
  console.log(`cp -r ${copyfile} ${dir}`);
  document.getElementById("overlay").style.display = "block";
  const data = await execute(`cp -r ${copyfile} ${dir}`);
  document.getElementById("changedir").innerHTML = `cd ${dir}\nls -la`;
  document.getElementById("changedir").click();
  document.getElementById("overlay").style.display = "none";
}

async function npmi() {
  document.getElementById("overlay").style.display = "block";
  const data = await execute(`cd ${dir} \n npm i`);
  document.getElementById("changedir").innerHTML = `cd ${dir}\nls -la`;
  document.getElementById("changedir").click();
  document.getElementById("overlay").style.display = "none";
}

async function createfolder() {
  // Prompt the user for folder name
  const folderName = prompt("Enter the folder name:");

  // Check if the user provided a folder name
  if (folderName) {
    const data = await execute(`mkdir ${dir}/${folderName}`);
    document.getElementById("changedir").innerHTML = `cd ${dir}\nls -la`;
    document.getElementById("changedir").click();
  } else {
    // Handle the case where the user did not provide a folder name
    console.log("Folder name not provided");
  }
}

async function createfile() {
  // Prompt the user for file name
  const fileName = prompt("Enter the file name:");

  // Check if the user provided a file name
  if (fileName) {
    const data = await execute(`touch ${dir}/${fileName}`);
    document.getElementById("changedir").innerHTML = `cd ${dir}\nls -la`;
    document.getElementById("changedir").click();
  } else {
    // Handle the case where the user did not provide a file name
    console.log("File name not provided");
  }
}


async function downloadAction(filename) {
  try {

      const data = await execute(`cd ${dir} && cat ${filename}`);

   
      const blob = new Blob([data]);

  
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename; 

      document.body.appendChild(a);
      a.click();

     
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`File "${downloadFilename}" downloaded successfully.`);
  } catch (error) {
      console.error('Error while downloading the file:', error);
  }
}

async function uploadAction() {
  const form = document.getElementById("file-upload-form");
  const fileInput = document.getElementById("file-input");
  const file = fileInput.files[0];

  const blob = await file.text()

  const fileurl = `cat <<EOF > ${dir}${file.name}\n${blob}\nEOF`
  console.log(fileurl);
  const data = await execute(fileurl);

  document.getElementById("changedir").innerHTML = `cd ${dir}\nls -la`;
  document.getElementById("changedir").click();


}





async function runScript(el) {
  var script = el.querySelector("textarea").value;

  if (script.includes("$$$")) {
    const input = prompt(`${script.replace("$$$", "")} : `);
    script = script.replace("$$$", input);
  }
  document.getElementById("overlay").style.display = "block";

  const data = await execute(`cd ${dir}\n${script}`);

  document.getElementById("changedir").innerHTML = `cd ${dir}\nls -la`;
  document.getElementById("changedir").click();
  console.log(data);
  document.getElementById("overlay").style.display = "none";
}


files_opened.forEach((element) => {
  let fileName = element.split("/").at(-1);
  console.log(fileName);

  document.getElementById("files-tab").innerHTML += `
  <div class="btn-group" role="group">
  
    <button class="btn btn-primary btn-sm" type="button" onclick="opnefile(this , '${fileName}')"   hx-target="#file" hx-swap="innerHTML"  data-dir="${element}">${fileName}</button>
    <button class="btn btn-dark btn-sm" onclick="closefile(this)"><i class="fa-solid fa-xmark"></i></button>
  </div>

`;

 


});

openlastfile();

async function openlastfile() {
  let name = files_opened.slice(-1)[0].split("/").at(-1);
    
htmx.ajax('GET', '/testfileditor' , {target:'#file', swap:'innerHTML'})
file = name
const data = await execute(`cd ${dir}\ncat ${name}`);
editor.setValue(data);
}



function triggerUpload() {
            
  console.log(document.getElementById('file-input'));
  document.getElementById('file-input').click(); 
}