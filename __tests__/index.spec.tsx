import React, { FC, useState, useEffect } from 'react'
import { act } from 'react-dom/test-utils';
import {mount} from 'enzyme'
import { SWRConfig, cache } from 'swr'
import IndexPage, { IndexPageData } from '../pages/index';


const allTasksMock: IndexPageData = {
  allTasks: {
    data: [
      {
        _id: 'test0',
        title: "Test 0",
        completed: false,
      },
      {
        _id: 'test1',
        title: "Test 1",
        completed: false,
      },
      {
        _id: 'test2',
        title: "Test 2",
        completed: false,
      },
    ]
  }
}

const flushPromises = () => new Promise(setImmediate);

describe('IndexPage', () => {
  let wrapper;

  // Définit la liste des opérations à faire avant chaque test
  beforeEach(async () => {
    // Simule le résultat de l'API
    fetchMock.mockOnce(
      async (req) => {
        await setTimeout(()=>{}, 300);
        return JSON.stringify(allTasksMock)
      }
    );

    // Monte le composant dans le DOM
    act(
      async () => {
        wrapper = await mount(
          <SWRConfig value={{ dedupingInterval: 0 }}>
            <IndexPage initialData={allTasksMock} />
          </SWRConfig>
        );
      }
    )
  });

  // Définit la liste des opérations à faire avant chaque test
  afterEach(() => {
    // Efface toutes les simulations
    jest.clearAllMocks();
    // Efface le cache de SWR
    cache.clear();
  });

  // Teste que le composant rend bien une liste de tâches
  it('should render a list of tasks', async () => {
    // Teste que le composant rend bien le bon nombre d'éléments
    const taskItems = wrapper.find('li');
    expect(taskItems).toHaveLength(3);
    // Teste que chaque élément de la liste a bien le bon titre
    const taskHeaders = wrapper.find('li h3')
    expect(taskHeaders.at(0).text()).toBe('Test 0');
    expect(taskHeaders.at(1).text()).toBe('Test 1');
    expect(taskHeaders.at(2).text()).toBe('Test 2');
  });
})
