const todoInput = document.querySelector("#todo-input");
const deadlineInput = document.querySelector("#deadline-input");
const durationSelect = document.querySelector("#duration-select");
const addButton = document.querySelector("#add-button");
const exportButton = document.querySelector("#export-button");
const importButton = document.querySelector("#import-button");
const importFile = document.querySelector("#import-file");
const todoSections = document.querySelector("#todo-sections");

const STORAGE_KEY = "simple-todos";
const categories = ["工作", "学习", "生活", "健康", "其他"];

let todos = loadTodos();

function loadTodos() {
  let savedTodos = null;

  try {
    savedTodos = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    return [];
  }

  if (!savedTodos) {
    return [];
  }

  try {
    return JSON.parse(savedTodos);
  } catch (error) {
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.warn("任务保存失败，但当前页面仍可继续使用。");
  }
}

function normalizeText(text) {
  return text.trim();
}

function getCategory(text) {
  const rules = [
    { name: "工作", words: ["会议", "项目", "邮件", "汇报", "客户", "方案", "同事", "合同"] },
    { name: "学习", words: ["学习", "作业", "考试", "复习", "课程", "阅读", "笔记", "javascript"] },
    { name: "生活", words: ["买", "打扫", "缴费", "做饭", "洗衣", "整理", "取快递", "购物"] },
    { name: "健康", words: ["运动", "体检", "吃药", "跑步", "健身", "睡觉", "喝水", "医院"] }
  ];

  const lowerText = text.toLowerCase();
  const matchedRule = rules.find(function (rule) {
    return rule.words.some(function (word) {
      return lowerText.includes(word.toLowerCase());
    });
  });

  return matchedRule ? matchedRule.name : "其他";
}

function addTodo() {
  const text = normalizeText(todoInput.value);
  const deadlineDate = deadlineInput.value;
  const duration = durationSelect.value;

  if (text === "") {
    alert("请先输入一个任务。");
    return;
  }

  if (deadlineDate === "") {
    alert("请选择截止日期。");
    return;
  }

  const isDuplicate = todos.some(function (todo) {
    return normalizeText(todo.text) === text;
  });

  if (isDuplicate) {
    alert("这个任务已经存在，不能重复添加。");
    return;
  }

  todos.push({
    id: Date.now(),
    text: text,
    deadlineDate: deadlineDate,
    duration: duration,
    category: getCategory(text),
    completed: false
  });

  renderTodos();
  saveTodos();

  todoInput.value = "";
  deadlineInput.value = "";
  durationSelect.value = "无";
  todoInput.focus();
}

function deleteTodo(id) {
  todos = todos.filter(function (todo) {
    return todo.id !== id;
  });

  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  todos = todos.map(function (todo) {
    if (todo.id === id) {
      return { ...todo, completed: !todo.completed };
    }

    return todo;
  });

  saveTodos();
  renderTodos();
}

function updateTodoText(id, newText) {
  const text = normalizeText(newText);

  if (text === "") {
    alert("任务名称不能为空。");
    renderTodos();
    return;
  }

  const isDuplicate = todos.some(function (todo) {
    return todo.id !== id && normalizeText(todo.text) === text;
  });

  if (isDuplicate) {
    alert("这个任务已经存在，不能重复添加。");
    renderTodos();
    return;
  }

  todos = todos.map(function (todo) {
    if (todo.id === id) {
      return {
        ...todo,
        text: text,
        category: getCategory(text)
      };
    }

    return todo;
  });

  saveTodos();
  renderTodos();
}

function getSortedTodos() {
  return [...todos].sort(function (a, b) {
    return a.deadlineDate.localeCompare(b.deadlineDate);
  });
}

function formatDate(dateText) {
  const date = new Date(dateText + "T00:00:00");
  return date.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short"
  });
}

function getDaysUntil(dateText) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const deadline = new Date(dateText + "T00:00:00");
  const dayMilliseconds = 24 * 60 * 60 * 1000;

  return Math.round((deadline - todayStart) / dayMilliseconds);
}

function getDeadlineClass(dateText) {
  const daysUntil = getDaysUntil(dateText);

  if (daysUntil < 0) {
    return "deadline-overdue";
  }

  if (daysUntil === 0) {
    return "deadline-today";
  }

  if (daysUntil <= 2) {
    return "deadline-soon";
  }

  return "deadline-later";
}

