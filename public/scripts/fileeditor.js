editor = "";

editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/python");

document.getElementById("filename").innerText = file;

async function saveFile(el) {
  document.getElementById("asterisk").style.display = "none";
  var name = el.innerHTML;
  el.innerHTML = '<i class="fas fa-spinner fa-spin "></i>';

  const content = editor.getValue().toString();

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
  
    <button class="btn btn-primary btn-sm" type="button" onclick="openfile('${fileName}')"   hx-target="#file" hx-swap="innerHTML"  data-dir="${element}">${fileName}</button>
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

async function  openfile(name) {
    
    htmx.ajax('GET', '/testfileditor' , {target:'#file', swap:'innerHTML'})
    file = name
    const data = await execute(`cd ${dir}\ncat ${name}`);
    editor.setValue(data);

}