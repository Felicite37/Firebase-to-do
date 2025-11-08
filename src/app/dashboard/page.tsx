"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { Task } from "../../types";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Low");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch user tasks
  useEffect(() => {
    if (!user) return;
    const fetchTasks = async () => {
      const q = query(
        collection(db, "tasks"),
        where("userEmail", "==", user.email)
      );
      const snapshot = await getDocs(q);
      const tasksData: Task[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Task)
      );
      setTasks(tasksData);
    };
    fetchTasks();
  }, [user]);

  // Create or Update task
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingId) {
        // Update
        const taskRef = doc(db, "tasks", editingId);
        await updateDoc(taskRef, { title, description, priority });
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingId ? { ...t, title, description, priority } : t
          )
        );
        setEditingId(null);
      } else {
        // Create
        const docRef = await addDoc(collection(db, "tasks"), {
          title,
          description,
          priority,
          completed: false,
          userEmail: user.email,
        });
        setTasks((prev) => [
          ...prev,
          {
            id: docRef.id,
            title,
            description,
            priority,
            completed: false,
            userEmail: user.email,
          },
        ]);
      }
      setTitle("");
      setDescription("");
      setPriority("Low");
    } catch (err) {
      console.error("Error saving task:", err);
    }
  };

  // Edit task
  const handleEdit = (task: Task) => {
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setEditingId(task.id);
  };

  // Delete task
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "tasks", id));
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle completed
  const toggleCompleted = async (task: Task) => {
    const taskRef = doc(db, "tasks", task.id);
    await updateDoc(taskRef, { completed: !task.completed });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user) return <p className="text-center mt-20">Loading...</p>;

  return (
    <main className="flex flex-col items-center p-4 min-h-screen bg-gray-100">
      <div className="flex justify-between w-full max-w-2xl mb-6">
        <h1 className="text-3xl font-bold">Hello, {user.email}</h1>
        <button
          onClick={handleLogout}
          className="p-2 bg-red-500 text-white rounded"
        >
          Logout
        </button>
      </div>

      {/* Task Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 w-full max-w-2xl mb-6 p-4 bg-white rounded shadow"
      >
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="p-2 border rounded"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-2 border rounded"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          className="p-2 border rounded"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          {editingId ? "Update Task" : "Add Task"}
        </button>
      </form>

      {/* Task List */}
      <div className="w-full max-w-2xl flex flex-col gap-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 bg-white rounded shadow flex justify-between items-center"
          >
            <div>
              <h2
                className={`text-lg font-bold ${
                  task.completed ? "line-through" : ""
                }`}
              >
                {task.title} ({task.priority})
              </h2>
              <p className={task.completed ? "line-through" : ""}>
                {task.description}
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleCompleted(task)}
              />
              <button
                onClick={() => handleEdit(task)}
                className="p-1 bg-yellow-400 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(task.id)}
                className="p-1 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
