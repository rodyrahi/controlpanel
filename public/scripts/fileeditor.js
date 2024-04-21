editor = "";

editor = ace.edit("editor");
editor.setTheme("ace/theme/cloud_editor_dark");


switch (file.split(".").pop()) {
  case "js":
    editor.session.setMode("ace/mode/javascript");
    break;
  case "py":
    editor.session.setMode("ace/mode/python");
    break;
  case "java":
    editor.session.setMode("ace/mode/java");
    break;
  case "cpp":
    editor.session.setMode("ace/mode/c_cpp");
    break;
  case "c":
    editor.session.setMode("ace/mode/c_cpp");
    break;
  case "cs":
    editor.session.setMode("ace/mode/csharp");
    break;
  case "html":
    editor.session.setMode("ace/mode/html");
    break;
  case "css":
    editor.session.setMode("ace/mode/css");
    break;
  case "sql":
    editor.session.setMode("ace/mode/sql");
    break;
    case "sh":
    editor.session.setMode("ace/mode/sh");
    break;
    case "json":
    editor.session.setMode("ace/mode/json");
    break;
    case "yaml":
    editor.session.setMode("ace/mode/yaml");
    break;
    case "md":
    editor.session.setMode("ace/mode/markdown");
    break;
    case "xml":
    editor.session.setMode("ace/mode/xml");
    break;
    case "txt":
    editor.session.setMode("ace/mode/text");
    break;
    case "php":
    editor.session.setMode("ace/mode/php");
    break;
    case "go":
    editor.session.setMode("ace/mode/go");
    break;

  default:
    break;
}

document.getElementById("filename").innerText = file;

editor.setValue(filedata , -1 );
editor.clearSelection();
async function saveFile(el) {
  document.getElementById("asterisk").style.display = "none";
  var name = el.innerHTML;
  el.innerHTML = '<i class="fas fa-spinner fa-spin "></i>';

  const content = editor.getValue().toString();

  
  filedata = content;

  let fileobject = recents_files_data.find(item => item.name === file);

  fileobject.data = content;



  console.log(` cat > ${dir + file} << "EOF"  '${content}' EOF`);
  const data = await execute(`cat <<EOF > ${dir + file}\n${content}\nEOF`);

  console.log(data);
  el.innerHTML = name;
}

document.getElementById("files-tab").innerHTML = "";

files_opened.forEach((element) => {
  let fileName = element.split("/").at(-1);
  console.log(fileName);

  document.getElementById("files-tab").innerHTML += `
  <div class="btn-group" role="group">
  
    <button class="btn btn-primary btn-sm" type="button" onclick="openfile( this , '${fileName}')"    data-dir="${element}">${fileName}</button>
    <button class="btn btn-dark btn-sm" onclick="closefile(this)"><i class="fa-solid fa-xmark"></i></button>
  </div>

`;
});


function closefile(el) {
    files_opened.pop(el.getAttribute("data-dir"))
    el.parentNode.remove()
    document.getElementById("file").innerHTML = "";
    openlastfile();
}

async function  openfile(el,name) {
    
    const dir =el.getAttribute("data-dir").split("/").slice(0, -1).join("/");

    file = name

    let fileobject = recents_files_data.find(item => item.name === name);

    filedata = fileobject.data
    console.log(filedata);
    

    htmx.ajax('GET', '/testfileditor' , {target:'#file', swap:'innerHTML'})

    

}