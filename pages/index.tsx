import React, { useState, FC, FormEvent, ChangeEvent } from 'react';
import Layout from '../components/Layout'
import { GetServerSideProps } from 'next'
import { Task } from '../interfaces'
import { gql } from "graphql-request"
import useSWR from 'swr'

export interface IndexPageData {
  allTasks: {
    data: Task[];
  }
}

interface IndexPageProps {
  initialData: IndexPageData;
}

const query = gql`
  query AllTasksQuery {
    allTasks {
      data {
        _id
        title
        completed
      }
    }
  }
`;

const fetcher = async (query: string, variables: Record<string, string | boolean> = {}) => {
  const response = await fetch('http://localhost:3000/api/fauna', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error('An error occurred while executing a GraphQL query on Fauna.');
  }

  const data = await response.json();

  return data;
}

const IndexPage: FC<IndexPageProps> = ({ initialData }) => {
  const { data, error, mutate } = useSWR<IndexPageData, Error>(query, fetcher, { initialData });

  const [newTaskName, setNewTaskName] = useState('');
  const [renameTask, setRenameTask] = useState('');

  if (typeof data === 'undefined' || error) {
    return <div>Error while fetching data.</div>;
  }

  // SWR updates
  const addTask = (task: Task) => mutate({ allTasks: { data: [...data.allTasks.data, task] } });

  const deleteTask = (taskId: string) => mutate({ allTasks: { data: [...data.allTasks.data.filter(item => item._id !== taskId)] } });

  const completeTask = (taskId: string) => mutate({
    allTasks: {
      data: [...data.allTasks.data.map(item => {
        if (item._id == taskId) {
          return ({ ...item, completed: !item.completed })
        };
        return item;
      })]
    }
  });

  const updateTask = (task: Task) => mutate({
    allTasks: {
      data: [...data.allTasks.data.map(item => {
        if (item._id == task._id) {
          return ({ ...item, title: task.title })
        };
        return item;
      })]
    }
  });

  // ADD
  const handleAddTask = async (event: FormEvent) => {
    event.preventDefault();

    const result: { createTask: Task } = await fetcher(gql`
      mutation AddTask($title: String!) {
        createTask(data: {
          title: $title,
          completed: false
        }) {
          _id
          title
          completed
        }
      }
    `, { title: newTaskName });

    const newTask = result.createTask;

    addTask(newTask);

    setNewTaskName('');
  }

  // DELETE
  const handleDeleteTask = async (taskId: string) => {

    const result: { deleteTask: Task } = await fetcher(gql`
      mutation deleteTask($id: ID!) {
        deleteTask(id: $id) {
          _id
        }
      }
    `, { id: taskId });

    const deletedTaskId = result.deleteTask._id;

    deleteTask(deletedTaskId);

  }

  // UPDATE COMPLETED
  const handleCompleteTask = async (taskId: string, taskTitle: string, taskCompleted?: boolean) => {

    const result: { updateTask: Task } = await fetcher(gql`
      mutation updateTask($id: ID!, $title: String!, $completed: Boolean!) {
        updateTask(id: $id, data: { title: $title, completed: $completed }) {
          _id
          title
          completed
        }
      }
    `, { id: taskId, title: taskTitle, completed: !taskCompleted });

    const completedTaskId = result.updateTask._id;

    completeTask(completedTaskId);
  }

  // UPDATE TITLE
  const handleTaskNameUpdate = async (taskId: string) => {

    const result: { updateTask: Task } = await fetcher(gql`
      mutation updateTask($id: ID!, $title: String!) {
        updateTask(id: $id, data: { title: $title }) {
          _id, 
          title, 
          completed
        }
      }
    `, { id: taskId, title: renameTask});

    const updatedTask = result.updateTask;

    updateTask(updatedTask);

    setRenameTask('');
  }

  return (
    <Layout title="Home | Next.js + TypeScript Example">
      <h1>Task list</h1>
      <ul>
        {data.allTasks.data.map(
          task =>
            <li key={task._id}>
              <h3>
                {task.title}
              </h3>
              {task.completed ? 'done' : 'to do'}
              <div><input type="text" placeholder="Rename task..." onChange={(event: ChangeEvent<HTMLInputElement>) => setRenameTask(event.target.value)}/><button onClick={() => handleTaskNameUpdate(task._id)}>Rename</button></div>
              <div>
                <button onClick={() => handleDeleteTask(task._id)}>Remove</button>
                <button onClick={() => handleCompleteTask(task._id, task.title, task.completed)}>{task.completed ? "Undo" : "Complete"}</button>
              </div>
            </li>
        )}
      </ul>
      <form onSubmit={handleAddTask}>
        <input type="text" placeholder="New task name" value={newTaskName} onChange={(event: ChangeEvent<HTMLInputElement>) => setNewTaskName(event.target.value)} />
        <button type="submit">Add</button>
      </form>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const initialData = await fetcher(query);

  return { props: { initialData } };
}

export default IndexPage
