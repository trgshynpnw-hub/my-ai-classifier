const todoInput = document.querySelector("#todo-input");
const addButton = document.querySelector("#add-button");
const todoList = document.querySelector("#todo-list");

function addTodo() {
  const text = todoInput.value.trim();

  // 不添加空任务
  if (text === "") {
    return;
  }

  const item = document.createElement("li");
  item.className = "todo-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  const taskText = document.createElement("span");
  taskText.className = "todo-text";
  taskText.textContent = text;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "删除";

  // 勾选复选框时切换完成状态
  checkbox.addEventListener("change", function () {
    item.classList.toggle("completed", checkbox.checked);
  });

  // 点击文字也可以完成或取消完成
  taskText.addEventListener("click", function () {
    checkbox.checked = !checkbox.checked;
    item.classList.toggle("completed", checkbox.checked);
  });

  deleteButton.addEventListener("click", function () {
    item.remove();
  });

  item.append(checkbox, taskText, deleteButton);
  todoList.append(item);
  todoInput.value = "";
  todoInput.focus();
}

addButton.addEventListener("click", addTodo);

// 在输入框里按回车也可以添加任务
todoInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addTodo();
  }
});
