import axios from "axios";
import { Pencil, Trash, X } from "lucide-react";
import { useEffect, useState } from "react";
import "../../App.css";

type TodoType = {
  id: number;
  name: string;
  status: boolean;
};

export default function TodoList() {
  const [todos, setTodos] = useState<TodoType[]>([]);
  const [newTodo, setNewTodo] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<TodoType | null>(null);

  const fetchTodo = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:8080/Todo`);
      setTodos(response.data);
    } catch (error) {
      console.log("Error: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodo();
  }, []);

  const openDeleteModal = (todo: TodoType) => {
    setTodoToDelete(todo);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!todoToDelete) return;
    try {
      const response = await axios.delete(
        `http://localhost:8080/Todo/${todoToDelete.id}`
      );
      if (response.status === 200) {
        setTodos((prev) => prev.filter((t) => t.id !== todoToDelete.id));
      }
    } catch (error) {
      console.log("Error: ", error);
    } finally {
      setShowDeleteModal(false);
      setTodoToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTodoToDelete(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTodo(e.target.value);
  };

  const handleAddTodo = async (): Promise<void> => {
    const name = newTodo.trim();
    if (!name) return;
    try {
      const response = await axios.post(`http://localhost:8080/Todo`, {
        name,
        status: false,
      });
      if (response.status === 201) {
        setNewTodo("");
        setTodos((prev) => [...prev, response.data]);
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const isAllCompleted = (list: TodoType[]) =>
    list.length > 0 && list.every((t) => t.status === true);

  const handleToggleStatus = async (todo: TodoType) => {
    const prevTodos = todos;
    const prevAllCompleted = isAllCompleted(prevTodos);
    const updated: TodoType = { ...todo, status: !todo.status };
    const nextTodos = prevTodos.map((t) => (t.id === todo.id ? updated : t));
    setTodos(nextTodos);
    try {
      await axios.put(`http://localhost:8080/Todo/${todo.id}`, updated);
      const nextAllCompleted = isAllCompleted(nextTodos);
      if (!prevAllCompleted && nextAllCompleted) {
        alert(`Hoàn thành tất cả công việc 🎉`);
      }
    } catch (error) {
      setTodos(prevTodos);
    }
  };

  const startEdit = (todo: TodoType) => {
    setEditingId(todo.id);
    setEditingName(todo.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleUpdate = async (todo: TodoType) => {
    const name = editingName.trim();
    if (!name) {
      alert("Tên công việc không được để trống");
      return;
    }

    const prevTodos = todos;
    const updated: TodoType = { ...todo, name };
    const nextTodos = prevTodos.map((t) => (t.id === todo.id ? updated : t));
    setTodos(nextTodos);

    try {
      await axios.put(`http://localhost:8080/Todo/${todo.id}`, updated);
      setEditingId(null);
      setEditingName("");
    } catch (error) {
      console.log("Error: ", error);
      setTodos(prevTodos);
    }
  };

  return (
    <div className="todo-container">
      {isLoading && <div className="loading">Đang tải dữ liệu...</div>}
      <h2 className="todo-title">Quản lý công việc</h2>

      <div className="todo-form">
        <input
          type="text"
          placeholder="Nhập tên công việc"
          onChange={handleChange}
          value={newTodo}
          className="todo-input"
        />
        <button onClick={handleAddTodo} className="todo-add-btn">
          Thêm công việc
        </button>
      </div>

      <div className="todo-list">
        {todos.map((todo) => {
          const isEditing = editingId === todo.id;
          return (
            <div key={todo.id} className="todo-item">
              <div className="todo-left">
                <input
                  type="checkbox"
                  checked={todo.status}
                  onChange={() => handleToggleStatus(todo)}
                />

                {!isEditing ? (
                  <span
                    className={`todo-name ${todo.status ? "completed" : ""}`}
                  >
                    {todo.name}
                  </span>
                ) : (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(todo);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="todo-edit-input"
                    placeholder="Nhập tên mới..."
                  />
                )}
              </div>

              <div className="todo-actions">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => startEdit(todo)}
                      title="Chỉnh sửa"
                      className="edit-btn"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(todo)}
                      title="Xóa"
                      className="delete-btn"
                    >
                      <Trash size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleUpdate(todo)}
                      className="save-btn"
                    >
                      Lưu
                    </button>
                    <button onClick={cancelEdit} className="cancel-btn">
                      Hủy
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showDeleteModal && todoToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Xác nhận</h3>
              <button className="modal-close" onClick={handleCancelDelete}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Bạn có chắc chắn muốn xóa công việc <b>{todoToDelete.name}</b>{" "}
                không?
              </p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCancelDelete}>
                Hủy
              </button>
              <button className="delete-btn" onClick={handleConfirmDelete}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
