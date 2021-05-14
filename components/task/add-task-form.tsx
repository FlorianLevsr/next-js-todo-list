import React, { FC, ChangeEvent, useState, useContext } from 'react';
import {AllTasksContext} from '../../data/all-tasks';

const AddTaskForm: FC = () => {
  const [newTaskName, setNewTaskName] = useState('');
  const { actions } = useContext(AllTasksContext);

  return (
    <form onSubmit={(event) => { event.preventDefault(); actions.addTask({ _id: '', title: newTaskName }) }}>
      <input type="text" placeholder="New task name" value={newTaskName} onChange={(event: ChangeEvent<HTMLInputElement>) => setNewTaskName(event.target.value)} />
      <button type="submit">Add</button>
    </form>
  );
}


export default AddTaskForm