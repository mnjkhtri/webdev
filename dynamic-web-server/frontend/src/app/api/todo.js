import axios from "axios";

const API_URL = process.env.API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Create a new todo
export const createTodo = async (todo) => {
    const response = await api.post("/", todo);
    return response.data;
};

// Get all todos (with optional pagination)
export const getTodos = async (skip = 0, limit = 10) => {
    const response = await api.get("/", { params: { skip, limit } });
    return response.data;
};

// Get a single todo by ID
export const getTodo = async (todoId) => {
    const response = await api.get(`/${todoId}`);
    return response.data;
};

// Update a todo
export const updateTodo = async (todoId, todo) => {
    const response = await api.put(`/${todoId}`, todo);
    return response.data;
};

// Delete a todo
export const deleteTodo = async (todoId) => {
    const response = await api.delete(`/${todoId}`);
    return response.data;
};