function getDurationClass(duration) {
  const classMap = {
    "无": "duration-none",
    "30分钟内": "duration-short",
    "1小时": "duration-one",
    "1.5小时": "duration-mid",
    "2小时": "duration-two",
    "3小时": "duration-three",
    "半天": "duration-half",
    "一天": "duration-day"
  };

  return classMap[duration] || "duration-none";
}

function startEditingTodo(todo, taskText) {
  const editInput = document.createElement("input");
  editInput.className = "todo-edit-input";
  editInput.type = "text";
  editInput.value = todo.text;

  taskText.replaceWith(editInput);
  editInput.focus();
  editInput.select();

  function finishEditing() {
    updateTodoText(todo.id, editInput.value);
  }

  editInput.addEventListener("blur", finishEditing);

  editInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      editInput.blur();
    }

    if (event.key === "Escape") {
      renderTodos();
    }
  });
}

function exportTodos() {
  const backup = {
    app: "todo-app",
    version: 1,
    exportedAt: new Date().toISOString(),
    todos: todos
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `todo-backup-${today}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importTodos(file) {
  const reader = new FileReader();

  reader.addEventListener("load", function () {
    try {
      const data = JSON.parse(reader.result);
      const importedTodos = Array.isArray(data) ? data : data.todos;

      if (!Array.isArray(importedTodos)) {
        alert("备份文件格式不正确。");
        return;
      }

      todos = importedTodos.map(function (todo) {
        const text = normalizeText(todo.text || "");

        return {
          id: todo.id || Date.now() + Math.random(),
          text: text,
          deadlineDate: todo.deadlineDate || "",
          duration: todo.duration || "无",
          category: getCategory(text),
          completed: Boolean(todo.completed)
        };
      }).filter(function (todo) {
        return todo.text !== "" && todo.deadlineDate !== "";
      });

      saveTodos();
      renderTodos();
      alert("导入完成。");
    } catch (error) {
      alert("无法读取这个备份文件。");
    }
  });

  reader.readAsText(file);
}

function createTodoItem(todo) {
  const item = document.createElement("li");
  item.className = "todo-item";

  if (todo.completed) {
    item.classList.add("completed");
  }

  const checkbox = document.createElement("input");
  checkbox.className = "todo-checkbox";
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;

  const content = document.createElement("div");
  content.className = "todo-content";

  const taskText = document.createElement("span");
  taskText.className = "todo-text";
  taskText.textContent = todo.text;
  taskText.title = "点击修改任务名称";

  const meta = document.createElement("div");
  meta.className = "todo-meta";

  const deadlineTag = document.createElement("span");
  deadlineTag.className = "tag deadline-tag " + getDeadlineClass(todo.deadlineDate);
  deadlineTag.textContent = "截止：" + formatDate(todo.deadlineDate);

  const durationTag = document.createElement("span");
  durationTag.className = "tag duration-tag " + getDurationClass(todo.duration);
  durationTag.textContent = "预计：" + todo.duration;

  meta.append(deadlineTag, durationTag);

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "删除";

  checkbox.addEventListener("change", function () {
    toggleTodo(todo.id);
  });

  taskText.addEventListener("click", function () {
    startEditingTodo(todo, taskText);
  });

  deleteButton.addEventListener("click", function () {
    deleteTodo(todo.id);
  });

  content.append(taskText, meta);
  item.append(checkbox, content, deleteButton);

  return item;
}

function renderTodos() {
  todoSections.innerHTML = "";

  if (todos.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "还没有任务。先写下第一件想完成的小事吧。";
    todoSections.append(emptyState);
    return;
  }

  const sortedTodos = getSortedTodos();

  categories.forEach(function (category) {
    const categoryTodos = sortedTodos.filter(function (todo) {
      return todo.category === category;
    });

    if (categoryTodos.length === 0) {
      return;
    }

    const section = document.createElement("section");
    section.className = "category-section";

    const title = document.createElement("h2");
    title.className = "category-title";
    title.innerHTML = `${category}<span class="task-count">${categoryTodos.length} 项</span>`;

    const list = document.createElement("ul");
    list.className = "todo-list";

    categoryTodos.forEach(function (todo) {
      list.append(createTodoItem(todo));
    });

    section.append(title, list);
    todoSections.append(section);
  });
}

addButton.addEventListener("click", addTodo);
exportButton.addEventListener("click", exportTodos);
importButton.addEventListener("click", function () {
  importFile.click();
});

importFile.addEventListener("change", function () {
  const file = importFile.files[0];

  if (file) {
    importTodos(file);
  }

  importFile.value = "";
});

// 在输入框里按回车也可以添加任务
todoInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addTodo();
  }
});

renderTodos();
