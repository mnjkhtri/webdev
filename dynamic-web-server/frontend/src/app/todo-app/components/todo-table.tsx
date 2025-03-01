"use client";

import { getData, postData, putData, deleteData } from "@/lib/fetchers";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Trash,
  PencilLine,
  CheckCircle,
  List,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TodoTable() {
  const [editingId, setEditingId] = useState(null);

  // Fetch todos
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["todos"],
    queryFn: () => getData("/todos"),
  });

  // Make sure todos is always an array
  const todos = Array.isArray(data) ? data : [];

  // Sort them by ID (or any stable property) before rendering
  const sortedTodos = [...todos].sort((a, b) => a.id - b.id);

  // Form setup
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = async (formData) => {
    try {
      if (editingId !== null) {
        // Update
        await putData(`/todos/${editingId}`, {
          ...formData,
          completed: todos.find((todo) => todo.id === editingId)?.completed || false,
        });
      } else {
        // Create
        await postData("/todos", { ...formData, completed: false });
      }
      form.reset();
      setEditingId(null);
      refetch();
    } catch (error) {
      console.error("Failed to save todo:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteData(`/todos/${id}`, {});
      refetch();
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const handleToggleComplete = async (id, currentStatus) => {
    try {
      const existingTodo = todos.find((todo) => todo.id === id);
      if (!existingTodo) return;

      await putData(`/todos/${id}`, {
        ...existingTodo,
        completed: !currentStatus,
      });
      refetch();
    } catch (error) {
      console.error("Failed to update todo status:", error);
    }
  };

  const handleEdit = (todo) => {
    form.reset({
      title: todo.title,
      description: todo.description,
    });
    setEditingId(todo.id);
  };

  // Calculate stats
  const completedCount = todos.filter(todo => todo.completed).length;
  const pendingCount = todos.length - completedCount;

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Keep track of your daily tasks</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{completedCount} Completed</Badge>
              <Badge variant="outline">{pendingCount} Pending</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="title"
                rules={{ required: "Title is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="What do you need to do?" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add some details..." 
                        {...field}
                        className="min-h-20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" variant='outline'>
                  {editingId !== null ? (
                    <span className="flex items-center gap-1">
                      <PencilLine size={16} /> Update Task
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Plus size={16} /> Add Task
                    </span>
                  )}
                </Button>
                {editingId !== null && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setEditingId(null);
                    }}
                  >
                    <span className="flex items-center gap-1">
                      <X size={16} /> Cancel
                    </span>
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <List className="h-5 w-5" />
            <CardTitle>Task List</CardTitle>
          </div>
          <Separator />
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center my-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          
          {!isLoading && todos.length === 0 && (
            <div className="flex flex-col justify-center items-center my-12 text-center">
              <CheckCircle className="h-16 w-16 text-muted mb-4" />
              <p className="text-muted-foreground">Nothing to do yet. Add your first task!</p>
            </div>
          )}
          
          {!isLoading && sortedTodos.length > 0 && (
            <div className="space-y-3 mt-2">
              {sortedTodos.map((todo) => (
                <Card 
                  key={todo.id} 
                  className={cn(
                    "transition-all",
                    todo.completed ? "bg-muted/50" : ""
                  )}
                >
                  <CardContent className="p-4 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Checkbox
                                checked={todo.completed}
                                onCheckedChange={() => handleToggleComplete(todo.id, todo.completed)}
                                className="h-5 w-5"
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              {todo.completed ? "Mark as incomplete" : "Mark as complete"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div>
                        <p className={cn(
                          "font-medium mb-1",
                          todo.completed ? "line-through text-muted-foreground" : ""
                        )}>
                          {todo.title}
                        </p>
                        <p className={cn(
                          "text-sm text-muted-foreground",
                          todo.completed ? "line-through opacity-70" : ""
                        )}>
                          {todo.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEdit(todo)}
                            >
                              <PencilLine size={14} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit task</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(todo.id)}
                            >
                              <Trash size={14} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete task</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}