const todoInput = document.querySelector("#todo-input");
const deadlineInput = document.querySelector("#deadline-input");
const durationSelect = document.querySelector("#duration-select");
const addButton = document.querySelector("#add-button");
const transferButton = document.querySelector("#transfer-button");
const transferOptions = document.querySelector("#transfer-options");
const exportButton = document.querySelector("#export-button");
const importButton = document.querySelector("#import-button");
const importFile = document.querySelector("#import-file");
const copySummaryButton = document.querySelector("#copy-summary-button");
const copyFallback = document.querySelector("#copy-fallback");
const copyFallbackText = document.querySelector("#copy-fallback-text");
const closeCopyFallback = document.querySelector("#close-copy-fallback");
const todoSections = document.querySelector("#todo-sections");

const STORAGE_KEY = "simple-todos";
const categories = ["工作", "学习", "生活", "健康", "其他"];

let todos = loadTodos();
let activeInlineEditor = null;

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
    return normalizeTodos(JSON.parse(savedTodos));
  } catch (error) {
    return [];
  }
}

function normalizeTodos(todoList) {
  if (!Array.isArray(todoList)) {
    return [];
  }

  return todoList.map(function (todo) {
    const text = normalizeText(todo.text || "");

    return {
      id: todo.id || Date.now() + Math.random(),
      text: text,
      deadlineDate: todo.deadlineDate || "",
      duration: todo.duration || "无",
      category: todo.category || getCategory(text),
      completed: Boolean(todo.completed),
      progress: normalizeText(todo.progress || "")
    };
  }).filter(function (todo) {
    return todo.text !== "" && todo.deadlineDate !== "";
  });
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

function closeActiveInlineEditor() {
  if (!activeInlineEditor) {
    return;
  }

  activeInlineEditor.close();
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
    completed: false,
    progress: ""
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

function updateTodoProgress(id, progressText) {
  const progress = normalizeText(progressText);

  todos = todos.map(function (todo) {
    if (todo.id === id) {
      return { ...todo, progress: progress };
    }

    return todo;
  });

  saveTodos();
  renderTodos();
}

function updateTodoDeadline(id, deadlineDate) {
  if (deadlineDate === "") {
    alert("请选择截止日期。");
    renderTodos();
    return;
  }

  todos = todos.map(function (todo) {
    if (todo.id === id) {
      return { ...todo, deadlineDate: deadlineDate };
    }

    return todo;
  });

  saveTodos();
  renderTodos();
}

function updateTodoDuration(id, duration) {
  todos = todos.map(function (todo) {
    if (todo.id === id) {
      return { ...todo, duration: duration };
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

function isPastDeadline(dateText) {
  return getDaysUntil(dateText) < 0;
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

function startEditingProgress(todo) {
  const progressText = prompt("补充任务进度：", todo.progress || "");

  if (progressText === null) {
    return;
  }

  updateTodoProgress(todo.id, progressText);
}

function startEditingDeadline(todo, deadlineTag) {
  closeActiveInlineEditor();

  const editInput = document.createElement("input");
  let isFinished = false;
  const originalDeadline = todo.deadlineDate;

  editInput.className = "deadline-edit-input";
  editInput.type = "date";
  editInput.value = todo.deadlineDate;

  deadlineTag.replaceWith(editInput);
  editInput.focus();

  function finishEditing() {
    if (isFinished) {
      return;
    }

    isFinished = true;
    activeInlineEditor = null;
    updateTodoDeadline(todo.id, editInput.value);
  }

  function finishOrRestore() {
    if (isFinished) {
      return;
    }

    if (editInput.value === originalDeadline) {
      isFinished = true;
      activeInlineEditor = null;
      renderTodos();
      return;
    }

    finishEditing();
  }

  activeInlineEditor = {
    element: editInput,
    close: finishOrRestore
  };

  editInput.addEventListener("change", finishEditing);
  editInput.addEventListener("blur", finishOrRestore);

  editInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      finishEditing();
    }

    if (event.key === "Escape") {
      renderTodos();
    }
  });
}

function startEditingDuration(todo, durationTag) {
  closeActiveInlineEditor();

  const editSelect = document.createElement("select");
  const durations = ["无", "30分钟内", "1小时", "1.5小时", "2小时", "3小时", "半天", "一天"];
  let isFinished = false;
  const originalDuration = todo.duration;

  editSelect.className = "duration-edit-select";

  durations.forEach(function (duration) {
    const option = document.createElement("option");
    option.value = duration;
    option.textContent = duration;
    option.selected = duration === todo.duration;
    editSelect.append(option);
  });

  durationTag.replaceWith(editSelect);
  editSelect.focus();

  function finishEditing() {
    if (isFinished) {
      return;
    }

    isFinished = true;
    activeInlineEditor = null;
    updateTodoDuration(todo.id, editSelect.value);
  }

  function finishOrRestore() {
    if (isFinished) {
      return;
    }

    if (editSelect.value === originalDuration) {
      isFinished = true;
      activeInlineEditor = null;
      renderTodos();
      return;
    }

    finishEditing();
  }

  activeInlineEditor = {
    element: editSelect,
    close: finishOrRestore
  };

  editSelect.addEventListener("change", finishEditing);
  editSelect.addEventListener("blur", finishOrRestore);

  editSelect.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      finishEditing();
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

function buildTodoSummaryText() {
  if (todos.length === 0) {
    return "待办事项\n\n暂无待办事项";
  }

  const sortedTodos = getSortedTodos();
  const lines = ["待办事项"];

  categories.forEach(function (category) {
    const categoryTodos = sortedTodos.filter(function (todo) {
      return todo.category === category;
    });

    if (categoryTodos.length === 0) {
      return;
    }

    lines.push("", `【${category}】`);

    categoryTodos.forEach(function (todo, index) {
      const completedText = todo.completed ? "[已完成] " : "";

      lines.push(`${index + 1}. ${completedText}${todo.text}`);

      if (todo.progress) {
        lines.push(`   进度：${todo.progress}`);
      }

      lines.push(`   截止：${formatDate(todo.deadlineDate)}`);
      lines.push(`   预计：${todo.duration}`);
    });
  });

  return lines.join("\n");
}

function showCopyFallback(text) {
  copyFallbackText.value = text;
  copyFallback.hidden = false;
  copyFallbackText.focus();
  copyFallbackText.select();
}

async function copyTodoSummary() {
  const text = buildTodoSummaryText();

  try {
    await navigator.clipboard.writeText(text);
    alert("待办事项已复制到剪切板");
  } catch (error) {
    showCopyFallback(text);
  }
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

      todos = normalizeTodos(importedTodos);

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

  if (isPastDeadline(todo.deadlineDate)) {
    item.classList.add("past-deadline");
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

  const progress = document.createElement("p");
  progress.className = "todo-progress";
  progress.textContent = todo.progress;

  if (!todo.progress) {
    progress.hidden = true;
  }

  const deadlineTag = document.createElement("span");
  deadlineTag.className = "tag deadline-tag " + getDeadlineClass(todo.deadlineDate);
  deadlineTag.textContent = "截止：" + formatDate(todo.deadlineDate);
  deadlineTag.title = "点击修改截止日期";
  deadlineTag.tabIndex = 0;

  const durationTag = document.createElement("span");
  durationTag.className = "tag duration-tag " + getDurationClass(todo.duration);
  durationTag.textContent = "预计：" + todo.duration;
  durationTag.title = "点击修改预计时长";
  durationTag.tabIndex = 0;

  meta.append(deadlineTag, durationTag);

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "删除";

  checkbox.addEventListener("change", function () {
    toggleTodo(todo.id);
  });

  taskText.addEventListener("click", function (event) {
    event.stopPropagation();
    startEditingTodo(todo, taskText);
  });

  deadlineTag.addEventListener("click", function (event) {
    event.stopPropagation();
    startEditingDeadline(todo, deadlineTag);
  });

  deadlineTag.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startEditingDeadline(todo, deadlineTag);
    }
  });

  durationTag.addEventListener("click", function (event) {
    event.stopPropagation();
    startEditingDuration(todo, durationTag);
  });

  durationTag.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startEditingDuration(todo, durationTag);
    }
  });

  deleteButton.addEventListener("click", function () {
    deleteTodo(todo.id);
  });

  content.addEventListener("click", function (event) {
    if (event.target.closest("input, select, textarea, .todo-text, .todo-meta")) {
      return;
    }

    startEditingProgress(todo);
  });

  item.addEventListener("click", function (event) {
    if (event.target.closest("button, input, select, textarea, .todo-text, .todo-meta")) {
      return;
    }

    startEditingProgress(todo);
  });

  content.append(taskText, progress, meta);
  item.append(checkbox, content, deleteButton);

  return item;
}

function renderTodos() {
  activeInlineEditor = null;
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
transferButton.addEventListener("click", function () {
  transferOptions.hidden = !transferOptions.hidden;
});
exportButton.addEventListener("click", function () {
  transferOptions.hidden = true;
  exportTodos();
});
importButton.addEventListener("click", function () {
  transferOptions.hidden = true;
  importFile.click();
});
copySummaryButton.addEventListener("click", copyTodoSummary);
closeCopyFallback.addEventListener("click", function () {
  copyFallback.hidden = true;
});

document.addEventListener("click", function (event) {
  if (event.target.closest(".transfer-menu")) {
    return;
  }

  transferOptions.hidden = true;
});

document.addEventListener("pointerdown", function (event) {
  if (!activeInlineEditor || activeInlineEditor.element.contains(event.target)) {
    return;
  }

  closeActiveInlineEditor();
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    transferOptions.hidden = true;
  }
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
