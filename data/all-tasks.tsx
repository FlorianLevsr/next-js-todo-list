import React, { createContext, ReactNode } from "react";
import { gql } from "graphql-request";
import { Task } from "../interfaces";
import useSWR from 'swr';

// Décrit la structure des données
export interface AllTasksData {
  allTasks: {
    data: Task[];
  }
}

// Décrit les données à récupérér de l'API
export const query = gql`
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

// Méthode permettant de récupérer les données de l'API
export const fetcher = (variables: Record<string, string | boolean> = {}) =>
  async (query: string) => {
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

interface AllTasksContextValue extends AllTasksData {
  actions: {
    addTask: (task: Task) => void;
    updateTask: (id: string, task: Task) => void;
    deleteTask: (id: string) => void;
  }
}

export const AllTasksContext = createContext<AllTasksContextValue>({
  allTasks: { data: [] },
  actions: {
    addTask: () => undefined,
    updateTask: () => undefined,
    deleteTask: () => undefined,
  }
});

interface AllTasksContextProviderProps {
  children: (contextValue: AllTasksContextValue) => ReactNode,
  initialData: AllTasksData;
}

export const AllTasksContextProvider = ({ children, initialData }: AllTasksContextProviderProps) => {
  const { data, mutate } = useSWR<AllTasksData, Error>(query, fetcher(), { initialData });

  if (typeof data === 'undefined') throw new Error('Data cannot be undefined in AllTasksContextProvider.');

  const { allTasks } = data;

  // Méthode permettant d'ajouter une nouvelle tâche aux tâches existantes
  const addTask = (task: Task) =>
    mutate(async () => {
      const result: { createTask: Task } = await fetcher({ ...task })(gql`
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
      `);

      return {
        allTasks: {
          data: [...allTasks.data, result.createTask]
        }
      };
    });

  // Méthode permettant de modifier une tâche existante
  const updateTask = (id: string, task: Task) =>
    mutate(async () => {
      const result: { updateTask: Task } = await fetcher({ id, ...task })(gql`
        mutation updateTask($id: ID!, $title: String!, $completed: Boolean) {
          updateTask(id: $id, data: {
            title: $title,
            completed: $completed
          }) {
            _id
            title
            completed
          }
        }
      `);

      return {
        allTasks: {
          data: allTasks.data.map(item => item._id == task._id ? result.updateTask : item)
        }
      };
    });

  // Méthode permettant de supprimer une tâche
  const deleteTask = (id: string) =>
    mutate(async () => {
      const result: { deleteTask: Task } = await fetcher({ id })(gql`
        mutation deleteTask($id: ID!) {
          deleteTask(id: $id) {
            _id
          }
        }
      `);

      return {
        allTasks: {
          data: allTasks.data.filter(item => item._id !== id)
        }
      };
    });

  const value = {
    ...data,
    actions: {
      addTask,
      updateTask,
      deleteTask,
    }
  }

  return (
    <AllTasksContext.Provider value={value}>
      {children(value)}
    </AllTasksContext.Provider>
  )
}
